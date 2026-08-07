import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import RingkasanOverviewSection from './sections/RingkasanOverviewSection';
import RiwayatTransaksiSection from './sections/RiwayatTransaksiSection';
import {colors, spacing} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportsHome'>;

type TabKey = 'ringkasan' | 'riwayat';

const TABS: {key: TabKey; label: string}[] = [
  {key: 'ringkasan', label: 'Ringkasan'},
  {key: 'riwayat', label: 'Riwayat Transaksi'},
];

function RingkasanInner({navigation}: Props) {
  const [tab, setTab] = useState<TabKey>('ringkasan');

  return (
    <View style={styles.page}>
      <View style={styles.tabsWrap}>
        <SegmentedTabs
          options={TABS}
          value={tab}
          onChange={key => setTab(key)}
        />
      </View>
      {tab === 'ringkasan' ? (
        <RingkasanOverviewSection navigation={navigation} />
      ) : (
        <RiwayatTransaksiSection />
      )}
    </View>
  );
}

export default function RingkasanScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <RingkasanInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: colors.background},
  tabsWrap: {padding: spacing.md, paddingBottom: 0},
});
