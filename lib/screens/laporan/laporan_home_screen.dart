import 'package:flutter/material.dart';

import 'tab_data_barang.dart';
import 'tab_keuangan.dart';
import 'tab_penjualan.dart';
import 'tab_stok.dart';
import 'tab_transaksi.dart';

class LaporanHomeScreen extends StatelessWidget {
  const LaporanHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 5,
      child: Column(
        children: [
          Material(
            color: Theme.of(context).colorScheme.surface,
            child: const TabBar(
              isScrollable: true,
              tabs: [
                Tab(text: 'Data Barang'),
                Tab(text: 'Penjualan'),
                Tab(text: 'Stok'),
                Tab(text: 'Transaksi'),
                Tab(text: 'Keuangan'),
              ],
            ),
          ),
          const Expanded(
            child: TabBarView(
              children: [
                LaporanDataBarangTab(),
                LaporanPenjualanTab(),
                LaporanStokTab(),
                LaporanTransaksiTab(),
                LaporanKeuanganTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
