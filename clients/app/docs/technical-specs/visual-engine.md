# Visual Engine Technical Specifications

This document outlines the four critical pillars required to elevate the Skeet Video Engine to production-grade quality.

## 1. The "A/B Deck" Transition Engine (CRITICAL)

**Goal:** Enable organic transitions (Cross Dissolve, Wipe, Zoom) between two clips on the same timeline track.
**The Fix:**

- Implement an "A/B Roll" system in the shader.
- **Requirements:**
  - **Shader Uniforms:** `uTextureA` (outgoing), `uTextureB` (incoming), `uTransitionProgress` (0.0 to 1.0), `uTransitionType`.
  - **Logic:** Port `gl-transitions` logic (GLSL) to handle blending based on `uTransitionType`.
  - **OTIO:** Implement proper `Transition` schema parsing, not just "Effects".

## 2. Text-to-Texture Subsystem (Captions)

**Goal:** Enable "burned-in" captions and kinetic typography.
**The Fix:**

- **Path B (Pro/Native):** Canvas 2D -> Texture.
- **Workflow:**
  1.  Create an off-screen `<canvas>`.
  2.  Draw text using `ctx.fillText` (allowing custom fonts/styles).
  3.  Upload canvas as a `WebGLTexture`.
  4.  Composite this texture over the video layers in the shader.

## 3. Asset-Based Effects (The "Sauce")

**Goal:** Replace mathematical hacks with professional, asset-driven effects.
**The Fix:**

- **AssetLoader:** A system to preload utility textures.
- **Required Assets:**
  - **Noise Maps:** For organic Film Grain.
  - **Displacement Maps:** For realistic "Glitch" distortion.
  - **LUTs:** For cinematic Color Grading.
- **Shader:** Add samplers (`uNoiseTexture`, `uLutTexture`) to read these assets during the render pass.

## 4. Logic & "The Graph"

**Goal:** Move beyond the 2-layer hardcoded limit to support N layers + Adjustment Layers.
**The Fix:**

- **Render Graph:** A loop that iterates through all visible clips/tracks.
- **Ping-Pong Buffering:** Use Framebuffer Objects (FBOs) to render `Track 0` -> `Buffer A`, then `Buffer A + Track 1` -> `Buffer B`.
- **Adjustment Layers:** Special nodes in the graph that apply effects to the accumulated buffer without adding new video content.
