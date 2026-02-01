import { OTIOClip, OTIOTimeline } from '@/stores/studio';

type VideoResource = {
  element: HTMLVideoElement;
  loaded: boolean;
  url: string;
};

// Vertex shader
const VERT_SHADER = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  vUv = uv;
}
`;

// Fragment shader
const FRAG_SHADER = `
precision mediump float;
varying vec2 vUv;

uniform sampler2D uBgTexture; 
uniform sampler2D uFgTexture; 

// Aspect Correction (x, y scale factors)
// 1.0 = No scaling. > 1.0 = Zoom out (creates bars).
uniform vec2 uBgScaleCorrection; 
uniform vec2 uFgScaleCorrection;

uniform float uFgOpacity; 
uniform float uFgScale;   
uniform vec2 uFgPos;      

uniform float uGlitch; 
uniform float uFilter; 

void main() {
  // 1. Background (with Aspect Correction)
  vec2 bgUv = (vUv - 0.5) * uBgScaleCorrection + 0.5;
  
  vec4 bgColor = vec4(0.0, 0.0, 0.0, 1.0); // Default Black
  if (bgUv.x >= 0.0 && bgUv.x <= 1.0 && bgUv.y >= 0.0 && bgUv.y <= 1.0) {
     bgColor = texture2D(uBgTexture, bgUv);
  }

  // 2. Foreground (PIP + Aspect Correction)
  // Apply Aspect Correction *inside* the PIP transformation or alongside it?
  // We want the PIP content itself to be aspect correct.
  // Transform: (uv - center) -> Scale (PIP) -> Position -> Aspect -> + center
  
  // NOTE: Logic order:
  // We want to map UV 0..1 to a specific rect on screen.
  // Aspect correction operates on the texture lookup UVs.
  
  // Let's create the UV for the PIP window first (0..1 range inside the PIP box)
  vec2 rawFgUv = (vUv - 0.5) / uFgScale - uFgPos + 0.5;
  
  vec4 fgColor = vec4(0.0);
  
  // Now apply aspect correction to *that* 0..1 range
  // BUT we only do this if we are "inside" the PIP box conceptually.
  // Actually, we can just chain it.
  
  // Center regarding the PIP frame (0.5)
  vec2 aspectFgUv = (rawFgUv - 0.5) * uFgScaleCorrection + 0.5;

  if (aspectFgUv.x >= 0.0 && aspectFgUv.x <= 1.0 && aspectFgUv.y >= 0.0 && aspectFgUv.y <= 1.0) {
      fgColor = texture2D(uFgTexture, aspectFgUv);
      fgColor.a *= uFgOpacity;
  } 

  // 3. Composite
  vec3 mixedRgb = fgColor.rgb * fgColor.a + bgColor.rgb * (1.0 - fgColor.a);
  vec4 finalColor = vec4(mixedRgb, 1.0);

  // 4. Effects
  // 4. Effects
  if (false && uGlitch > 0.0) {
    float offset = 0.02 * uGlitch;
    float r = 0.0;
    // Sample offset from BG
    vec2 offsetUv = bgUv + vec2(offset, 0.0);
    if (offsetUv.x >= 0.0 && offsetUv.x <= 1.0 && offsetUv.y >=0.0 && offsetUv.y <= 1.0) {
        r = texture2D(uBgTexture, offsetUv).r;
    }
    finalColor.r = mix(finalColor.r, r, 0.5);
  }

  if (false && uFilter > 0.5) {
    float gray = dot(finalColor.rgb, vec3(0.299, 0.587, 0.114));
    finalColor = vec4(vec3(gray), 1.0);
  }

  gl_FragColor = finalColor;
}
`;

export class VideoCompositor {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private videos: Map<string, VideoResource> = new Map();
  private resolveAsset: ((mediaId: string) => Promise<string | null>) | null = null;
  private timeline: OTIOTimeline | null = null;

  private bgTexture: WebGLTexture | null = null;
  private fgTexture: WebGLTexture | null = null;
  private noiseTexture: WebGLTexture | null = null;

  private attribs: { position: number; uv: number } | null = null;
  private uniforms: {
    uBgTexture: WebGLUniformLocation | null;
    uFgTexture: WebGLUniformLocation | null;
    uNoiseTexture: WebGLUniformLocation | null;

    uBgScaleCorrection: WebGLUniformLocation | null;
    uFgScaleCorrection: WebGLUniformLocation | null;

    uFgOpacity: WebGLUniformLocation | null;
    uFgScale: WebGLUniformLocation | null;
    uFgPos: WebGLUniformLocation | null;
    uGlitch: WebGLUniformLocation | null;
    uFilter: WebGLUniformLocation | null;
    uTime: WebGLUniformLocation | null;
  } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    this.initShaders();
    this.initBuffers();
    this.initTextures();
    this.initNoiseAsset();
  }

  private initShaders() {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const vert = compile(gl.VERTEX_SHADER, VERT_SHADER);
    const frag = compile(gl.FRAGMENT_SHADER, FRAG_SHADER);
    if (!vert || !frag) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }

    this.program = prog;
    gl.useProgram(prog);

    this.attribs = {
      position: gl.getAttribLocation(prog, 'position'),
      uv: gl.getAttribLocation(prog, 'uv'),
    };

    this.uniforms = {
      uBgTexture: gl.getUniformLocation(prog, 'uBgTexture'),
      uFgTexture: gl.getUniformLocation(prog, 'uFgTexture'),
      uNoiseTexture: gl.getUniformLocation(prog, 'uNoiseTexture'),

      uBgScaleCorrection: gl.getUniformLocation(prog, 'uBgScaleCorrection'),
      uFgScaleCorrection: gl.getUniformLocation(prog, 'uFgScaleCorrection'),

      uFgOpacity: gl.getUniformLocation(prog, 'uFgOpacity'),
      uFgScale: gl.getUniformLocation(prog, 'uFgScale'),
      uFgPos: gl.getUniformLocation(prog, 'uFgPos'),
      uGlitch: gl.getUniformLocation(prog, 'uGlitch'),
      uFilter: gl.getUniformLocation(prog, 'uFilter'),
      uTime: gl.getUniformLocation(prog, 'uTime'),
    };

    gl.uniform1i(this.uniforms.uBgTexture, 0);
    gl.uniform1i(this.uniforms.uFgTexture, 1);
    gl.uniform1i(this.uniforms.uNoiseTexture, 2);
  }

  private initBuffers() {
    const gl = this.gl;
    const pos = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const uvs = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);

    const pb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    if (this.attribs) {
      gl.enableVertexAttribArray(this.attribs.position);
      gl.vertexAttribPointer(this.attribs.position, 2, gl.FLOAT, false, 0, 0);
    }

    const ub = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ub);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    if (this.attribs) {
      gl.enableVertexAttribArray(this.attribs.uv);
      gl.vertexAttribPointer(this.attribs.uv, 2, gl.FLOAT, false, 0, 0);
    }
  }

  private initTextures() {
    const gl = this.gl;
    const setup = (unit: number) => {
      const t = gl.createTexture();
      gl.activeTexture(unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    };
    this.bgTexture = setup(gl.TEXTURE0);
    this.fgTexture = setup(gl.TEXTURE1);
  }

  private initNoiseAsset() {
    const gl = this.gl;
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < data.length; i += 4) {
      const val = Math.floor(Math.random() * 255);
      data[i] = val; // R
      data[i + 1] = val; // G
      data[i + 2] = val; // B
      data[i + 3] = 255; // A
    }

    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.noiseTexture = t;
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
          const mediaId = this.getMediaId(item);
          if (mediaId) await this.ensureVideo(mediaId);
        }
      }
    }
  }

  private async ensureVideo(mediaId: string) {
    if (this.videos.has(mediaId)) return;
    if (!this.resolveAsset) return;
    const url = await this.resolveAsset(mediaId);
    if (!url) return;
    const v = document.createElement('video');
    v.src = url;
    v.crossOrigin = 'anonymous';
    v.muted = false;
    v.playsInline = true;
    v.preload = 'auto';
    this.videos.set(mediaId, { element: v, loaded: false, url });
  }

  public render(globalTimeSeconds: number, isPlaying: boolean) {
    if (!this.timeline || !this.gl || !this.program) return;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // 1. Identify active clips
    let baseClipNode: { clip: OTIOClip; offset: number } | null = null;
    let overlayClipNode: { clip: OTIOClip; offset: number } | null = null;
    const audioNodes: { clip: OTIOClip; offset: number }[] = []; // Track active audio for muting

    this.timeline.tracks.children.forEach((track, trackIndex) => {
      let pointer = 0;
      for (const item of track.children) {
        const dur = item.source_range.duration.value / item.source_range.duration.rate;
        const start = pointer;
        const end = pointer + dur;

        if (globalTimeSeconds >= start && globalTimeSeconds < end) {
          if (item.OTIO_SCHEMA.startsWith('Clip.')) {
            const clip = item as OTIOClip;

            if (track.kind === 'Video') {
              if (trackIndex === 0) {
                baseClipNode = { clip, offset: start };
              } else {
                overlayClipNode = { clip, offset: start };
              }
            } else if (track.kind === 'Audio') {
              audioNodes.push({ clip, offset: start });
            }
          }
        }
        pointer += dur;
      }
    });

    // 2. Sync Video/Audio Elements
    const activeMediaMap = new Map<string, number>();
    const registerSync = (node: { clip: OTIOClip; offset: number } | null) => {
      if (!node) return;
      const mid = this.getMediaId(node.clip);
      if (!mid) return;
      const local = globalTimeSeconds - node.offset;
      const srcStart =
        node.clip.source_range.start_time.value / node.clip.source_range.start_time.rate;
      activeMediaMap.set(mid, srcStart + local);
    };

    registerSync(baseClipNode);
    registerSync(overlayClipNode);
    audioNodes.forEach(registerSync);

    this.videos.forEach((res, mid) => {
      const targetTime = activeMediaMap.get(mid);
      if (targetTime !== undefined) {
        const isAudioTrack = audioNodes.some((n) => this.getMediaId(n.clip) === mid);
        const isBase = baseClipNode && this.getMediaId(baseClipNode.clip) === mid;
        // Unmute if on Audio Track OR if it is Main Video (and we want main audio)
        // Default: Unmute.
        res.element.muted = !(isAudioTrack || isBase);

        if (isPlaying) {
          if (res.element.paused) res.element.play().catch(() => {});
          if (Math.abs(res.element.currentTime - targetTime) > 0.25) {
            res.element.currentTime = targetTime;
          }
        } else {
          if (!res.element.paused) res.element.pause();
          if (Math.abs(res.element.currentTime - targetTime) > 0.1) {
            res.element.currentTime = targetTime;
          }
        }
      } else {
        if (!res.element.paused) res.element.pause();
      }
    });

    // 3. Render Composition
    const baseMediaId = baseClipNode ? this.getMediaId(baseClipNode.clip) : null;
    const overlayMediaId = overlayClipNode ? this.getMediaId(overlayClipNode.clip) : null;

    const baseEl = baseMediaId ? this.videos.get(baseMediaId)?.element : null;
    const overlayEl = overlayMediaId ? this.videos.get(overlayMediaId)?.element : null;

    let opacity = 0.0;
    let scale = 1.0;
    let posX = 0.0;
    let posY = 0.0;
    let glitchIntensity = 0.0;
    let filterIntensity = 0.0;

    const processEffects = (clip: OTIOClip) => {
      if (clip.effects) {
        for (const effect of clip.effects) {
          const name = effect.effect_name?.toLowerCase() || '';
          const meta = effect.metadata || {};

          if (name.includes('glitch')) {
            glitchIntensity = Math.max(
              glitchIntensity,
              typeof meta.intensity === 'number' ? meta.intensity : 1.0,
            );
          }
          if (name.includes('grayscale') || name.includes('film grain') || name.includes('noir')) {
            filterIntensity = 1.0;
          }
        }
      }
    };

    if (baseClipNode) processEffects(baseClipNode.clip);

    if (overlayEl && overlayClipNode) {
      opacity = 1.0;
      const meta = (overlayClipNode.clip as any).metadata || {};
      if (typeof meta.opacity === 'number') opacity = meta.opacity;
      if (typeof meta.scale === 'number') scale = meta.scale;
      if (meta.position && Array.isArray(meta.position)) {
        posX = meta.position[0];
        posY = meta.position[1];
      }
      processEffects(overlayClipNode.clip);
    }

    // CALCULATE ASPECT CORRECTION
    const canvasAspect = this.canvas.width / this.canvas.height;

    const getCorrection = (video: HTMLVideoElement | null) => {
      if (!video || !video.videoWidth) return { x: 1.0, y: 1.0 };
      const vidAspect = video.videoWidth / video.videoHeight;
      const r = vidAspect / canvasAspect;
      // FIT (Contain) Logic
      // If image is wider (r > 1), we scale Y by r to shrink image height (add bars)
      // If image is tall (r < 1), we scale X by 1/r to shrink image width
      if (r > 1) {
        return { x: 1.0, y: r };
      } else {
        return { x: 1.0 / r, y: 1.0 };
      }
    };

    const bgCorrection = getCorrection(baseEl);
    const fgCorrection = getCorrection(overlayEl);

    if (!baseEl && !overlayEl) return;

    this.renderLayered(baseEl || null, overlayEl || null, {
      opacity,
      scale,
      pos: { x: posX, y: posY },
      glitch: glitchIntensity,
      filter: filterIntensity,
      time: globalTimeSeconds,
      bgCorrection,
      fgCorrection,
    });
  }

  private renderLayered(
    bgCtx: HTMLVideoElement | null,
    fgCtx: HTMLVideoElement | null,
    opts: {
      opacity: number;
      scale: number;
      pos: { x: number; y: number };
      glitch: number;
      filter: number;
      time: number;
      bgCorrection: { x: number; y: number };
      fgCorrection: { x: number; y: number };
    },
  ) {
    const gl = this.gl;
    gl.useProgram(this.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.bgTexture);
    if (bgCtx && bgCtx.readyState >= 2) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgCtx);
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 255]),
      );
    }

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fgTexture);
    if (fgCtx && fgCtx.readyState >= 2) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fgCtx);
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 0]),
      );
    }

    // Bind Noise Texture
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);

    if (this.uniforms?.uFgOpacity) gl.uniform1f(this.uniforms.uFgOpacity, opts.opacity);
    if (this.uniforms?.uFgScale) gl.uniform1f(this.uniforms.uFgScale, opts.scale);
    if (this.uniforms?.uFgPos) gl.uniform2f(this.uniforms.uFgPos, opts.pos.x, opts.pos.y);

    if (this.uniforms?.uBgScaleCorrection)
      gl.uniform2f(this.uniforms.uBgScaleCorrection, opts.bgCorrection.x, opts.bgCorrection.y);
    if (this.uniforms?.uFgScaleCorrection)
      gl.uniform2f(this.uniforms.uFgScaleCorrection, opts.fgCorrection.x, opts.fgCorrection.y);

    if (this.uniforms?.uGlitch) gl.uniform1f(this.uniforms.uGlitch, opts.glitch);
    if (this.uniforms?.uFilter) gl.uniform1f(this.uniforms.uFilter, opts.filter);
    if (this.uniforms?.uTime) gl.uniform1f(this.uniforms.uTime, opts.time);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  public dispose() {
    this.videos.forEach((v) => {
      v.element.removeAttribute('src');
      v.element.load();
    });
    this.videos.clear();
  }
}
