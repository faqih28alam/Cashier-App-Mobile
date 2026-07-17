import {TextStyle} from 'react-native';
import colors from './colors';

const typography: Record<string, TextStyle> = {
  screenTitle: {fontSize: 20, fontWeight: '700', color: colors.textPrimary},
  cardTitle: {fontSize: 16, fontWeight: '700', color: colors.textPrimary},
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  body: {fontSize: 14, fontWeight: '400', color: colors.textPrimary},
  bodyMedium: {fontSize: 14, fontWeight: '600', color: colors.textPrimary},
  label: {fontSize: 13, fontWeight: '500', color: colors.textSecondary},
  caption: {fontSize: 12, fontWeight: '400', color: colors.textMuted},
  statValue: {fontSize: 22, fontWeight: '700', color: colors.textPrimary},
  button: {fontSize: 15, fontWeight: '700', color: colors.textOnBrand},
};

export default typography;
