import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, radius, spacing} from '../../theme';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: Tone;
}

const TONE_BG: Record<Tone, string> = {
  success: colors.successBg,
  warning: colors.warningBg,
  danger: colors.dangerBg,
  info: colors.infoBg,
  neutral: colors.background,
};

const TONE_TEXT: Record<Tone, string> = {
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
  neutral: colors.textSecondary,
};

export default function Badge({label, tone = 'neutral'}: BadgeProps) {
  return (
    <View style={[styles.badge, {backgroundColor: TONE_BG[tone]}]}>
      <Text
        style={[styles.text, {color: TONE_TEXT[tone]}]}
        numberOfLines={1}
        ellipsizeMode="tail">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: {fontSize: 12, fontWeight: '700'},
});
