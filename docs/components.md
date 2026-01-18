# Component Library

## Buttons (`Button.tsx`)

Rounded, pill-shaped buttons with smooth transitions.

### Variants

1. **Primary**
   - **Style**: Solid White Background, Black Text.
   - **Classes**: `bg-white text-black hover:bg-gray-200`
   - **Usage**: Main CTAs (e.g., "Download App").

2. **Secondary**
   - **Style**: Dark Grey Background, White Text.
   - **Classes**: `bg-neutral-900 text-white hover:bg-neutral-800 border-neutral-800`
   - **Usage**: Alternative actions.

3. **Outline**
   - **Style**: Transparent with White Border.
   - **Classes**: `bg-transparent border-white/20 text-white hover:bg-white/10`
   - **Usage**: Secondary actions (e.g., "Explore Features").

4. **Ghost**
   - **Style**: Transparent, no border.
   - **Classes**: `bg-transparent text-white hover:bg-white/10`
   - **Usage**: Navigation links, subtle interactions.

### Sizes

- **Small (`sm`)**: `px-4 py-2 text-sm`
- **Medium (`md`)**: `px-6 py-3 text-base`
- **Large (`lg`)**: `px-8 py-4 text-lg`

## Icons

We use **Iconsax** for our iconography.

- **Style**: Clean, linear icons.
- **Library**: `iconsax-react`
- **Interaction**: Often paired with hover effects (e.g., Group hover translate).

## Animations

We use **Framer Motion** for entrance and interaction animations.

- **Float**: Custom floating animation defined in `globals.css` (`--animate-float`).
- **Fade In Up**: Standard reveal for page content (`initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`).

## Inputs (`Input.tsx`)

A versatile input component supporting various types and styles.

### Variants (via `type` prop)

1. **Standard**
   - **Usage**: Default input behavior.
   - **Props**: `label`, `error`, `startIcon`, `endIcon`.

2. **Currency**
   - **Type**: `currency`
   - **Usage**: Amount input with currency selector.
   - **Props**: `currency`, `onCurrencyChange`, `allowedCurrencies` (e.g. `['USD', 'EUR']`).

3. **Website**
   - **Type**: `website`
   - **Usage**: URL input with fixed protocol prefix.

4. **Textarea**
   - **Type**: `textarea`
   - **Usage**: Multi-line text input.
   - **Props**: `rows`.

5. **Date**
   - **Type**: `date`
   - **Usage**: Date picker (Pop-over Calendar).
   - **Props**: `date` (Date object), `onDateChange`.

6. **Date Range**
   - **Type**: `date-range`
   - **Usage**: Date range picker (Pop-over Calendar).
   - **Props**: `dateRange` ({ from, to }), `onDateRangeChange`.
