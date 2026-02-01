# Pillar 2: Text-to-Texture Subsystem

## Problem Statement

WebGL has no native font rendering engine. To add captions, subtitles, or kinetic typography that is "burned in" (part of the final exported video bytes) rather than just an HTML overlay, we must rasterize text into a texture.

## Technical Implementation

### 1. The `GlobalTextRenderer` Singleton

We need a class responsible for generating text textures.

**Methods:**

- `createTextureFromText(text: string, style: TextStyle): WebGLTexture`
- `updateTexture(...)`: For dynamic updates.

### 2. Canvas 2D Buffer

1.  Create an off-screen `<canvas>` (e.g., 2048x2048 or dynamically sized to the bounding box of the text).
2.  Use `ctx.font`, `ctx.fillStyle`, `ctx.fillText()`, `ctx.strokeText()` to draw the text with high-quality styling (shadows, outlines).
3.  **Optimization:** Use a texture atlas for common glyphs if we have heavy text loads, or simply one-texture-per-caption-block for simpler use cases (Skeet's MVP preference).

### 3. Integration with Engine

- **OTIO Schema:** Define `Caption` schema with `text`, `start_time`, `duration`, `position`, `style`.
- **Compositor:**
  - Iterate active captions.
  - Check if a cached texture exists for this caption's state.
  - If not, generate it via `TextRenderer`.
  - Upload to GPU (`gl.texImage2D`).
  - Composite heavily with Alpha Blending (`gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)`).

## Requirements Checklist

- [ ] `TextRenderer` class using Canvas 2D.
- [ ] Texture caching system (don't re-draw 'Hello World' every frame, only on change).
- [ ] Shader support for overlaying a transparent text texture on top of the video layer.
- [ ] Support for Google Fonts (loading webfonts before drawing to canvas).
