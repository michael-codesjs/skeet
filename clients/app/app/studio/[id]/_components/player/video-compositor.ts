import { OTIOClip, OTIOTimeline } from '@/stores/studio';

type VideoResource = {
  element: HTMLVideoElement;
  loaded: boolean;
  url: string;
};

// Simple vertex shader
const VERT_SHADER = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  vUv = uv;
}
`;

// Fragment shader with RGB split capability
const FRAG_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform sampler2D uTextureTo; 
uniform float uTransitionProgress; // 0.0 = uTexture only, 1.0 = uTextureTo only
uniform int uTransitionType; // 0 = none, 1 = crossfade

uniform float uGlitch; // 0.0 = none, 1.0 = full glitch
uniform float uFilter; // 0.0 = none, 1.0 = grayscale
uniform float uScale;  // 1.0 = none, >1.0 = zoom in

void main() {
  vec2 uv = vUv;
  
  // Apply Zoom
  if (uScale > 1.0) {
    uv = (uv - 0.5) / uScale + 0.5;
  }

  // Sample Textures
  vec4 colorFrom = texture2D(uTexture, uv);
  vec4 colorTo = texture2D(uTextureTo, uv);
  
  vec4 color = colorFrom;

  // Apply Transition
  if (uTransitionType == 1) {
    // Crossfade
    color = mix(colorFrom, colorTo, uTransitionProgress);
  } else if (uTransitionType == 2) { 
     // Slide Left
     float x = uv.x + (1.0 - uTransitionProgress); 
     if (x > 1.0) {
        // incoming texture from right
        vec2 uv2 = vec2(uv.x - uTransitionProgress, uv.y);
        color = texture2D(uTextureTo, uv2);
     } else {
        color = colorFrom;
     }
  } 
  
  // Apply Glitch
  if (uGlitch > 0.0) {
    float offset = 0.02 * uGlitch;
    float r = texture2D(uTexture, uv + vec2(offset, 0.0)).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - vec2(offset, 0.0)).b;
    // Apply shift to result color roughly
    color.r = mix(color.r, r, 0.5); 
    color.g = g;
    color.b = b;
    // Note: This naive glitch on transition is tricky without re-sampling both textures with offset. 
    // For MVP we just let glitch look a bit weird or apply only to untransitioned.
  }

  // Apply Grayscale
  if (uFilter > 0.5) {
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color = vec4(vec3(gray), color.a);
  }

  gl_FragColor = color;
}
`;

export class VideoCompositor {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private videos: Map<string, VideoResource> = new Map(); // Keyed by mediaId
  private resolveAsset: ((mediaId: string) => Promise<string | null>) | null = null;
  private timeline: OTIOTimeline | null = null;
  private texture: WebGLTexture | null = null;
  private textureTo: WebGLTexture | null = null; // Second texture unit for transitions

