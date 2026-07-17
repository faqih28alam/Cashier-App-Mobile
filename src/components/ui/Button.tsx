import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import {colors, radius, spacing} from '../../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'success';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  loading?: boolean;
}

const VARIANT_BG: Record<Variant, string> = {
  primary: colors.navy,
  secondary: colors.card,
  danger: colors.red,
  success: colors.success,
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: colors.textOnBrand,
  secondary: colors.textPrimary,
  danger: colors.textOnBrand,
  success: colors.textOnBrand,
};

export default function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{disabled: isDisabled}}
      disabled={isDisabled}
      style={[
        styles.base,
        {backgroundColor: isDisabled ? colors.disabledBg : VARIANT_BG[variant]},
        variant === 'secondary' && styles.secondaryBorder,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator
          color={isDisabled ? colors.disabledText : VARIANT_TEXT[variant]}
        />
      ) : (
        <Text
          style={[
            styles.label,
            {color: isDisabled ? colors.disabledText : VARIANT_TEXT[variant]},
          ]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  label: {fontSize: 15, fontWeight: '700'},
});
