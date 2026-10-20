# @-3-/veil

A React cover that hides its content until the pointer scratches it away. Cleared pixels fly off as particles: floating, falling, blown by the wind, or burning to ash.

**[Try every texture and effect in the demo →](https://charmingjae.github.io/veil/)**

```bash
npm install @-3-/veil
# or
pnpm add @-3-/veil
# or
yarn add @-3-/veil
```

## Usage

```tsx
import { Veil } from "@-3-/veil";

export const Prize = () => (
  <Veil texture="scratch-card" effect="ash">
    <div style={{ width: 300, height: 120 }}>You won!</div>
  </Veil>
);
```

The veil takes the size of its content, so give the content the size you want covered.

### Reset and progress

```tsx
import { Veil, type VeilHandle } from "@-3-/veil";
import { useRef, useState } from "react";

export const Card = () => {
  const veilRef = useRef<VeilHandle>(null);
  const [percent, setPercent] = useState(0);

  return (
    <>
      <Veil ref={veilRef} onReveal={setPercent} revealThreshold={80}>
        <button type="button">Claim</button>
      </Veil>
      <p>{percent}% revealed</p>
      <button type="button" onClick={() => veilRef.current?.reset()}>
        Cover again
      </button>
    </>
  );
};
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | The content to cover. |
| `texture` | `VeilTexture` | `"noise"` | How the cover looks. Changing it covers everything again. |
| `effect` | `VeilEffect` | `"float"` | How cleared pixels leave the cover. Changing it covers everything again. |
| `windDirection` | `VeilWindDirection` | `"right"` | Which way the `wind` effect blows. Ignored by other effects. |
| `brushSize` | `number` | `50` | Width of the cleared trail, in pixels. |
| `disabled` | `boolean` | `false` | Stops the pointer from clearing anything. What is cleared stays cleared. |
| `revealThreshold` | `number` | `50` | Percent of the cover that must be cleared before the content can be focused, clicked or read by screen readers. `0` makes it usable from the start; `100` waits until every pixel is cleared. |
| `onReveal` | `(percent: number) => void` | — | Called with the cleared share of the cover, in whole percents (0–100), each time it changes. |
| `className` | `string` | — | Class for the outer element. |
| `style` | `CSSProperties` | — | Style for the outer element. |
| `ref` | `Ref<VeilHandle>` | — | `ref.current.reset()` covers everything again. |

### Textures

`plain` · `noise` · `mosaic` · `scratch-card` · `grain` · `scanlines` · `gradient` · `dither`

`noise`, `mosaic`, `grain` and `scanlines` keep moving; the others are still.

### Effects

| Effect | Cleared pixels… |
| --- | --- |
| `float` | drift up |
| `sand` | fall, faster and faster |
| `scatter` | burst outward from the stroke |
| `dissolve` | fade where they were |
| `wind` | blow away in `windDirection` |
| `snow` | drift down, swaying |
| `sparkle` | flicker as they rise a little |
| `ash` | burn: embers rise from a glowing edge, the rest crumbles to ash |

### Wind directions

`up-left` · `up` · `up-right` · `left` · `any` · `right` · `down-left` · `down` · `down-right`

`any` blows each pixel its own way.

## Behavior

- **Covered content is inert.** Until `revealThreshold` percent is cleared, the content can't be focused, clicked or read by screen readers, so it can't be reached without scratching. After that, clicks still only pass through cleared pixels.
- **Reduced motion.** When the user prefers reduced motion, cleared pixels just fade in place and moving textures hold still.
- **Touch.** Dragging a finger over the veil scratches it instead of scrolling the page.
- **Resizing.** When the content or the window changes the veil's size, it is covered again from scratch.
- **Particles.** Pixels fly up to 56px past the cover (112px above it), drawn on a layer that overflows the veil. At most 20,000 move at once; past that, cleared pixels just vanish.
- **Server rendering.** The component is marked `"use client"` and touches browser APIs only after mounting, so it works in Next.js (App and Pages Router) and other server-rendered React apps.

## Requirements

- React 18 or 19
- A browser with canvas and `ResizeObserver` (every current browser)

The package ships ES modules only.

## License

MIT
