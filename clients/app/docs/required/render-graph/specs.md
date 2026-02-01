# Pillar 4: The Render Graph

## Problem Statement

The current engine is hardcoded to `Background Layer` -> `mix` -> `Foreground Layer`. This limits us to exactly 2 layers. Modern editing requires N layers (Background, Video 1, Video 2, Overlay, Text, Adjustment Layer).

## Technical Implementation

### 1. Framebuffer Objects (FBOs) -> "Ping Pong"

To chain effects and layers, we cannot render directly to the screen (Canvas) every time. we must render to a texture.

- **Buffer A:** Stores the result of Layer 0.
- **Layer 1 Op:** Reads Buffer A, mixes Layer 1, outputs to Buffer B.
- **Layer 2 Op:** Reads Buffer B, mixes Layer 2, outputs to Buffer A.
- ...
- **Final:** Draw the last buffer to the Screen.

### 2. The `RenderNode` Class

We conceptualize the timeline as a graph of nodes.

```typescript
interface RenderNode {
  render(input: WebGLTexture): WebGLTexture;
}
```

### 3. Adjustment Layers

With a Render Graph, an "Adjustment Layer" (e.g., "Vintage Look" applied to the whole timeline) becomes a simple Node inserted at the end of the chain. It takes the composite result of all videos and applies a shader pass (LUT, Color Grade) to it.

## Requirements Checklist

- [ ] Implement `FramebufferManager` in `video-compositor.ts`.
- [ ] Refactor `render` loop to iterate depth-sorted tracks.
- [ ] Implement Ping-Pong texture swapping logic.
