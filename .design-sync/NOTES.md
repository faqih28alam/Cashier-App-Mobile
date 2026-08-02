# design-sync notes — Cashier-App-Mobile / web-ui

## Repo shape

- The design system is `web-ui/` — a Storybook wrapper around the shared
  `src/components/ui/*.tsx` React Native component library, rendered for the
  web via `react-native-web` (aliased in `web-ui/.storybook/main.js`'s
  webpack config: `react-native$ -> react-native-web`, plus pinning
  `react`/`react-dom` to `web-ui/node_modules`).
- There is no built `dist/` and no `.d.ts` for these components — they're
  consumed as raw TSX directly by Storybook's webpack/babel pipeline. The
  converter's storybook shape needs a real package.json + `.d.ts` pair to
  discover components, so:
  - `web-ui/ds-entry/index.ts` (committed) is a thin re-export barrel:
    `export * from '../../src/components/ui';` — this is `cfg.entry`, used
    both as the esbuild bundle entry AND (via directory walk-up from the
    entry file) as `PKG_DIR` for type discovery.
  - `web-ui/ds-entry/package.json` (committed) declares
    `"types": "types/components/ui/index.d.ts"`.
  - `web-ui/ds-entry/types/` (gitignored, regenerated) holds real `.d.ts`
    output from `cfg.buildCmd`:
    `tsc --declaration --emitDeclarationOnly --jsx react-jsx --target es2020 --module esnext --moduleResolution bundler --skipLibCheck --outDir web-ui/ds-entry/types src/components/ui/index.ts`
    Re-run this (or trust the full sync flow) before every build/re-sync.
- `cfg.tsconfig` (`.design-sync/rn-web.tsconfig.json`, committed) maps the
  bare `react-native` import to `web-ui/node_modules/react-native-web/dist/cjs/index.js`
  via a `compilerOptions.paths` entry — this is how the converter's esbuild
  bundle pass resolves `import {View} from 'react-native'` to the real
  react-native-web runtime, mirroring what the Storybook webpack config does.
  **Path is PKG_DIR-relative** (`../../.design-sync/rn-web.tsconfig.json`),
  not repo-root-relative — PKG_DIR is `web-ui/ds-entry/`, not the repo root,
  because `cfg.entry` lives there. Get this wrong and the alias silently
  doesn't apply (`! tsconfig: ... not found — skipped` in the build log),
  and esbuild falls through to the REAL `react-native` package in the repo
  root's `node_modules` (which doesn't parse under esbuild's JS/TS loader —
  `Unexpected "typeof"` from RN's Flow-typed `index.js`).

## Known render warns

