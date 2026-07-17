import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import {colors, radius, spacing} from '../../theme';

interface ListRowProps extends TouchableOpacityProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  chevron?: boolean;
}

export default function ListRow({
  title,
  subtitle,
  right,
  chevron = true,
  style,
  ...rest
}: ListRowProps) {
  return (
    <TouchableOpacity style={[styles.row, style]} activeOpacity={0.7} {...rest}>
      <View style={styles.textCol}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron && !right ? <Text style={styles.chevron}>{'›'}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  textCol: {flex: 1, marginRight: spacing.sm},
  title: {fontSize: 15, fontWeight: '600', color: colors.textPrimary},
  subtitle: {fontSize: 12, color: colors.textMuted, marginTop: 2},
  chevron: {fontSize: 20, color: colors.textDisabled, fontWeight: '700'},
});
