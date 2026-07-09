import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/transaksi.dart';
import '../../repositories/transaksi_repository.dart';
import '../../services/session_state.dart';
import 'kasir_screen.dart';

/// Shown on entering KASIR: offers "Mulai Baru" (fresh transaction) or
/// "Lanjutkan Transaksi" (resume a held one) when one exists for this user.
/// If there's no held transaction, it skips straight to a fresh KasirScreen.
class KasirSessionScreen extends StatefulWidget {
  const KasirSessionScreen({super.key});

  @override
  State<KasirSessionScreen> createState() => _KasirSessionScreenState();
}

class _KasirSessionScreenState extends State<KasirSessionScreen> {
  bool _loading = true;
  Transaksi? _held;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() => _loading = true);
    final idUser = context.read<SessionState>().currentUser!.id!;
    final held = await TransaksiRepository().openTransaksiForUser(idUser);
    if (!mounted) return;
    setState(() {
      _held = held;
      _loading = false;
    });
    if (held == null) {
      await _openKasir(null);
    }
  }

  Future<void> _openKasir(Transaksi? initial) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => KasirScreen(initialTransaksi: initial)),
    );
    if (mounted) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _held == null) {
      return const Center(child: CircularProgressIndicator());
    }
    final held = _held!;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.pause_circle_outline, size: 56, color: Colors.orange),
            const SizedBox(height: 16),
            Text(
              'Ada transaksi tertunda (${held.items.length} item).',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => _openKasir(held),
              child: const Text('Lanjutkan Transaksi'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                try {
                  await TransaksiRepository().discardHeld(held.id!);
                  if (mounted) _refresh();
                } catch (e) {
                  messenger.showSnackBar(SnackBar(content: Text('Gagal memulai baru: $e')));
                }
              },
              child: const Text('Mulai Baru'),
            ),
          ],
        ),
      ),
    );
  }
}
