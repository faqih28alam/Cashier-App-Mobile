# Kasir Mobile App (Android)

## Objective

A fully on-device Android point-of-sale app, built with Flutter, for a shop owner
client who has no PC or laptop. It ports the modules of the existing desktop
"Cashier App — Renal" system (KASIR, PURCHAS, KEUANGAN, LAPORAN, MASTER, SETTING)
to run standalone on her phone, using her existing Bluetooth barcode scanner and
Bluetooth thermal printer for hardware, and reusing an already-deployed external
backup service for data protection. This is a separate, independent build from
the desktop app — no shared runtime, database, or backend.

## Requirements

1. Platform: native Android app built with Flutter, distributed as a directly
   installable APK (sideloaded — no Google Play Store submission).
2. All modules from the desktop system are ported, matching the functional
   behavior described in `Cashier_App_Renal/PRD_Cashier_App.md`:
   - **KASIR** — point of sale / checkout
   - **PURCHAS** — purchasing / stock-in
   - **KEUANGAN** — finance / cash flow ledger
   - **LAPORAN** — reports
   - **MASTER** — products, suppliers, categories, users
   - **SETTING** — store config, printer, backup
3. All app data lives in a local, on-device relational database. The app is
   fully functional offline; only backup/restore requires internet access.
4. Role-based multi-user login, mirroring the desktop permission matrix:
   - **Kasir** — KASIR screen only (+ read-only product lookup)
   - **Admin** — all modules
   - **Owner** — all modules, including financial reports
   User accounts (username, hashed password, name, role, active status) are
   managed in MASTER > Pengguna by Admin/Owner.
