import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {LineChart} from 'react-native-gifted-charts';
import {DailyRevenueProfit} from '../../db/repositories/reportsRepo';
import {colors, spacing} from '../../theme';

interface Props {
  data: DailyRevenueProfit[];
}

/** dd/MM, shown on every other point so 14 daily labels don't overlap on a phone-width chart. */
function shortLabel(dateStr: string, index: number): string {
  if (index % 2 !== 0) {
    return '';
  }
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

export default function RevenueProfitLineChart({data}: Props) {
  const omzetPoints = data.map((row, i) => ({
    value: row.omzet,
    label: shortLabel(row.date, i),
  }));
  const labaPoints = data.map(row => ({value: row.labaKotor}));

  return (
    <View>
      <LineChart
        data={omzetPoints}
        data2={labaPoints}
        color1={colors.badgeOrange}
        color2={colors.success}
        thickness1={2}
        thickness2={2}
        dataPointsColor1={colors.badgeOrange}
        dataPointsColor2={colors.success}
        dataPointsRadius={3}
        height={180}
        spacing={26}
        initialSpacing={12}
        endSpacing={12}
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        yAxisColor={colors.border}
        xAxisColor={colors.border}
        rulesColor={colors.border}
        noOfSections={4}
        curved
      />
      <View style={styles.legendRow}>
        <LegendItem color={colors.badgeOrange} label="Omzet" />
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