  // Cache attribute/uniform locations
  private attribs: { position: number; uv: number } | null = null;
  private uniforms: {
    uGlitch: WebGLUniformLocation | null;
    uFilter: WebGLUniformLocation | null;
    uScale: WebGLUniformLocation | null;
    uTexture: WebGLUniformLocation | null;
    uTextureTo: WebGLUniformLocation | null;
    uTransitionProgress: WebGLUniformLocation | null;
    uTransitionType: WebGLUniformLocation | null;
  } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    this.initShaders();
    this.initBuffers();
    this.initTexture();
  }

  private initShaders() {
    const gl = this.gl;
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vert = createShader(gl.VERTEX_SHADER, VERT_SHADER);
    const frag = createShader(gl.FRAGMENT_SHADER, FRAG_SHADER);

    if (!vert || !frag) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    this.program = program;
    gl.useProgram(program);

    this.attribs = {
      position: gl.getAttribLocation(program, 'position'),
      uv: gl.getAttribLocation(program, 'uv'),
    };

    this.uniforms = {
      uGlitch: gl.getUniformLocation(program, 'uGlitch'),
      uFilter: gl.getUniformLocation(program, 'uFilter'),
      uScale: gl.getUniformLocation(program, 'uScale'),
      uTexture: gl.getUniformLocation(program, 'uTexture'),
      uTextureTo: gl.getUniformLocation(program, 'uTextureTo'),
      uTransitionProgress: gl.getUniformLocation(program, 'uTransitionProgress'),
      uTransitionType: gl.getUniformLocation(program, 'uTransitionType'),
    };

    // Set texture units once
    gl.uniform1i(this.uniforms.uTexture, 0);
    gl.uniform1i(this.uniforms.uTextureTo, 1);
  }

  private initBuffers() {
    const gl = this.gl;
    // Full screen quad
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const uvs = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    if (this.attribs) {
      gl.enableVertexAttribArray(this.attribs.position);
      gl.vertexAttribPointer(this.attribs.position, 2, gl.FLOAT, false, 0, 0);
    }

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    if (this.attribs) {
      gl.enableVertexAttribArray(this.attribs.uv);
      gl.vertexAttribPointer(this.attribs.uv, 2, gl.FLOAT, false, 0, 0);
    }
  }

  private initTexture() {
    const gl = this.gl;

    // Texture 0
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.texture = tex;

    // Texture 1
    const texTo = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texTo);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.textureTo = texTo;
  }

  public setAssetResolver(resolver: (mediaId: string) => Promise<string | null>) {
    this.resolveAsset = resolver;
  }

  private getMediaId(clip: any): string | undefined {
    return clip?.metadata?.mediaId || clip?.media_reference?.metadata?.mediaId;
  }

  public async loadTimeline(timeline: OTIOTimeline) {
    this.timeline = timeline;

    const tracks = timeline.tracks.children;

    for (const track of tracks) {
      for (const item of track.children) {
        if (item.OTIO_SCHEMA.startsWith('Clip.')) {
          const clip = item as OTIOClip;
          const mediaId = this.getMediaId(clip);
          if (mediaId) {
            await this.ensureVideo(mediaId);
          }
        }
      }
    }
  }

  private async ensureVideo(mediaId: string) {
    if (this.videos.has(mediaId)) return;
    if (!this.resolveAsset) return;

    const url = await this.resolveAsset(mediaId);
    if (!url) return;

    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.muted = false;
    video.playsInline = true;
    video.preload = 'auto';

    this.videos.set(mediaId, { element: video, loaded: false, url });
  }

  public render(globalTimeSeconds: number, isPlaying: boolean) {
    if (!this.timeline || !this.gl || !this.program) return;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // 1. Identify all active clips at this time
    const activeClips: { clip: OTIOClip; trackKind: string; clipOffset: number }[] = [];
    let visualClip = null as {
      clip: OTIOClip;
      clipOffset: number;
      transitionProgress?: number;
      prevClip?: OTIOClip;
    } | null;
    let highestVideoTrackIndex = -1;

    this.timeline.tracks.children.forEach((track, trackIndex) => {
      let currentTimePointer = 0;
      let prevItem: OTIOClip | null = null;

      for (const item of track.children) {
        const duration = item.source_range.duration.value / item.source_range.duration.rate;
        const clipStart = currentTimePointer;
        const clipEnd = currentTimePointer + duration;

        // Visual Winner Logic

        if (globalTimeSeconds >= clipStart && globalTimeSeconds < clipEnd) {
          if (item.OTIO_SCHEMA.startsWith('Clip.')) {
            const clip = item as OTIOClip;
            activeClips.push({ clip, trackKind: track.kind, clipOffset: clipStart });

            // Check for transition at start of this clip
            let transitionProgress = -1;
            let previousClipForTransition: OTIOClip | null = null;

            if (clip.transition && prevItem) {
              const transDur = clip.transition.duration;
              const timeIntoClip = globalTimeSeconds - clipStart;

              if (timeIntoClip < transDur) {
                transitionProgress = timeIntoClip / transDur;
                previousClipForTransition = prevItem;
              }
            }

            if (track.kind === 'Video' && trackIndex > highestVideoTrackIndex) {
              highestVideoTrackIndex = trackIndex;
              visualClip = {
                clip,
                clipOffset: clipStart,
                transitionProgress: transitionProgress >= 0 ? transitionProgress : undefined,
                prevClip: previousClipForTransition || undefined,
              };
            }
          }
        }

        if (item.OTIO_SCHEMA.startsWith('Clip.')) {
          prevItem = item as OTIOClip;
        } else {
          prevItem = null; // Gap breaks transition chain usually
        }

        currentTimePointer += duration;
      }
    });

    // 2. Manage Playback for ALL video elements (Audio & Video tracks)
    const activeIds = new Set(
      activeClips.map((c) => this.getMediaId(c.clip)).filter(Boolean) as string[],
    );
    const prevMediaId = this.getMediaId(visualClip?.prevClip);
    if (prevMediaId) {
      activeIds.add(prevMediaId);
    }

    this.videos.forEach((res, mediaId) => {
      const isActive = activeIds.has(mediaId);

      if (!isActive) {
        if (!res.element.paused) res.element.pause();
        return;
      }

      const triggeringClips = activeClips.filter((c) => this.getMediaId(c.clip) === mediaId);
      const primaryTrigger = triggeringClips[0]; // Just use first one for timing sync

      // Muting Logic: Only play audio if at least one active instance is on an AUDIO track
      const hasAudioTrackInstance = triggeringClips.some((c) => c.trackKind === 'Audio');
      res.element.muted = !hasAudioTrackInstance;

      // If this video is the Previous Clip in a transition, we don't sync it to global time directly
      // because global time is now past it. We just let it hold last frame or play if it has length.
      if (this.getMediaId(visualClip?.prevClip) === mediaId && !primaryTrigger) {
        // Just let it be (paused on last frame is ideal, likely state if it just finished)
        return;
      }

      if (primaryTrigger) {
        const { clip, clipOffset } = primaryTrigger;
        const clipLocalTime = globalTimeSeconds - clipOffset;
        const sourceStartTime =
          clip.source_range.start_time.value / clip.source_range.start_time.rate;
        const targetVideoTime = sourceStartTime + clipLocalTime;

        if (isPlaying) {
          if (res.element.paused) res.element.play().catch(() => {});
          if (Math.abs(res.element.currentTime - targetVideoTime) > 0.3) {
            res.element.currentTime = targetVideoTime;
          }
        } else {
          if (!res.element.paused) res.element.pause();
          if (Math.abs(res.element.currentTime - targetVideoTime) > 0.1) {
            res.element.currentTime = targetVideoTime;
          }
        }
      }
    });

    // 3. Render Visuals
    const visualMediaId = this.getMediaId(visualClip?.clip);
    if (visualClip && visualMediaId) {
      const res = this.videos.get(visualMediaId);
      if (res && res.element) {
        const clip = visualClip.clip as OTIOClip;
        const metadata = (clip as any).metadata || {};

        let isGlitch = metadata.glitch === true;
        let filterType = metadata.filter;
        let scale = 1.0;

        // Process Timed Effects
        const clipLocalTime = globalTimeSeconds - visualClip.clipOffset;

        if (clip.effects) {
          clip.effects.forEach((effect) => {
            const start = effect.start_offset || 0;
            const duration = effect.duration || 0.1; // Prevent div/0

            if (clipLocalTime >= start && clipLocalTime < start + duration) {
              if (effect.effect_name === 'Zoom') {
                const targetScale = effect.metadata?.scale || 1.2;
                const mode = effect.metadata?.mode || 'in';

                // Calculate progress (0.0 to 1.0)
                const t = Math.min(1, Math.max(0, (clipLocalTime - start) / duration));

                if (mode === 'bounce') {
                  // 0 -> 1 -> 0 transition
                  let phase: number;
                  if (t < 0.5) {
                    // Zooming In (0.0 to 1.0 over first half)
                    phase = t * 2;
                    const ease =
                      phase < 0.5 ? 4 * phase * phase * phase : 1 - Math.pow(-2 * phase + 2, 3) / 2;
                    scale = 1.0 + (targetScale - 1.0) * ease;
                  } else {
                    // Zooming Out (1.0 to 0.0 over second half)
                    phase = (t - 0.5) * 2;
                    const ease =
                      phase < 0.5 ? 4 * phase * phase * phase : 1 - Math.pow(-2 * phase + 2, 3) / 2;
                    scale = targetScale - (targetScale - 1.0) * ease;
                  }
                } else {
                  // Standard Ease In
                  const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                  scale = 1.0 + (targetScale - 1.0) * ease;
                }
              }
              if (effect.effect_name === 'Glitch') {
                isGlitch = true;
              }
              if (effect.effect_name === 'Grayscale') {
                filterType = 'grayscale';
              }
            }
          });
        }

        // TRANSITION HANDLING
        let transitionType = 0;
        let progress = 0;
        let texToElement: HTMLVideoElement | null = null; // In transition, this is Current (Tex1)

        const prevMediaId = this.getMediaId(visualClip.prevClip);
        if (visualClip.transitionProgress !== undefined && prevMediaId) {
          const prevRes = this.videos.get(prevMediaId);
          if (prevRes?.element) {
            texToElement = res.element; // Current clip becomes 'To'
            const texFromElement = prevRes.element; // Previous becomes 'From' (Tex0)

            progress = visualClip.transitionProgress;
            transitionType = 1; // Default crossfade
            if (clip.transition?.type === 'slide_left') transitionType = 2;

            this.renderComposition(
              texFromElement,
              texToElement,
              isGlitch ? 1.0 : 0.0,
              filterType === 'grayscale' ? 1.0 : 0.0,
              scale,
              transitionType,
              progress,
            );
            return;
          }
        }

        const isTransition = visualClip.transitionProgress !== undefined && visualClip.prevClip;

        if (!isTransition) {
          // Normal Playback: Bind Current to Texture 0, NOTHING to Texture 1
          this.renderComposition(
            res.element,
            null,
            isGlitch ? 1.0 : 0.0,
            filterType === 'grayscale' ? 1.0 : 0.0,
            scale,
            0,
            0,
          );
        }
      }
    }
  }

  private renderComposition(
    video1: HTMLVideoElement,
    video2: HTMLVideoElement | null,
    glitchAmount: number,
    filterAmount: number,
    scale: number,
    transitionType: number,
    transitionProgress: number,
  ) {
    const gl = this.gl;

    // Bind Texture 0 (From / Main)
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    if (video1.readyState >= video1.HAVE_CURRENT_DATA) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video1);
    }

    // Bind Texture 1 (To / Incoming)
    if (video2) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.textureTo);
      if (video2.readyState >= video2.HAVE_CURRENT_DATA) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video2);
      }
    }

    gl.useProgram(this.program);
    if (this.uniforms?.uGlitch) gl.uniform1f(this.uniforms.uGlitch, glitchAmount);
    if (this.uniforms?.uFilter) gl.uniform1f(this.uniforms.uFilter, filterAmount);
    if (this.uniforms?.uScale) gl.uniform1f(this.uniforms.uScale, scale);

    if (this.uniforms?.uTransitionType) gl.uniform1i(this.uniforms.uTransitionType, transitionType);
    if (this.uniforms?.uTransitionProgress)
      gl.uniform1f(this.uniforms.uTransitionProgress, transitionProgress);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  public dispose() {
    // Cleanup video elements
    this.videos.forEach((v) => {
      v.element.removeAttribute('src');
      v.element.load();
    });
    this.videos.clear();

    // loose context if possible or just clear refs
  }
}
