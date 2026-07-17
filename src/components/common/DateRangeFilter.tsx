import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {colors, radius, spacing} from '../../theme';

interface Props {
  from: string;
  to: string;
  onChangeFrom(value: string): void;
  onChangeTo(value: string): void;
}

/** Simple YYYY-MM-DD date-range filter shared by all LAPORAN screens. */
export default function DateRangeFilter({
  from,
  to,
  onChangeFrom,
  onChangeTo,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Text style={styles.label}>Dari</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          value={from}
          onChangeText={onChangeFrom}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Sampai</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          value={to}
          onChangeText={onChangeTo}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md},
  field: {flex: 1, marginRight: spacing.sm},
  label: {fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs},
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },
});
