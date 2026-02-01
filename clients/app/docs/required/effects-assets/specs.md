# Pillar 3: Asset-Based Effects (The "Sauce")

## Problem Statement

Current effects are purely procedural (math-based). While efficient, they lack the organic texture of high-end video production (e.g., real film grain comes from scanned film stock, not `rand()`).

## Technical Implementation

### 1. The `AssetLoader`

We need a system to fetch and store "Utility Textures".

- **Path:** `/assets/textures/` (in public folder).
- **Loader:** `loadTexture(url): Promise<WebGLTexture>`.

### 2. Required Assets

- **LUTS (.cube or .png):**
  - _Concept:_ A texture that represents a color cube. Input color maps to output color.
  - _Usage:_ `vec3 newColor = texture3D(uLut, oldColor).rgb;`
- **Noise Maps:**
  - _Concept:_ High-res grayscale noise textures.
  - _Usage:_ `float grain = texture2D(uNoise, uv + time).r;` -> Mix into color.
- **Displacement Maps:**
  - _Concept:_ Textures that define pixel shift directions.
  - _Usage:_ `vec2 shift = texture2D(uDisplacement, uv).xy; gl_FragColor = texture2D(video, uv + shift);`

### 3. Shader Uniforms

The shader needs reserved texture slots (e.g., Texture Units 4-8) for these assets.

- `uniform sampler2D uNoiseTexture;`
- `uniform sampler2D uLutTexture;`

## Requirements Checklist

- [ ] Source high-quality CC0 assets (Film Grain, Glitch Maps, LUTs).
- [ ] Implement `LUTShader` chunk (GLSL code for reading LUTs).
- [ ] Update `VideoCompositor` to load these assets at startup.
