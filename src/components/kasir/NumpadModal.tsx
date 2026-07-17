import React, {useEffect, useState} from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Button from '../ui/Button';
import {colors, radius, spacing} from '../../theme';

interface Props {
  visible: boolean;
  title: string;
  initialValue: number;
  onCancel(): void;
  onConfirm(value: number): void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'];

/** Numeric keypad popup used for editing a transaction row's QTY. */
export default function NumpadModal({
  visible,
  title,
  initialValue,
  onCancel,
  onConfirm,
}: Props) {
  const [value, setValue] = useState(String(initialValue));

  useEffect(() => {
    if (visible) {
      setValue(String(initialValue));
    }
  }, [visible, initialValue]);

  const pressKey = (key: string) => {
    if (key === 'DEL') {
      setValue(v => (v.length > 1 ? v.slice(0, -1) : '0'));
      return;
    }
    if (key === '.' && value.includes('.')) {
      return;
    }
    setValue(v => (v === '0' && key !== '.' ? key : v + key));
  };

  const confirm = () => {
    const parsed = parseFloat(value);
    onConfirm(Number.isFinite(parsed) ? parsed : 0);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.display}>{value}</Text>
          <View style={styles.grid}>
            {KEYS.map(key => (
              <TouchableOpacity
                key={key}
                style={styles.key}
                onPress={() => pressKey(key)}>
                <Text style={styles.keyText}>{key === 'DEL' ? '⌫' : key}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actions}>
            <Button
              style={styles.actionButton}
              variant="secondary"
              label="Batal"
              onPress={onCancel}
            />
            <Button style={styles.actionButton} label="OK" onPress={confirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: 300,
  },
  title: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  display: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing.sm,
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap'},
  key: {
    width: '33.333%',
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {fontSize: 20, fontWeight: '600', color: colors.textPrimary},
  actions: {flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm},
  actionButton: {flex: 1},
});
