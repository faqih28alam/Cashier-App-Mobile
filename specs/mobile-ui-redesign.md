# Cashier App — Mobile UI Redesign

## 1. Objective

Cashier-App-Mobile (React Native) is functionally complete per the original build spec, but its visual design is poor. Screenshots of the running app show two systemic problems: (a) large stretches of unstyled, empty vertical space on most screens, and (b) text that is nearly invisible on several screens (Laporan, Master, parts of Setting, the Home greeting). The likely root cause of (b) is that many `Text` elements never set an explicit color and rely on the platform default, while the Android theme (`Theme.AppCompat.DayNight.NoActionBar`) does not opt out of Android's automatic "force dark" inversion — so on a phone in system dark mode, default-black text gets inverted toward white against backgrounds that stay explicitly light, washing the text out. This redesign brings the mobile app's visual quality up to match the reference web mockup (`https://kasir-app-online.vercel.app`) for the store owner, admin, and cashier who use the app daily.

## 2. Requirements

1. The redesign covers every screen in the app: Bootstrap, Login, Home, KasirSession, Kasir, Payment, ReceiptResult, PurchaseList, PurchaseForm, Keuangan (Finance), ReportsHome, SalesReport, ProductReport, StockReport, TransactionReport, FinanceReport, MasterHome, ProductList, ProductForm, CategoryList, SupplierList, UserList, UserForm, Setting, PrinterPairing.
2. This is a visual/layout redesign only. Screen inventory, navigation structure (stack-based navigation, Home grid of module tiles), functionality, business logic, and data model are unchanged from the current app.
3. The mobile app adopts the reference web app's exact color palette: dark navy nav/header, red accent, white content cards on a light gray page background, colored icon badges for stat/summary tiles, and clean table/list-row styling.
4. A centralized theme/design-tokens module is introduced (colors, spacing scale, typography scale) and used by every screen in scope. No screen defines one-off color values outside this module.
5. A small set of shared primitive components is introduced and reused across screens: at minimum a Card, a ListRow, a Button, a ScreenHeader/section-header, and an EmptyState component. These are built on plain React Native `StyleSheet` — no new UI component library dependency (e.g. React Native Paper, NativeBase) is introduced.
6. Every text element has an explicit color drawn from the theme module. No text relies on the React Native or Android platform default text color.
7. All text/background color combinations meet WCAG AA contrast minimums: at least 4.5:1 for normal text, at least 3:1 for large text (≥18pt regular or ≥14pt bold) and UI components/icons.
8. The app is locked to a single fixed light theme. The Android system dark/light mode setting has no effect on the app's rendered colors. Android's automatic "force dark" behavior is explicitly disabled (e.g. `android:forceDarkAllowed="false"` on the app theme, and/or the RN-level equivalent).
9. Screens do not contain large unstyled empty/dead vertical space. Content is top-anchored and sized to its content rather than stretched to fill the remaining screen height with blank area.
10. Layouts remain usable when the Android system font-scale (accessibility text size) setting is increased: no clipped, overlapping, or cut-off text.
11. Long text (product names, store name/address, receipt footer text, etc.) truncates with an ellipsis on a single line rather than wrapping to multiple lines or overflowing its container.
12. Empty-data states (e.g. "Belum ada item", "Belum ada data pembelian", "Belum ada catatan keuangan") are rendered with a clearly readable, consistently styled treatment (explicit theme color, not a faint/low-contrast placeholder).

## 3. Constraints & Non-Goals

**Constraints:**
- Platform: Android only, minimum Android 10 (API 29) — unchanged from the original build spec.
- Framework: React Native, using plain `StyleSheet` plus the new centralized theme module. No new UI component library dependency.
- Target device range: typical mid-size Android phone screens (matching the phone used in the reference screenshots). Tablets and unusually small/large form factors are not specifically optimized for.
- No fixed delivery deadline — open-ended, same as the original build spec.
- Same repository/branch as the original build: `https://github.com/faqih28alam/Cashier-App-Mobile.git`, branch `react-native`.

**Non-Goals (explicitly out of scope for this redesign):**
- Any new feature, screen, or functional behavior beyond what already exists.
- Any change to business logic, data model, local storage/schema, or backend/network behavior (still fully offline/local).
- Any change to the navigation structure (screens, stack hierarchy, Home tile grid) — restyling only.
- A dark-mode theme variant — the app ships with one fixed light theme, not a light/dark pair.
- Tablet-optimized or responsive multi-form-factor layouts.
- Any new third-party UI component library.
- Any change to the thermal receipt's printed (ESC/POS) output format or content — only the on-screen ReceiptResult screen is visually restyled; the physical printed receipt layout is unaffected.

## 4. Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Product name, store name, address, or other long text exceeds its container width | Text truncates with an ellipsis on a single line; layout does not wrap, overflow, or push adjacent elements. |
| A list/screen has little or no data (e.g. empty transaction, no purchases yet) | The empty state is clearly readable (explicit theme color) and the screen remains top-anchored without stretching into a large blank area. |
| Android system dark mode is enabled on the device | The app still renders in its fixed light theme with no washed-out or inverted colors; forceDark has no visible effect. |
| Android system font-scale (accessibility) is increased | Text grows without being clipped, truncated unexpectedly, or overlapping other elements; screens remain scrollable/usable. |
| A screen has only 1–2 rows of data on a typical mid-size phone | Content stays top-anchored; no artificial full-height stretch leaving large dead space below the content. |
| A screen previously used an inline one-off color not in the theme module | Not permitted — every color used must come from the centralized theme module. |

## 5. Definition of Done

- [ ] Every screen listed in Requirement 1 uses the centralized theme module for all colors, spacing, and typography — no screen contains one-off inline color values outside the theme.
- [ ] No `Text` element in the codebase renders without an explicit theme-sourced color (verified by code review across all screens).
- [ ] All text/background color pairs used in the app meet WCAG AA contrast minimums (4.5:1 normal text, 3:1 large text/UI elements).
- [ ] With the device's system dark mode enabled, the app still renders in its fixed light theme with no washed-out, inverted, or low-contrast text anywhere — verified on a real Android device.
- [ ] `forceDarkAllowed` (or equivalent) is explicitly disabled at the Android theme/manifest level.
- [ ] No screen exhibits large unstyled dead vertical space when populated with representative (non-empty) data on a typical mid-size phone screen.
- [ ] The app's color palette (navy nav/header, red accent, white cards, light gray background, table/badge styling) visually matches the reference web app at `https://kasir-app-online.vercel.app`.
- [ ] Long text fields (product names, store name/address, receipt footer, etc.) truncate with an ellipsis instead of wrapping or overflowing.
- [ ] All empty-data states display a clearly readable, consistently styled message instead of near-invisible placeholder text.
- [ ] Layouts remain usable with no clipped/overlapping/cut-off text when the Android accessibility font-scale setting is increased.
- [ ] Navigation structure, screen inventory, and all functional behavior are unchanged from the app's state before this redesign — no functional regressions against the original build spec (`specs/cashier-app-mobile.md`).
