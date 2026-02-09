import { TimelineClip, TimelineData, TimelineEffectClip } from '@/stores/studio';

type AssetResource = {
  element: HTMLVideoElement | HTMLImageElement | HTMLAudioElement;
  type: 'video' | 'image' | 'audio';
  mediaId: string;
  width: number;
  height: number;
  sourceNode?: MediaElementAudioSourceNode;
  gainNode?: GainNode;
  texture: WebGLTexture | null;
  textureLoaded?: boolean; // For images
};

export class VideoCompositor {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;

  // Programs
  private baseProgram: WebGLProgram | null = null;
  private effectPrograms: Map<string, WebGLProgram> = new Map();

  // Buffers
  private buffer: WebGLBuffer | null = null;

  // Audio
  private audioContext: AudioContext;

  // State
  private timeline: TimelineData | null = null;
  private assetCache: Map<string, AssetResource> = new Map();
  private resolveAsset:
    | ((mediaId: string) => Promise<{ url: string; mimeType: string } | null>)
    | null = null;
  private onNeedsRender: (() => void) | null = null;

  // Pass 1: Scene (Video Layers)

  // Pass 2: Effect (Post Processing)
  private sceneFrameBuffer: WebGLFramebuffer | null = null;
  private sceneTexture: WebGLTexture | null = null; // Result of Pass 1

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { alpha: false, preserveDrawingBuffer: true });
    if (!gl) {
      throw new Error('WebGL2 not supported');
    }
    this.gl = gl;
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    // Landscape target (Standard 16:9)
    this.canvas.width = 1920;
    this.canvas.height = 1080;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.initGL();
    this.initEffectPrograms();
  }

  private createShader(type: number, source: string) {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private createProgram(vsSource: string, fsSource: string) {
    const vs = this.createShader(this.gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;

    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error(this.gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  private initGL() {
    // 1. Base Program (Video/Image -> Screen/FBO)
    const vsSource = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      uniform vec2 u_resolution;
      uniform vec4 u_rect; // x, y, width, height
      uniform float u_vFlip; // 0.0 = normal, 1.0 = flipped

      void main() {
        vec2 pos = a_position * u_rect.zw + u_rect.xy;
        vec2 zeroToOne = pos / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        v_texCoord = vec2(a_texCoord.x, abs(u_vFlip - a_texCoord.y));
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      out vec4 outColor;
      uniform sampler2D u_image;
      uniform float u_opacity;

      void main() {
        vec4 color = texture(u_image, v_texCoord);
        outColor = vec4(color.rgb, color.a * u_opacity);
      }
    `;

    this.baseProgram = this.createProgram(vsSource, fsSource);

    // 2. Fullscreen Quad Buffer
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    const positions = new Float32Array([
      0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1,
    ]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    this.buffer = buffer;

    // 4. Scene FBO (Intermediate Canvas)
    // We render the video layers here first, then apply effects on top of ANY video content.
    this.sceneTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.sceneTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.canvas.width,
      this.canvas.height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null,
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    this.sceneFrameBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.sceneFrameBuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.sceneTexture,
      0,
    );
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  private initEffectPrograms() {
    // Common Vertex Shader for Effects (Just passes full screen quad)
    // The baseProgram VS uses rect projection, but effects usually just want full-screen.
    // However, to keep it simple, we can re-use the base VS and just pass full-screen rect.
    const vsSource = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      uniform vec2 u_resolution;
      uniform vec4 u_rect; 
      uniform float u_vFlip; 
      void main() {
        vec2 pos = a_position * u_rect.zw + u_rect.xy;
        vec2 zeroToOne = pos / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        v_texCoord = vec2(a_texCoord.x, abs(u_vFlip - a_texCoord.y));
      }
    `;

    // 1. Grayscale
    const grayFs = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      out vec4 outColor;
      uniform sampler2D u_image;
      uniform float u_intensity;
      void main() {
        vec4 original = texture(u_image, v_texCoord);
        float gray = dot(original.rgb, vec3(0.299, 0.587, 0.114));
        outColor = mix(original, vec4(vec3(gray), original.a), u_intensity);
      }
    `;
    const grayProg = this.createProgram(vsSource, grayFs);
    if (grayProg) this.effectPrograms.set('Grayscale', grayProg);

    // 2. Sepia
    const sepiaFs = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      out vec4 outColor;
      uniform sampler2D u_image;
      uniform float u_intensity;
      void main() {
        vec4 original = texture(u_image, v_texCoord);
        float r = dot(original.rgb, vec3(0.393, 0.769, 0.189));
        float g = dot(original.rgb, vec3(0.349, 0.686, 0.168));
        float b = dot(original.rgb, vec3(0.272, 0.534, 0.131));
        outColor = mix(original, vec4(r, g, b, original.a), u_intensity);
      }
    `;
    const sepiaProg = this.createProgram(vsSource, sepiaFs);
    if (sepiaProg) this.effectPrograms.set('Sepia', sepiaProg);

    // 3. Blur (Optimized 9-tap)
    const blurFs = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      out vec4 outColor;
      uniform sampler2D u_image;
      uniform vec2 u_resolution; 
      uniform float u_intensity;
      void main() {
          vec2 r = vec2(1.5) / u_resolution;
          vec4 original = texture(u_image, v_texCoord);
          vec4 blurred = original * 0.227027;
          
          blurred += texture(u_image, v_texCoord + vec2(r.x, 0.0)) * 0.1945946;
          blurred += texture(u_image, v_texCoord - vec2(r.x, 0.0)) * 0.1945946;
          blurred += texture(u_image, v_texCoord + vec2(0.0, r.y)) * 0.1945946;
          blurred += texture(u_image, v_texCoord - vec2(0.0, r.y)) * 0.1945946;

          outColor = mix(original, vec4(blurred.rgb, 1.0), u_intensity);
      }
    `;
    const blurProg = this.createProgram(vsSource, blurFs);
    if (blurProg) this.effectPrograms.set('Blur', blurProg);

    // 4. Glitch
    const glitchFs = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      out vec4 outColor;
      uniform sampler2D u_image;
      uniform float u_intensity;
      void main() {
          float strength = 0.02 * u_intensity;
          vec4 original = texture(u_image, v_texCoord);
          float r = texture(u_image, v_texCoord + vec2(strength, 0)).r;
          float g = original.g;
          float b = texture(u_image, v_texCoord - vec2(strength, 0)).b;
          outColor = vec4(r, g, b, original.a);
      }
    `;
    const glitchProg = this.createProgram(vsSource, glitchFs);
    if (glitchProg) this.effectPrograms.set('Glitch', glitchProg);

    // 5. Pixelate
    const pixelateFs = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      out vec4 outColor;
      uniform sampler2D u_image;
      uniform vec2 u_resolution;
      uniform float u_intensity;
      void main() {
          vec4 original = texture(u_image, v_texCoord);
          float pixels = mix(1024.0, 64.0, u_intensity); 
          vec2 uv = floor(v_texCoord * pixels) / pixels;
          outColor = texture(u_image, uv);
      }
    `;
    // 6. Zoom
    const zoomFs = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      out vec4 outColor;
      uniform sampler2D u_image;
      uniform float u_level;
      uniform float u_intensity;
      void main() {
          float scale = 1.0 + (u_level - 1.0) * u_intensity;
          vec2 uv = (v_texCoord - 0.5) / scale + 0.5;
          outColor = texture(u_image, uv);
      }
    `;
    const zoomProg = this.createProgram(vsSource, zoomFs);
    if (zoomProg) this.effectPrograms.set('Zoom', zoomProg);
  }

  public setAssetResolver(
    resolver: (mediaId: string) => Promise<{ url: string; mimeType: string } | null>,
  ) {
    this.resolveAsset = resolver;
  }

  public setOnNeedsRender(cb: () => void) {
    this.onNeedsRender = cb;
  }

  private getMediaId(clip: any): string | undefined {
    return clip?.mediaId;
  }

  public async loadTimeline(timeline: TimelineData) {
    this.timeline = timeline;
    const clips: TimelineClip[] = [];

    // Extract all unique mediaIds
    timeline.tracks.forEach((track) => {
      track.children.forEach((child) => {
        if (child.type === 'Clip') {
          clips.push(child as TimelineClip);
        }
      });
    });

    // Warm up cache
    await Promise.all(
      clips.map(async (clip) => {
        const mediaId = this.getMediaId(clip);
        if (mediaId && !this.assetCache.has(mediaId)) {
          await this.loadAsset(mediaId);
        }
      }),
    );

    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  private setupAudioGraph(
    element: HTMLMediaElement,
  ): { source: MediaElementAudioSourceNode; gain: GainNode } | undefined {
    try {
      const source = this.audioContext.createMediaElementSource(element);
      const gain = this.audioContext.createGain();
      source.connect(gain);
      gain.connect(this.audioContext.destination);
      return { source, gain };
    } catch (e) {
      console.error('Failed to setup audio graph', e);
      return undefined;
    }
  }

  private async loadAsset(mediaId: string): Promise<AssetResource | null> {
    if (this.assetCache.has(mediaId)) return this.assetCache.get(mediaId)!;
    if (!this.resolveAsset) return null;

    const data = await this.resolveAsset(mediaId);
    if (!data) return null;

    return new Promise((resolve) => {
      const isVideo = data.mimeType.startsWith('video/');
      const isAudio = data.mimeType.startsWith('audio/');

      let element: HTMLVideoElement | HTMLImageElement | HTMLAudioElement;
      let type: 'video' | 'image' | 'audio';

      if (isVideo) {
        element = document.createElement('video');
        type = 'video';
      } else if (isAudio) {
        element = document.createElement('audio');
        type = 'audio';
      } else {
        element = new Image();
        type = 'image';
      }

      const resource: AssetResource = {
        element,
        type,
        mediaId,
        width: 0,
        height: 0,
        texture: type === 'audio' ? null : this.gl.createTexture(),
      };

      if (type === 'video') {
        const v = element as HTMLVideoElement;
        v.src = data.url;
        v.crossOrigin = 'anonymous';
        v.muted = false; // Important: Must be false for WebAudio
        v.preload = 'auto';

        // Setup Audio Graph
        const audioNodes = this.setupAudioGraph(v);
        if (audioNodes) {
          resource.sourceNode = audioNodes.source;
          resource.gainNode = audioNodes.gain;
        }

        v.onloadedmetadata = () => {
          resource.width = v.videoWidth;
          resource.height = v.videoHeight;

          // Initialize texture parameters
          this.gl.bindTexture(this.gl.TEXTURE_2D, resource.texture);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

          this.assetCache.set(mediaId, resource);
          resolve(resource);
        };
      } else if (type === 'audio') {
        const a = element as HTMLAudioElement;
        a.src = data.url;
        a.crossOrigin = 'anonymous';

        // Setup Audio Graph
        const audioNodes = this.setupAudioGraph(a);
        if (audioNodes) {
          resource.sourceNode = audioNodes.source;
          resource.gainNode = audioNodes.gain;
        }

        a.onloadedmetadata = () => {
          this.assetCache.set(mediaId, resource);
          resolve(resource);
        };
      } else {
        const img = element as HTMLImageElement;
        img.src = data.url;
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          resource.width = img.naturalWidth;
          resource.height = img.naturalHeight;

          // Initialize texture parameters and upload once
          this.gl.bindTexture(this.gl.TEXTURE_2D, resource.texture);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

          this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            img,
          );
          resource.textureLoaded = true;

          this.assetCache.set(mediaId, resource);
          resolve(resource);
        };
      }
    });
  }

  private calculateFit(srcW: number, srcH: number, dstW: number, dstH: number) {
    const srcRatio = srcW / srcH;
    const dstRatio = dstW / dstH;
    let w = dstW,
      h = dstH,
      x = 0,
      y = 0;

    if (srcRatio > dstRatio) {
      w = dstW;
      h = w / srcRatio;
      y = (dstH - h) / 2;
    } else {
      h = dstH;
      w = h * srcRatio;
      x = (dstW - w) / 2;
    }
    return { x, y, width: w, height: h };
  }

  public render(currentTime: number, isPlaying: boolean) {
    if (!this.timeline || !this.gl || !this.baseProgram) return;
    if (!this.sceneFrameBuffer) return;

    const currentTimeMs = currentTime * 1000;

    // Resume AudioContext if needed
    if (isPlaying && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    // 1. Pre-pass: Identify active media and effect
    const activeMediaIds = new Set<string>();
    let activeEffect: TimelineEffectClip | null = null;

    for (const track of this.timeline.tracks) {
      for (const item of track.children) {
        if (currentTimeMs >= item.start && currentTimeMs < item.start + item.duration) {
          if (item.type === 'Effect') {
            activeEffect = item as TimelineEffectClip;
          } else if (item.type === 'Clip') {
            const mId = this.getMediaId(item);
            if (mId) activeMediaIds.add(mId);
          }
        }
      }
    }

    // 2. Resource Management: Play/Pause/Sync/Pre-warm
    const prewarmThresholdMs = 1500; // 1.5s pre-warm
    const upcomingMediaIds = new Set<string>();

    for (const track of this.timeline.tracks) {
      for (const item of track.children) {
        if (item.type !== 'Clip') continue;
        const start = item.start;
        // Identify clips starting soon
        if (currentTimeMs < start && currentTimeMs >= start - prewarmThresholdMs) {
          const mId = this.getMediaId(item);
          if (mId) upcomingMediaIds.add(mId);
        }
      }
    }

    this.assetCache.forEach((resource, mediaId) => {
      if (resource.type === 'video' || resource.type === 'audio') {
        const mediaEl = resource.element as HTMLVideoElement | HTMLAudioElement;
        const isActive = activeMediaIds.has(mediaId);
        const isUpcoming = upcomingMediaIds.has(mediaId);

        if (isActive && isPlaying) {
          if (mediaEl.paused) {
            mediaEl.play().catch(() => {});
          }
        } else {
          if (!mediaEl.paused) {
            mediaEl.pause();
          }
          // If upcoming, pre-seek to start frame
          if (isUpcoming && !isActive) {
            const clip = this.timeline?.tracks
              .flatMap((t: any) => t.children)
              .find((c: any) => c.mediaId === mediaId && c.start > currentTimeMs);
            if (clip) {
              const startSeek = (clip.sourceStart || 0) / 1000;
              if (Math.abs(mediaEl.currentTime - startSeek) > 0.1) {
                mediaEl.currentTime = startSeek;
              }
            }
          }
        }
      }
    });

    // --- PASS 1: RENDER SCENE TO FBO ---
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.sceneFrameBuffer);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.useProgram(this.baseProgram);

    // Bind Base Program Attributes
    const posLoc = this.gl.getAttribLocation(this.baseProgram, 'a_position');
    const texLoc = this.gl.getAttribLocation(this.baseProgram, 'a_texCoord');
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.enableVertexAttribArray(texLoc);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 16, 0);
    this.gl.vertexAttribPointer(texLoc, 2, this.gl.FLOAT, false, 16, 8);

    const resLoc = this.gl.getUniformLocation(this.baseProgram, 'u_resolution');
    this.gl.uniform2f(resLoc, this.canvas.width, this.canvas.height);
    const rectLoc = this.gl.getUniformLocation(this.baseProgram, 'u_rect');
    const opacityLoc = this.gl.getUniformLocation(this.baseProgram, 'u_opacity');
    const vFlipLoc = this.gl.getUniformLocation(this.baseProgram, 'u_vFlip');

    const tracks = [...this.timeline.tracks];

    for (const track of tracks) {
      for (const item of track.children) {
        if (item.type !== 'Clip') continue;

        const startMs = item.start;
        const durationMs = item.duration;
        const endMs = startMs + durationMs;

        if (currentTimeMs >= startMs && currentTimeMs < endMs) {
          const clip = item as TimelineClip;
          const mediaId = this.getMediaId(clip);
          const resource = mediaId ? this.assetCache.get(mediaId) : null;

          if (resource) {
            const el = resource.element;
            const sourceStartMs = clip.sourceStart;
            const elapsedMs = currentTimeMs - startMs;
            const remainingMs = endMs - currentTimeMs;
            const targetSeek = (sourceStartMs + elapsedMs) / 1000;

            if (resource.type === 'video' || resource.type === 'audio') {
              const mediaEl = el as HTMLVideoElement | HTMLAudioElement;

              if (!mediaEl.seeking) {
                const diff = mediaEl.currentTime - targetSeek;
                // Tighten threshold: 80ms is enough to warrant a hard seek for clean cuts
                if (Math.abs(diff) > 0.08) {
                  mediaEl.currentTime = targetSeek;
                } else if (diff < -0.02) {
                  mediaEl.playbackRate = 1.02; // Subtle catch up
                } else if (diff > 0.02) {
                  mediaEl.playbackRate = 0.98; // Subtle slow down
                } else {
                  mediaEl.playbackRate = 1.0;
                }
              }

              // --- AUDIO VOLUME & BLENDING LOGIC ---
              if (resource.gainNode) {
                let targetVolume = 0;

                if (track.kind === 'Audio') {
                  const vol =
                    clip.metadata?.volume !== undefined ? Number(clip.metadata.volume) : 1.0;
                  const fadeIn = Number(clip.metadata?.fadeIn || 0);
                  const fadeOut = Number(clip.metadata?.fadeOut || 0);

                  let alpha = 1.0;
                  if (fadeIn > 0 && elapsedMs < fadeIn) {
                    alpha = elapsedMs / fadeIn;
                  } else if (fadeOut > 0 && remainingMs < fadeOut) {
                    alpha = remainingMs / fadeOut;
                  }

                  targetVolume = vol * alpha;
                }

                // Apply immediately to handle rapid sync
                resource.gainNode.gain.value = Math.max(0, Math.min(1.0, targetVolume));
              }

              if (resource.type === 'video') {
                this.updateTexture(el as HTMLVideoElement, resource.texture);
              }
            } else if (resource.type === 'image') {
              // Image path - already updated once in loadAsset, just bind here
              this.gl.bindTexture(this.gl.TEXTURE_2D, resource.texture);
            }

            // Draw Video/Image to FBO
            if (track.kind === 'Video' && resource.type !== 'audio' && resource.texture) {
              const fit = this.calculateFit(
                resource.width,
                resource.height,
                this.canvas.width,
                this.canvas.height,
              );

              const zoom = clip.metadata?.zoom || 1.0;
              const panX = clip.metadata?.panX || 0;
              const panY = clip.metadata?.panY || 0;

              const baseWidth = fit.width * zoom;
              const baseHeight = fit.height * zoom;

              // Center + Pan
              const baseX = fit.x - (baseWidth - fit.width) / 2 + panX;
              const baseY = fit.y - (baseHeight - fit.height) / 2 + panY;

              // --- TRANSITION LOGIC ---
              let opacity = 1.0;
              let x = baseX;
              let y = baseY;
              let width = baseWidth;
              let height = baseHeight;

              const tIn = clip.metadata?.transitionIn; // 'fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'zoom'
              const tInDuration = Number(clip.metadata?.transitionInDuration || 0);
              const tOut = clip.metadata?.transitionOut;
              const tOutDuration = Number(clip.metadata?.transitionOutDuration || 0);

              if (tInDuration > 0 && elapsedMs < tInDuration) {
                const progress = elapsedMs / tInDuration; // 0 -> 1
                if (tIn === 'fade') {
                  opacity = progress;
                } else if (tIn === 'slide-left') {
                  x = baseX - this.canvas.width * (1.0 - progress);
                } else if (tIn === 'slide-right') {
                  x = baseX + this.canvas.width * (1.0 - progress);
                } else if (tIn === 'slide-up') {
                  y = baseY + this.canvas.height * (1.0 - progress);
                } else if (tIn === 'slide-down') {
                  y = baseY - this.canvas.height * (1.0 - progress);
                } else if (tIn === 'zoom') {
                  width = baseWidth * progress;
                  height = baseHeight * progress;
                  x = baseX + (baseWidth - width) / 2;
                  y = baseY + (baseHeight - height) / 2;
                }
              } else if (tOutDuration > 0 && remainingMs < tOutDuration) {
                const progress = remainingMs / tOutDuration; // 1 -> 0
                if (tOut === 'fade') {
                  opacity = progress;
                } else if (tOut === 'slide-left') {
                  x = baseX - this.canvas.width * (1.0 - progress);
                } else if (tOut === 'slide-right') {
                  x = baseX + this.canvas.width * (1.0 - progress);
                } else if (tOut === 'slide-up') {
                  y = baseY + this.canvas.height * (1.0 - progress);
                } else if (tOut === 'slide-down') {
                  y = baseY - this.canvas.height * (1.0 - progress);
                } else if (tOut === 'zoom') {
                  width = baseWidth * progress;
                  height = baseHeight * progress;
                  x = baseX + (baseWidth - width) / 2;
                  y = baseY + (baseHeight - height) / 2;
                }
              }

              this.gl.uniform4f(rectLoc, x, y, width, height);
              this.gl.uniform1f(opacityLoc, opacity);
              this.gl.uniform1f(vFlipLoc, 0.0); // Pass 1: No Flip
              this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
            }
          }
        }
      }
    }

    // --- PASS 2: RENDER SCENE FBO TO SCREEN (WITH EFFECTS) ---
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    const programToUse = activeEffect
      ? this.effectPrograms.get(activeEffect.effectType)
      : this.baseProgram;
    const finalProgram = programToUse || this.baseProgram!;

    this.gl.useProgram(finalProgram);

    // Bind Attributes for Final PASS
    const pLoc = this.gl.getAttribLocation(finalProgram, 'a_position');
    const tLoc = this.gl.getAttribLocation(finalProgram, 'a_texCoord');
    this.gl.enableVertexAttribArray(pLoc);
    this.gl.enableVertexAttribArray(tLoc);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.vertexAttribPointer(pLoc, 2, this.gl.FLOAT, false, 16, 0);
    this.gl.vertexAttribPointer(tLoc, 2, this.gl.FLOAT, false, 16, 8);

    const rResLoc = this.gl.getUniformLocation(finalProgram, 'u_resolution');
    this.gl.uniform2f(rResLoc, this.canvas.width, this.canvas.height);

    // If using base program, we need the u_rect full screen
    if (finalProgram === this.baseProgram) {
      const rRect = this.gl.getUniformLocation(finalProgram, 'u_rect');
      this.gl.uniform4f(rRect, 0, 0, this.canvas.width, this.canvas.height);
      const rOp = this.gl.getUniformLocation(finalProgram, 'u_opacity');
      this.gl.uniform1f(rOp, 1.0);
      const rVFlip = this.gl.getUniformLocation(finalProgram, 'u_vFlip');
      this.gl.uniform1f(rVFlip, 1.0); // Pass 2: Flip FBO result
    } else {
      // Effect Programs
      const rRect = this.gl.getUniformLocation(finalProgram, 'u_rect');
      this.gl.uniform4f(rRect, 0, 0, this.canvas.width, this.canvas.height);
      const rVFlip = this.gl.getUniformLocation(finalProgram, 'u_vFlip');
      this.gl.uniform1f(rVFlip, 1.0); // Pass 2: Flip FBO result

      // --- CALCULATE AND SET INTENSITY (EASING) ---
      if (activeEffect) {
        let intensity = 1.0;
        const params = activeEffect.parameters || {};
        const easeInThreshold = Number(params.easeIn) || 0;
        const easeOutThreshold = Number(params.easeOut) || 0;

        const elapsed = currentTimeMs - activeEffect.start;
        const remaining = activeEffect.start + activeEffect.duration - currentTimeMs;

        if (easeInThreshold > 0 && elapsed < easeInThreshold) {
          intensity = elapsed / easeInThreshold;
        } else if (easeOutThreshold > 0 && remaining < easeOutThreshold) {
          intensity = remaining / easeOutThreshold;
        }

        const intensityLoc = this.gl.getUniformLocation(finalProgram, 'u_intensity');
        this.gl.uniform1f(intensityLoc, Math.max(0, Math.min(1.0, intensity)));

        // Effect-specific parameters
        if (activeEffect.effectType === 'Zoom') {
          const levelLoc = this.gl.getUniformLocation(finalProgram, 'u_level');
          const level = Number(params.level) || 1.2;
          this.gl.uniform1f(levelLoc, level);
        }
      }
    }

    // Bind the Scene Texture (the result of Pass 1)
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.sceneTexture);
    // Effects usually assume u_image is unit 0

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private updateTexture(source: HTMLVideoElement | HTMLImageElement, texture: WebGLTexture | null) {
    if (!texture) return;
    if (source instanceof HTMLVideoElement && source.readyState < 2) return;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      source,
    );
  }

  public dispose() {
    this.assetCache.forEach((res) => {
      if (res.type === 'video' || res.type === 'audio') {
        const v = res.element as HTMLVideoElement | HTMLAudioElement;
        v.pause();
        v.src = '';
        v.load();
      }
      if (res.sourceNode) res.sourceNode.disconnect();
      if (res.gainNode) res.gainNode.disconnect();
    });

    this.assetCache.clear();

    if (this.audioContext) {
      this.audioContext.close();
    }

    if (this.gl) {
      if (this.baseProgram) this.gl.deleteProgram(this.baseProgram);
      this.effectPrograms.forEach((p) => this.gl.deleteProgram(p));
      this.assetCache.forEach((res) => {
        if (res.texture) this.gl.deleteTexture(res.texture);
      });
      if (this.sceneTexture) this.gl.deleteTexture(this.sceneTexture);
      if (this.sceneFrameBuffer) this.gl.deleteFramebuffer(this.sceneFrameBuffer);
      if (this.buffer) this.gl.deleteBuffer(this.buffer);
    }
  }
}
