# Fixes for specs/mobile-ui-redesign.md

## 1. Requirement 4 — App.tsx not using the centralized theme module

**Gap:** `App.tsx` (root component, renders before `RootNavigator` while the local DB opens, and on DB-open failure) was never touched during the redesign. It still has a hardcoded one-off color and no theme usage at all:
- `styles.errorText` uses `color: '#b91c1c'` (line 62) instead of a theme token.
- `styles.centered` (the loading/error container) has no `backgroundColor`, unlike every other screen's root container (`colors.background`).
- The `ActivityIndicator` on the loading state has no `color` prop, unlike every other spinner in the app (which use `colors.navy`).

This violates "No screen defines one-off color values outside this module" and the Definition of Done item "No text element in the codebase renders without an explicit theme-sourced color."

**Fix:** In `App.tsx`:
- Import `{colors, spacing}` from `./src/theme`.
- Replace `styles.errorText`'s `color: '#b91c1c'` with `color: colors.danger`.
- Add `backgroundColor: colors.background` to `styles.centered`, and use `spacing.xl` instead of the literal `24` for `padding` (matching the pattern used elsewhere, e.g. `RoleGuard`, `KasirSessionScreen`).
- Add `color={colors.navy}` to the `<ActivityIndicator size="large" />` on the loading branch.

## 2. Requirement 7 — Placeholder text fails WCAG AA contrast (4.5:1)

**Gap:** `colors.textDisabled` (`#9ca3af`) is used as `placeholderTextColor` in 10 files (`LoginScreen.tsx`, `BootstrapScreen.tsx`, `KasirScreen.tsx`, `PurchaseFormScreen.tsx`, `FinanceScreen.tsx`, `CategoryListScreen.tsx`, `SupplierListScreen.tsx`, `ProductListScreen.tsx`, `ProductReportScreen.tsx`, `DateRangeFilter.tsx`). Computed contrast of `#9ca3af` against the white/`colors.card` input background is ~2.54:1 — well under the spec's 4.5:1 minimum for normal text (placeholder text is rendered, readable text, not exempt like disabled controls). This is the same class of low-contrast-text bug the redesign was commissioned to fix.

**Fix:** In all 10 files listed above, replace every `placeholderTextColor={colors.textDisabled}` with `placeholderTextColor={colors.textMuted}`. `colors.textMuted` (`#6b7280`) already renders at ~4.83:1 against white/card backgrounds (verified — it's the same token already used for captions/meta text throughout the app), which clears the 4.5:1 minimum. Do not change `colors.textDisabled` itself — it must stay as-is because it is correctly used for genuinely disabled control text/backgrounds, which are exempt from the contrast requirement (WCAG 1.4.3 excludes inactive UI components), and darkening it would blur the visual "disabled" signal.
