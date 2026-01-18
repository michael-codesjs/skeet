# Color Palette

Our color system is built on a **dark-first aesthetic**, utilizing high-contrast whites and grays to create a premium, professional feel. This monochrome approach ensures the interface remains secondary to the creator's video content.

## Core Colors

| Token                     | Value     | Description                                                |
| :------------------------ | :-------- | :--------------------------------------------------------- |
| `--background`            | `#000000` | Deep black background for the entire app.                  |
| `--foreground`            | `#FFFFFF` | Primary text color for maximum readability.                |
| `--color-brand-primary`   | `#FFFFFF` | Main accent color used for buttons and active highlights.  |
| `--color-brand-secondary` | `#AAAAAA` | Secondary text and muted UI elements.                      |
| `--color-brand-dark`      | `#000000` | Pure black for high-contrast layering.                     |
| `--color-brand-card`      | `#0A0A0A` | Slightly elevated black for card backgrounds and sections. |
| `--color-brand-border`    | `#333333` | Subtle borders used for structure and definition.          |

---

## Gradients & Effects

### Text Gradient

Used for headlines to add depth and a metallic, high-fidelity aesthetic.

- **CSS Class**: `.text-gradient`
- **Value**: `linear-gradient(to right, #FFFFFF, #999999)`

### Glassmorphism

Used for floating overlays, navigation bars, and modal cards.

- **CSS Class**: `.glass-card`
- **Background**: `rgba(20, 20, 20, 0.4)`
- **Blur**: `backdrop-filter: blur(12px)`
- **Border**: `1px solid rgba(255, 255, 255, 0.1)`

### Background Pattern

A subtle structural grid that provides a sense of scale and precision.

- **CSS Class**: `.bg-grid-pattern`
- **Specification**: Linear gradients creating a 50x50px monochromatic grid.
