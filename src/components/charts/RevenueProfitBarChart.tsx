import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BarChart} from 'react-native-gifted-charts';
import {DailyRevenueProfit} from '../../db/repositories/reportsRepo';
import {colors, spacing} from '../../theme';

interface Props {
  data: DailyRevenueProfit[];
}

function shortLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

/** Grouped bars per day: gifted-charts has no native "grouped" mode, so each
 * day becomes two adjacent barDataItems (Omzet, Laba Kotor) with a small gap
 * between the pair and a larger gap before the next day's pair. */
export default function RevenueProfitBarChart({data}: Props) {
  const barData = data.flatMap(row => [
    {
      value: row.omzet,
      frontColor: colors.navy,
      spacing: 2,
      label: shortLabel(row.date),
      labelTextStyle: styles.axisText,
    },
    {
      value: row.labaKotor,
      frontColor: colors.success,
      spacing: 14,
    },
  ]);

  return (
    <View>
      <BarChart
        data={barData}
        height={180}
        barWidth={10}
        barBorderRadius={3}
        yAxisTextStyle={styles.axisText}
        yAxisColor={colors.border}
        xAxisColor={colors.border}
        rulesColor={colors.border}
        noOfSections={4}
        isAnimated
      />
      <View style={styles.legendRow}>
        <LegendItem color={colors.navy} label="Omzet" />
        <LegendItem color={colors.success} label="Laba Kotor" />
      </View>
    </View>
  );
}

function LegendItem({color, label}: {color: string; label: string}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, {backgroundColor: color}]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  axisText: {color: colors.textMuted, fontSize: 10},
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
  legendDot: {width: 8, height: 8, borderRadius: 4},
  legendLabel: {fontSize: 11, color: colors.textMuted},
});
