import React from 'react';
import {Text, StyleSheet} from 'react-native';

/** Flags a product as low/at-minimum stock (spec edge case). */
export default function LowStockBadge() {
  return <Text style={styles.badge}>Stok Menipis</Text>;
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
