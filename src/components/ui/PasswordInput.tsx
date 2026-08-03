import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors, spacing} from '../../theme';

type Props = Omit<TextInputProps, 'secureTextEntry' | 'style'> & {
  style?: StyleProp<ViewStyle>;
};

/**
 * Password field with a trailing eye toggle so users can check what they
 * typed instead of having to retype/blind-guess masked input. `style` is
 * applied to the bordered wrapper (same role as a plain input's `style`
 * prop in this app) rather than the TextInput itself.
 */
export default function PasswordInput({style, ...rest}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={!visible}
        {...rest}
      />
      <TouchableOpacity
        onPress={() => setVisible(v => !v)}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        accessibilityRole="button"
        accessibilityLabel={
          visible ? 'Sembunyikan password' : 'Tampilkan password'
        }>
        <Icon
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
});