5. KASIR screen:
   - Add items by scanning a barcode with the paired Bluetooth scanner, or by
     manual barcode entry — both resolve against local product data the same
     way (found → add row / increment qty; not found → error "Barcode tidak
     ditemukan").
   - Qty edit via numpad popup; changing qty re-resolves tiered pricing
     automatically (mirrors `resolve_price` — highest matching tier by
     min_qty, falling back to harga_1).
   - Per-row discount, delete row, clear all.
   - Hold current transaction (status = open) and resume it later via a
     session screen (Mulai Baru / Lanjutkan Transaksi) shown at KASIR entry.
   - Running transaction total updates live as the cart changes.
   - Payment screen: quick cash-denomination buttons, exact-pay button,
     manual cash input, auto-computed kembalian (change), confirm disabled
     while bayar < total.
6. Receipt printing via the paired Bluetooth ESC/POS thermal printer, at a
   paper width configurable in Settings (58mm or 80mm). The transaction is
   committed to the local database before printing is attempted; a failed or
   disconnected printer does not block or roll back the sale.
7. PURCHAS: record purchases against a supplier with draft/confirm status.
   Confirming a purchase increments product stock and posts a kredit entry to
   Keuangan; confirming an already-confirmed purchase is rejected. If a
   scanned/entered barcode has no matching product yet, confirming
   auto-creates the product using the harga_1 given on the purchase line.
8. KEUANGAN: debit/kredit/saldo ledger. Entries are auto-posted from KASIR
   (debit, on sale) and PURCHAS (kredit, on confirm); manual entries can be
   added for operational expenses.
9. LAPORAN: Data Barang, Laporan Penjualan, Laporan Stok, Laporan Transaksi,
   Laporan Keuangan — each filterable by date range, and by category/cashier
   where applicable.
10. MASTER: CRUD for Barang (barcode, nama, kategori, sat, hpp, harga_1, one
    or more price tiers with min_qty, stok, stok_minimum), Supplier, Kategori,
    and User.
11. SETTING: store info (nama, alamat, telepon, logo), printer config
    (paired Bluetooth device, paper width), receipt footer text, tax rate,
    and backup-service connection status.
12. Backup/restore, reusing the existing external backup service (already
    deployed; same API contract as `Cashier_App_Renal/backend/services/backup_client.py`
    and `routers/backup.py` — client_id/password login, multipart upload,
    list, download, restore):
    - Manual "Backup Now" button in Settings.
    - Automatic backup runs at least once daily without user action.
    - Restoring downloads a chosen backup, validates it's a real SQLite file
      (magic-byte check) before touching anything, then closes the app's
      local DB connection, replaces the local database file, reopens the
      connection, and reloads app state — no manual app close/reopen
      required from her (unlike the desktop flow, since this is a single
      app process rather than two servers holding the file open).
13. Stock guard: a sale that would take stock below zero is blocked, with an
    error naming the item — same rule as the desktop app.
14. Held transactions: at most one open transaction per user session,
    resumable via the session screen.

## Constraints

- **Platform**: Android only, targeting Android 8+ (API 26+). No iOS version.
- **Framework**: Flutter.
- **Database**: on-device (e.g. SQLite via a Flutter local-DB package) — no
  server process, no shared database with the desktop app.
- **Hardware**: Bluetooth barcode scanner and Bluetooth ESC/POS thermal
  printer (already owned by the client). See Open Questions re: scanner mode.
- **Backend**: none for core operations. The only network dependency is the
  existing external backup service, reused as-is.
- **Distribution**: direct APK handoff, sideloaded. Not published to Google
  Play.
- **Single device**: one phone, no multi-device sync of the same shop's data.
- **Data migration**: none — the app starts with an empty product/user
  catalog; all data is entered fresh through the app.
- **Timeline**: none specified.
- **Out of scope**: iOS build, Google Play publishing, a hosted/cloud backend
  for core data, multi-branch support, bulk data import tooling, QRIS/credit
  card payment integration, loyalty/points system, e-receipt via
  email/WhatsApp — consistent with the desktop PRD's out-of-scope list.

## Edge cases

- **Barcode not found**: show "Barcode tidak ditemukan"; nothing added to cart.
- **Insufficient stock at checkout**: block the sale, error names the item.
- **Printer unreachable/off during print**: sale is already committed; show a
  non-fatal notice; a reprint option should be available from transaction
  history.
- **Scanner or printer Bluetooth disconnected**: KASIR still works via manual
  barcode entry; Settings surfaces connection status so she can reconnect.
- **App killed or crashes mid-transaction**: the open transaction persists in
  the local DB and is resumable via "Lanjutkan Transaksi" on next launch.
- **No internet during backup/restore**: the attempt (manual or automatic)
  fails with a clear, retry-later message; core POS operations are unaffected.
- **Restore with a corrupted/invalid backup file**: rejected before any local
  data is touched, with an explicit error.
- **Switching users on the same phone**: only one session active at a time;
  switching requires logout then login — no simultaneous multi-user sessions.
- **Low stock**: products at or below stok_minimum are flagged in
  product list/reports, same as desktop.
- **Phone storage full / local DB write failure**: an explicit error is shown
  rather than silently losing the transaction.
- **Restricted module access**: a Kasir-role login cannot navigate to
  PURCHAS/KEUANGAN/LAPORAN/MASTER/SETTING — same permission model as desktop.

## Definition of done

- [ ] App installs on an Android 8+ device from a directly-distributed APK,
      without going through the Play Store.
- [ ] Fresh install starts with an empty product/user catalog; an Owner
      account can be created and logged into.
- [ ] A Kasir-role login sees only the KASIR screen; Admin/Owner logins see
      all six modules, matching the desktop permission matrix.
- [ ] Scanning a product with the paired Bluetooth scanner adds it to the
      transaction table; manual barcode entry produces the same result.
- [ ] Changing a row's qty across a configured price-tier threshold
      recalculates the unit price automatically.
- [ ] A transaction can be held, then resumed via the session screen after
      logging back in.
- [ ] Payment screen blocks confirmation when bayar < total and computes
      kembalian correctly; confirming commits the sale locally even with the
      printer off, and prints a receipt at the configured width (58mm/80mm)
      when the printer is reachable.
- [ ] A purchase can be created as draft, edited, and confirmed; confirming
      increments stock and posts a kredit entry to Keuangan; confirming twice
      is rejected.
- [ ] Keuangan shows auto-posted entries from a completed sale and a
      confirmed purchase, plus a manually entered expense, with a running
      saldo.
- [ ] All five Laporan reports render and can be filtered by date range.
- [ ] Master CRUD works for Barang (with price tiers), Supplier, Kategori,
      and User (including role assignment).
- [ ] Setting screen persists store info, printer device + width, receipt
      footer, tax rate, and shows backup-service connection status.
- [ ] "Backup Now" uploads a snapshot to the existing backup service and it
      appears in the backup list; an automatic backup also runs at least
      once daily without user action.
- [ ] Restoring a valid backup replaces local data and the app reflects the
      restored state without requiring a manual force-close/reopen; restoring
      an invalid file is rejected and leaves existing data untouched.
- [ ] Killing the app mid-transaction and reopening it allows resuming the
      held transaction via "Lanjutkan Transaksi".
- [ ] With the Bluetooth scanner/printer disconnected, KASIR still functions
      via manual barcode entry, and completed sales are saved with printing
      skipped non-fatally.

## Open questions

- Whether the Bluetooth barcode scanner works in HID keyboard-emulation mode
  (types into the focused field, no custom integration needed — same
  pattern as the desktop app's USB HID scanner) or requires dedicated
  Bluetooth SPP/BLE pairing code. Needs to be confirmed against the actual
  device before or during implementation; affects scanner integration effort.
