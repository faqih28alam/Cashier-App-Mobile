# Web-Renderable UI Components for Claude Design (Storybook)

## Objective

`/design-sync` (the Claude Design sync skill) requires a web-renderable component build — a browser-runnable bundle with Storybook or a compiled `dist/` — to import a design system into Claude Design. Cashier-App-Mobile is currently a bare React Native app with no such target, so it cannot be synced. This feature adds a web-renderable version of the app's shared UI component library (`src/components/ui/`) so that a future `/design-sync` run can import these components into Claude Design, enabling UI design/iteration there. The rest of the app (screens, navigation, native-dependent features) is explicitly deferred — only the shared, presentational component layer is in scope now.

## Requirements

1. A new top-level package, `web-ui/`, is created with its own `package.json`, installable independently via `npm install` inside `web-ui/` (separate from the root app's `package.json`/`package-lock.json`).
2. `web-ui/` depends on `react-native-web` and a compatible web bundler/toolchain to compile React Native primitives (`View`, `Text`, `TouchableOpacity`, `ActivityIndicator`, `StyleSheet`) to DOM/CSS.
3. `web-ui/` imports the following directly from the existing app source — no copies, forks, or re-implementations of component code:
   - `src/components/ui/Badge.tsx`
   - `src/components/ui/Button.tsx`
   - `src/components/ui/Card.tsx`
   - `src/components/ui/EmptyState.tsx`
   - `src/components/ui/ListRow.tsx`
   - `src/components/ui/ScreenHeader.tsx`
   - `src/components/ui/StatCard.tsx`
   - `src/theme/` (`colors.ts`, `spacing.ts`, `typography.ts`, `index.ts`)
4. Storybook is set up inside `web-ui/`, configured to render through the `react-native-web` alias, with a runnable `storybook` script.
5. Storybook includes one story per documented variant/prop state, covering every component as follows:
   - **Button**: 4 variants (`primary`, `secondary`, `danger`, `success`) × 3 states (default, `disabled`, `loading`) = 12 stories.
   - **Badge**: 5 tones (`success`, `warning`, `danger`, `info`, `neutral`).
   - **Card**: 1 default story (container with sample children).
   - **EmptyState**: 1 default story (with a sample message).
   - **ListRow**: stories covering subtitle present/absent, `right` content present/absent, and `chevron` true/false (only shown when `right` is absent) — at least 4 stories covering these combinations.
   - **ScreenHeader**: stories covering subtitle present/absent and `right` content present/absent — at least 3 stories.
   - **StatCard**: default story plus a story with a custom `accentColor` — at least 2 stories.
6. `web-ui/` has a build script that produces a static, browser-loadable web output (e.g. a built Storybook static site and/or a bundled component output) that completes without errors.
7. Rendered output in Storybook visually matches the app's existing theme tokens (colors, spacing, typography values as defined in `src/theme/`) — no hardcoded one-off colors or spacing introduced in `web-ui/`.

## Constraints & Non-Goals

- The existing native app must remain completely untouched: no changes to root `package.json`, `package-lock.json`, `metro.config.js`, `babel.config.js`, `android/`, `ios/`, or any existing `src/` file.
- Package manager for `web-ui/` is npm, matching the root project.
- Scope is limited to the 7 components in `src/components/ui/` only. Explicitly out of scope for this spec:
  - `src/components/common/` (`BarcodeCameraModal.tsx`, `DateRangeFilter.tsx`, `LowStockBadge.tsx`, `RoleGuard.tsx`)
  - `src/components/kasir/NumpadModal.tsx`
  - All screens, navigation, and native-dependent features (Bluetooth printing, camera, SQLite, file system, sharing, permissions)
  - Full Expo conversion of the mobile app
  - Actually running `/design-sync` or uploading anything to Claude Design — this spec only makes the repo ready for that, as a separate future step.
- Work is done on a new git branch named `react-native-1.1`, committed, and pushed to origin. Commit messages must NOT include a co-author trailer.

## Edge Cases

| Case | Expected behavior |
|---|---|
| A component's style relies on an RN API not supported by `react-native-web` | None of the 7 components currently use `Platform` branching, shadow/elevation style props, or custom font loading, so none are expected — but if one is found during implementation, it must be resolved (polyfilled or documented as a known visual gap) before the build is considered done. |
| Storybook renders a component with default/missing optional props (e.g. `ListRow` with no `subtitle`, no `right`) | Renders exactly as the native component would — conditional sections simply omitted, no layout shift or error. |
| `web-ui/`'s dependency install or build is run without first setting up the root app's `node_modules` | `web-ui/` installs and builds successfully on its own, with no dependency on the root app's `node_modules` being present. |
| A future change to `src/components/ui/` or `src/theme/` in the main app | Since `web-ui/` imports these files directly (not copies), the next `web-ui` build/Storybook run picks up the change automatically with no manual sync step. |

## Definition of Done

- [ ] `web-ui/` directory exists with its own `package.json`, independent of the root app's `package.json`.
- [ ] Running `npm install` inside `web-ui/` succeeds independently of the root app's `node_modules`.
- [ ] Running the Storybook script inside `web-ui/` starts a local Storybook instance with no errors.
- [ ] Storybook's sidebar shows all 7 components (Badge, Button, Card, EmptyState, ListRow, ScreenHeader, StatCard) with the full variant story counts listed in Requirement 5.
- [ ] Each story renders visually with the correct theme colors, spacing, and typography (spot-checked against the native app's look).
- [ ] `web-ui/` has a working build script that produces a static web build with no errors.
- [ ] No file under root `package.json`, `package-lock.json`, `metro.config.js`, `babel.config.js`, `android/`, `ios/`, or existing `src/` has been modified.
- [ ] Root app's existing `npm run lint` and `npm test` still pass unmodified.
- [ ] All changes are committed on a branch named `react-native-1.1` and pushed to origin.
- [ ] No commit message in this work contains a co-author trailer.
