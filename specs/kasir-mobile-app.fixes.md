# Fix list — kasir-mobile-app (round 2)

From `/review-faq` re-run. Verdict: FAIL. Round 1's five fixes (kasir hold/mulai-baru,
keuangan manual entry, Stok category filter, Penjualan cashier filter) are confirmed fixed.
This round found the same class of bug in a screen not covered by round 1.

1. **Edge case: "Phone storage full / local DB write failure: an explicit error is shown
   rather than silently losing the transaction."** `lib/screens/setting/setting_screen.dart`
   has four unguarded `await _repo.save(s)` calls with no try/catch, so a DB write failure
   propagates unhandled instead of surfacing an explicit error:
   - `_saveGeneral()` (~line 68) — general store info/footer/tax/backup-URL save.
   - `_setPrinter()` (~line 78) — printer device selection save.
   - `_setPrinterWidth()` (~line 84) — paper width save.
   - `_backupLogout()` (~line 132) — clearing backup credentials.

   Wrap each in a try/catch showing a `SnackBar` on failure (the same pattern already used
   in `_backupLogin()`/`_backupNow()` in the same file, or the `runSafely` helper in
   `lib/utils/error_reporting.dart` used elsewhere) — only call `setState` to update
   `_setting` on success.
