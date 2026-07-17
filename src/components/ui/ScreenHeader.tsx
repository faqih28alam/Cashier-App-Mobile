import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing} from '../../theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  subtitle,
  right,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textCol}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2} ellipsizeMode="tail">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  textCol: {flex: 1, marginRight: spacing.md},
  title: {fontSize: 20, fontWeight: '700', color: colors.textPrimary},
  subtitle: {fontSize: 13, color: colors.textMuted, marginTop: 2},
});
