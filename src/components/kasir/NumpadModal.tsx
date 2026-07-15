import React, {useEffect, useState} from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet} from 'react-native';

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
            <TouchableOpacity
              style={[styles.actionButton, styles.cancel]}
              onPress={onCancel}>
              <Text style={styles.actionText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirm]}
              onPress={confirm}>
              <Text style={[styles.actionText, styles.confirmText]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {backgroundColor: '#fff', borderRadius: 12, padding: 16, width: 300},
  title: {fontSize: 14, color: '#555', marginBottom: 4, textAlign: 'center'},
  display: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingBottom: 8,
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap'},
  key: {
    width: '33.333%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {fontSize: 20, fontWeight: '600'},
  actions: {flexDirection: 'row', marginTop: 12},
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancel: {backgroundColor: '#eee'},
  confirm: {backgroundColor: '#1d4ed8'},
  actionText: {fontSize: 16, fontWeight: '600', color: '#333'},
  confirmText: {color: '#fff'},
});
