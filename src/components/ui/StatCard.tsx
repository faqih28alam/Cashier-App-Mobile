import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors, radius, spacing} from '../../theme';

interface StatCardProps {
  label: string;
  value: string;
  caption?: string;
  accentColor?: string;
  /** MaterialCommunityIcons glyph name. When set, renders a colored icon badge instead of the plain dot. */
  icon?: string;
}

export default function StatCard({
  label,
  value,
  caption,
  accentColor = colors.badgeBlue,
  icon,
}: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
        {icon ? (
          <View style={[styles.iconBadge, {backgroundColor: accentColor}]}>
            <Icon name={icon} size={16} color={colors.textOnBrand} />
          </View>
        ) : (
          <View style={[styles.dot, {backgroundColor: accentColor}]} />
        )}
      </View>
      <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
      {caption ? (
        <Text style={styles.caption} numberOfLines={1} ellipsizeMode="tail">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
    marginRight: spacing.xs,
  },
  dot: {width: 10, height: 10, borderRadius: 5},
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  caption: {fontSize: 11, color: colors.textMuted, marginTop: 2},
});
