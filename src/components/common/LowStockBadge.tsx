import React from 'react';
import Badge from '../ui/Badge';

/** Flags a product as low/at-minimum stock (spec edge case). */
export default function LowStockBadge() {
  return <Badge label="Stok Menipis" tone="danger" />;
}
