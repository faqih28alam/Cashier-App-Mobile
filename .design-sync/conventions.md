## Building with this DS

This is a **React Native component library rendered for the web via
`react-native-web`** — not a CSS/Tailwind design system. There is no
`ThemeProvider`, no CSS custom properties, and no runtime theming: every
component's colors, spacing, and typography are compile-time constants
baked into `_ds_bundle.js` from a private `theme` module. **No wrapping or
provider setup is required or possible** — mount any component directly.

### Styling idiom: no CSS classes, style via the `style` prop + variant props

Components accept React Native's `style` prop — a plain object or an array
of objects (e.g. `style={{marginTop: 16}}` or `style={[a, b]}`), not
CSS class names. Internally, each component composes its own base style
with a `style` array where the caller's `style` prop is spread **last**,
so it always wins for layout/spacing overrides (margin, width, flex,
position). It does **not** repaint a component's own semantic colors —
those are controlled by each component's own **variant/tone prop**, not by
overriding `backgroundColor`/`color` via `style`:

- `Button`: `variant` = `"primary" | "secondary" | "danger" | "success"`
- `Badge`: `tone` = `"success" | "warning" | "danger" | "info" | "neutral"`
- `StatCard`: `accentColor` (a color string) tints its accent dot

There are no `var(--*)` tokens and no utility class vocabulary to reach
for — don't invent Tailwind-style classes or CSS custom properties for
this DS; they don't exist and won't apply.

### Where the truth lives

Read each component's `components/ui/<Name>/<Name>.d.ts` for its exact
prop signature (all components extend the matching React Native
`*Props` type — e.g. `Button` extends `TouchableOpacityProps`, so standard
RN touchable props like `onPress`, `disabled`, `hitSlop` all work) and
`<Name>.prompt.md` for usage examples. `styles.css` is a near-empty stub
(this DS styles itself at runtime from the bundle, not from a stylesheet)
— link it anyway per the loading snippet, but don't expect token
definitions there.

### Layout note

Every component sizes itself according to normal CSS flex rules with
**no external width constraint of its own** — several (`Badge`, `Card`,
`StatCard`) use `alignSelf: 'flex-start'` internally, which only
shrink-wraps them to content width when their immediate parent is itself
a flex container. When composing a layout, wrap components that should
shrink-wrap (e.g. a `Badge` next to text) in a `<div style={{display:
'flex', alignItems: 'flex-start'}}>` (or an RN `View` with the same
style) rather than assuming they shrink-wrap on their own.

### Idiomatic example

```jsx
const {Card, StatCard, Badge, Button} = window.CashierUI;

<div style={{display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start'}}>
  <StatCard label="Total Sales" value="Rp 1.250.000" caption="Today" />
  <Card>
    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
      <Badge label="Success" tone="success" />
      <Button label="Continue" variant="primary" onPress={() => {}} />
    </div>
  </Card>
</div>
```
