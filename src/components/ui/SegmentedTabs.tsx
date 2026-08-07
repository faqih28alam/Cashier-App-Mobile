import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, radius, spacing} from '../../theme';

interface SegmentedTabsProps<T extends string> {
  options: {key: T; label: string}[];
  value: T;
  onChange(value: T): void;
}

export default function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: SegmentedTabsProps<T>) {
  return (
    <View style={styles.track}>
      {options.map(option => {
        const active = option.key === value;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.pill, active && styles.pillActive]}
            activeOpacity={0.7}
            onPress={() => onChange(option.key)}>
            <Text style={[styles.label, active && styles.labelActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs / 2,
  },
  pill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  pillActive: {backgroundColor: colors.navy},
  label: {fontSize: 13, fontWeight: '600', color: colors.textMuted},
  labelActive: {color: colors.textOnNavy},
});
