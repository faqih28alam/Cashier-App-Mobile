import 'package:flutter/material.dart';

import 'tab_barang.dart';
import 'tab_kategori.dart';
import 'tab_supplier.dart';
import 'tab_user.dart';

class MasterHomeScreen extends StatelessWidget {
  const MasterHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Column(
        children: [
          Material(
            color: Theme.of(context).colorScheme.surface,
            child: const TabBar(
              tabs: [
                Tab(text: 'Barang'),
                Tab(text: 'Kategori'),
                Tab(text: 'Supplier'),
                Tab(text: 'Pengguna'),
              ],
            ),
          ),
          const Expanded(
            child: TabBarView(
              children: [
                MasterBarangTab(),
                MasterKategoriTab(),
                MasterSupplierTab(),
                MasterUserTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