- `! preview decorator bundle failed: Unexpected "typeof"` — the
  `.storybook/preview.js` decorator (padding wrapper + app-background)
  imports the real `react-native` package directly, and
  `bundlePreviewDecorators` (in `lib/source-storybook.mjs`) does NOT accept
  a `cfg.tsconfig` / alias plugin the way the main bundle and preview
  bundlers do — so it fails the same way the main bundle did before the
  tsconfig alias was wired up. Decorators are cosmetic only (16px padding +
  background color) — no components read React context, so nothing renders
  broken. Compare grading should treat any padding/background delta between
  the storybook reference (which HAS the decorator) and our preview (which
  doesn't) as a framing difference per the rubric, not a real mismatch —
  unless it turns out to be visually significant, in which case revisit.

## `--no-render-check` — why, and why it's safe

`package-validate.mjs`'s mechanical render-check (`document.querySelectorAll('#root, [id^="r"]')`)
is NOT scoped to `div` elements. React Native Web injects
`<style id="react-native-stylesheet">` into `<head>` on every page — its id
also starts with "r", sorts before our `r0`/`r1`/... mount divs in document
order, and its `innerHTML` reads as empty (RNW inserts rules via CSSOM
`insertRule`, not by setting `textContent`). So `roots[0]` becomes that
`<style>` tag, its innerHTML is empty, and EVERY component false-positives
`[RENDER] ... root empty` even though everything actually renders fine.

Verified independently with a scoped Playwright probe
(`div[id^="r"]` within each preview page) — all 7 components (Badge,
Button, Card, EmptyState, ListRow, ScreenHeader, StatCard) render real,
correctly-styled content with zero page errors.

`compare.mjs` (the real fidelity gate for this shape) is NOT affected — its
own mount-detection selectors (`div[id^="r"]`, scoped within each story's
section) already require the `div` tag, so they never match RNW's style
tag. This bug is specific to `package-validate.mjs`'s broader, unscoped
selector.

Can't fix this by forking `package-validate.mjs` — it isn't a `lib/*.mjs`
module reachable through `.design-sync/overrides/`; it's a top-level staged
script that gets wholesale re-copied from the skill on every sync, so a
hand-edit there would silently vanish on the next run. Documenting here
instead: **on any future sync, this same `[RENDER] ... root empty` false
positive is expected and not a regression** — confirm via `compare.mjs`'s
real screenshots (or a scoped manual Playwright probe) rather than chasing
it, and always build/validate with `--no-render-check`.

## Missing decorator width parity (accepted `close` grades)

`web-ui/.storybook/preview.js`'s decorator wraps every story in
`<View style={{padding:16, alignItems:'flex-start'}}>` — in real Storybook
this shrink-wraps the story to its content width. Because decorator
bundling fails for this repo (see "Known render warns" above) our previews
mount directly into a plain (non-flex) div, so any component whose own
width comes from `alignSelf:'flex-start'` (which only works inside a flex
parent) or from `justifyContent:'space-between'` sizing instead renders
full-width. Confirmed affected: **Badge** (pill → full-width color bar),
**Card** (compact box → full-width box), **EmptyState** (text centered in
a narrow box → centered in the full-width page, reads as pushed right),
**ScreenHeader**'s "With Right Content" story (action content pushed to
the far right instead of sitting near the title), **StatCard** (full-width
+ accent dot pushed to the far right). **Not affected**: Button (renders
shrink-wrapped either way), ListRow and ScreenHeader's other stories
(intentionally full-width components, so the delta is invisible).

All graded `close`, not `match` — the content/colors/text are correct in
every case, only the outer width/spacing differs. Considered and rejected:
`cfg.provider` would mechanically fix the width, but `lib/emit.mjs` (which
cannot be forked) hardcodes the generated per-component doc text to
"components read theme/i18n from that context" for any configured
provider — false for this cosmetic-only wrapper, and shipping it would
actively mislead the claude.ai/design agent about the DS's real API.
Forking `bundlePreviewDecorators` (in `lib/source-storybook.mjs`, which
IS fork-eligible) to accept the tsconfig alias was also considered but not
done — revisit if this recurs across future re-syncs and the maintenance
cost looks worth it.

**On re-sync**: this delta is expected and stable — it will not resolve
itself. Don't re-chase it; carry the `close` grades forward unless the
component's own styles change.

## Re-sync risks

- The tsc-based `.d.ts` generation (`cfg.buildCmd`) is NOT type-checked
  against the real `react-native` package's exhaustive prop types beyond
  what each component actually imports (`ViewProps`, `TextProps`,
  `TouchableOpacityProps`) — if a component starts using a new RN
  primitive/prop, re-run `cfg.buildCmd` before the converter build or the
  emitted `.d.ts` will be stale.
- If `src/components/ui/index.ts` adds/removes exports, `web-ui/ds-entry/index.ts`
  picks it up automatically (it's `export *`) — no edit needed there.
- The storybook decorator (`web-ui/.storybook/preview.js`) never bundles
  into previews (see "Known render warns" above) — if it's ever changed to
  do something more than cosmetic padding/background (e.g. add a real
  context provider), previews will start silently missing that context and
  this NOTES.md entry needs revisiting alongside `cfg.provider`.
