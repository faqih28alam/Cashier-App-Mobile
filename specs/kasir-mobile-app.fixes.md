# Fix list — kasir-mobile-app (round 3)

From `/review-faq` re-run. Verdict: FAIL. All round 1 and round 2 fixes (kasir hold/mulai-baru,
keuangan manual entry, Stok category filter, Penjualan cashier filter, Setting save error
handling) are confirmed still fixed — no regressions. `flutter analyze` is clean and all 18
existing tests pass. This round found four new gaps not covered by prior rounds.

1. **Requirement 4 — role permission matrix: "Owner — all modules, including financial
   reports" (implying Admin does not get financial reports; matches the desktop PRD's user
   roles table: "Admin: All modules" vs "Owner: All modules + financial reports").**
   `lib/services/session_state.dart` defines `isAdmin`/`isOwner` but nothing in the app uses
   them to distinguish financial-report access — `lib/screens/home_shell.dart` grants Admin
   and Owner identical access to all six modules via `canAccessOtherModules` (`isAdmin ||
   isOwner`), and `lib/screens/laporan/laporan_home_screen.dart` shows the "Keuangan" report
   tab to both roles equally with no gating.

   Fix: gate financial-report access (the KEUANGAN module and/or the "Keuangan" tab in
   LAPORAN — whichever the desktop app treats as "financial reports") to Owner only. Admin
   should see it's not accessible (e.g. hide the module/tab, or show a permission-denied
   state), while Kasir remains fully blocked as today.

2. **Requirement 11 — SETTING store info: "nama, alamat, telepon, logo".** The `logo_path`
   column exists in the `setting` table (`lib/db/app_database.dart`) and `AppSetting` model
   (`lib/models/setting.dart`), but there is no UI in `lib/screens/setting/setting_screen.dart`
   to actually set a store logo — no image picker, no field, no way for `logoPath` to ever be
   populated. The data model supports it; the feature is entirely missing from the screen.

   Fix: add a logo picker/field to the "Informasi Toko" section of `setting_screen.dart` (e.g.
   an image picker that saves a local file path into `logoPath` via `_saveGeneral()`/
   `_repo.save`), consistent with the existing `runSafely` error-handling pattern already used
   there.

3. **Requirement 2/10 — MASTER module functional parity with the desktop PRD's Product
   Master actions: "Add, Edit, Delete, Search by name/barcode, filter by category."**
   `lib/screens/master/tab_barang.dart` has search-by-name/barcode but no category filter —
   contrast with `lib/screens/laporan/tab_stok.dart` and
   `lib/screens/laporan/tab_data_barang.dart`, which both already have a working category
   `DropdownButton` wired to `BarangRepository().all(kategoriId: ...)`.

   Fix: add the same category-filter dropdown pattern (see `tab_stok.dart` lines ~30-44) to
   `tab_barang.dart`, combined with the existing search field, passing `kategoriId` into
   `BarangRepository().all(search: _search, kategoriId: _kategoriId)`.

4. **Edge case: "No internet during backup/restore: the attempt (manual or automatic) fails
   with a clear, retry-later message."** `lib/services/backup_service.dart`'s `login`,
   `uploadBackup`, `listBackups`, and `downloadBackup` only wrap non-2xx HTTP *responses* in a
   `BackupServiceException` with a friendly message (via `_detail`) — they do nothing to catch
   the underlying `http` package's network-level exceptions (`SocketException`,
   `ClientException`, timeouts) that are thrown when there's no internet or the host is
   unreachable. Those raw exceptions propagate straight to the caller and get shown verbatim
   (e.g. `setting_screen.dart`'s `catch (e) { ...Text('$e') }`), producing an unfriendly
   technical string instead of a clear "no internet, try again later"-style message — unlike
   the desktop app's `backup_client.py`, which explicitly wraps `httpx.HTTPError` into
   `RuntimeError(f"Tidak bisa menghubungi layanan backup: {e}")` (`_unreachable`).

   Fix: in `BackupService`, wrap each network call in a try/catch for the underlying HTTP
   client exceptions and rethrow as `BackupServiceException('Tidak bisa menghubungi layanan
   backup — periksa koneksi internet dan coba lagi nanti')` (mirroring the desktop's
   `_unreachable` helper), so every caller already displaying `BackupServiceException` messages
   gets a clear, retry-later message for free.
