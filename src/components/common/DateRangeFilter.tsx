import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';

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
          value={from}
          onChangeText={onChangeFrom}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Sampai</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={to}
          onChangeText={onChangeTo}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 8, marginBottom: 12},
  field: {flex: 1, marginRight: 8},
  label: {fontSize: 12, color: '#666', marginBottom: 4},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
