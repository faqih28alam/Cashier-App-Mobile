/**
 * Fixed light-theme palette, matching the reference web app
 * (https://kasir-app-online.vercel.app). The app does not adapt to the
 * device's system dark/light mode setting — see android/app/src/main/res/values/styles.xml
 * for the corresponding forceDarkAllowed="false" opt-out.
 *
 * Every color below has been checked against WCAG AA contrast minimums for
 * the surface it is intended to sit on (4.5:1 normal text, 3:1 large
 * text/UI). Do not add one-off hex colors in screens — extend this file.
 */
const colors = {
  // Brand
  navy: '#0f172a',
  navySurface: '#1e293b',
  red: '#dc2626',
  redDark: '#b91c1c',

  // Backgrounds
  background: '#f3f4f6',
  card: '#ffffff',
  cardMuted: '#eef2ff',

  // Borders / dividers
  border: '#e5e7eb',
  borderStrong: '#d1d5db',

  // Text (on light/white surfaces)
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  textDisabled: '#9ca3af',

  // Text (on dark navy surfaces)
  textOnNavy: '#ffffff',
  textOnNavyMuted: '#cbd5e1',

  // Text on brand-colored buttons/badges
  textOnBrand: '#ffffff',

  // Semantic
  success: '#15803d',
  successBg: '#dcfce7',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  warning: '#92400e',
  warningBg: '#fef3c7',
  info: '#1d4ed8',
  infoBg: '#dbeafe',

  // Stat-badge icon colors (matching the web Laporan cards)
  badgeGreen: '#059669',
  badgeBlue: '#2563eb',
  badgePurple: '#7c3aed',
  badgeOrange: '#ea580c',

  // Disabled controls (exempt from AA per WCAG 1.4.3 — inactive UI components)
  disabledBg: '#e5e7eb',
  disabledText: '#9ca3af',

  overlay: 'rgba(15, 23, 42, 0.5)',
} as const;

export default colors;
export type ThemeColors = typeof colors;
