# Cashier App — Mobile (React Native)

## 1. Objective

The first client's `cashier-app` is a desktop POS (Next.js + FastAPI) for a retail store. A new client runs a similar retail business but wants a phone-based POS instead of a desktop one. This spec covers a standalone Android app, built with React Native, that replicates the original's core POS functionality as a self-contained, offline, on-device application — with no backend server and no dependency on the original client's infrastructure, since this APK will be installed independently on different clients' phones.

## 2. Requirements

1. The app includes all six modules from the original desktop app: KASIR (point of sale), PURCHAS (purchasing), KEUANGAN (finance), LAPORAN (reports), MASTER (master data), and SETTING (configuration).
2. Barcode entry into a transaction supports two input methods: (a) the phone's camera used as a barcode scanner, and (b) an external Bluetooth barcode scanner paired to the phone. Both methods add/increment items in the transaction table identically.
3. KASIR replicates the original transaction flow: scan/enter barcode → item added at QTY 1 (or incremented if already present) → tiered pricing (Harga 1/2/3, threshold-based) auto-applied based on QTY → numpad popup for QTY edit → per-row discount → running transaction total shown live → BAYAR opens payment screen.
4. The payment screen replicates the original: quick cash denomination buttons, exact-pay button, editable cash input, auto-calculated change (Kembalian), and KONFIRMASI enabled only when cash paid ≥ total.
5. On payment confirmation, the transaction is committed to local on-device storage before any print attempt is made.
6. After a successful transaction, a receipt is sent to a paired Bluetooth ESC/POS thermal printer, formatted for either 58mm or 80mm paper (configurable in SETTING), matching the original's receipt content: store name/address/phone, date/time, cashier name, itemized list, subtotal, cash paid, change, footer text.
7. Receipts are print-only for this version — no digital/e-receipt sharing (e.g. WhatsApp, email) is included.
8. All application data (products, categories, suppliers, users, transactions, purchases, finance records, settings) is stored locally on the device (e.g. local SQLite). No backend server, no network API, and no cross-device sync exist in this version.
9. The app is designed for a single device per store — there is no mechanism for multiple phones/tablets to share or merge data.
10. User roles and permissions match the original: Kasir (KASIR module only), Admin (all modules), Owner (all modules + financial reports). Login is against locally stored user accounts with hashed passwords.
11. Held/interrupted transactions (items scanned but not yet paid) survive an app close or crash: on reopening the app, the cashier is offered a session screen with "Mulai Baru" (start fresh) or "Lanjutkan Transaksi" (resume the held transaction), same as the original.
12. SETTING includes: store name, address, phone, logo, receipt footer text, tax rate (optional), printer paper width (58mm/80mm), and Bluetooth printer pairing/selection.
13. A backup/export feature (in SETTING) exports local data to a file. The primary target is the SD card if available and writable; if no SD card is present or write permission is denied, the export falls back to internal app storage and/or the Android share sheet, rather than failing with an error.
14. MASTER, PURCHAS, KEUANGAN, and LAPORAN modules replicate the original's fields and behavior (product CRUD with barcode/name/category/unit/HPP/three price tiers/stock/min-stock; supplier and category CRUD; purchase recording that updates stock; income/expense/cash-balance tracking; sales/product/stock/transaction/finance reports with date-range filters), adapted to a mobile-friendly layout.

## 3. Constraints & Non-Goals

**Constraints:**
- Platform: Android only, minimum Android 10 (API 29). No iOS version in this scope.
- Framework: React Native.
- No fixed delivery deadline.
- Target repository for the build phase: `https://github.com/faqih28alam/Cashier-App-Mobile.git`, branch `react-native`. (Repo/branch setup and code delivery happen during the build phase, not as part of this spec.)

**Non-Goals (explicitly out of scope for this version):**
- iOS support.
- Any backend server, hosted API, or cloud database — the app must not require network connectivity to function.
- Multi-device or multi-phone data sync — each installation's data is independent and local only.
- Digital/e-receipt sharing (WhatsApp, email, etc.) — print-only.
- Online/QRIS/credit-card payment integration.
- Multi-branch support.
- Loyalty/points system.

## 4. Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Scanned/entered barcode does not match any product | Show an error ("Barcode tidak ditemukan") without adding a row; transaction table unchanged. |
| Bluetooth thermal printer is disconnected, unpaired, or fails during/after payment confirmation | The transaction is still committed to local storage; the app shows a retry/reprint option instead of blocking or reversing the sale. |
| App is closed or crashes while a transaction is in progress (items added, not yet paid) | On next launch, the transaction is recoverable via "Lanjutkan Transaksi" on the session screen, restoring the full transaction table state. |
| Cashier enters cash paid less than the transaction total | KONFIRMASI stays disabled; payment cannot be confirmed until cash paid ≥ total. |
| Backup/export is triggered but no SD card is present, or write permission to the SD card is denied | Export falls back to internal app storage and/or the Android share sheet; the export still completes and the user is not shown a hard failure. |
| A Kasir-role user attempts to access a restricted module (PURCHAS, KEUANGAN, LAPORAN, MASTER, SETTING) | Access is blocked; only KASIR is available to that role. |
| Camera permission is denied for barcode scanning | Camera scanning is unavailable, but manual barcode entry and a paired Bluetooth scanner remain usable. |
| Product quantity in a transaction crosses a tiered-pricing threshold (e.g. from 4 to 6 units) | The applied price tier (Harga 1/2/3) recalculates automatically and the row/running total update immediately. |
| Stock level for a product is at or below its configured minimum | Product/stock views flag it as low stock (matching the original's stock alert threshold behavior). |

## 5. Definition of Done

- [ ] App runs on Android 10+ devices as an installable APK, with no network/server dependency for any core function.
- [ ] All six modules (KASIR, PURCHAS, KEUANGAN, LAPORAN, MASTER, SETTING) are present and functional.
- [ ] Barcode entry works via both the phone camera and a paired external Bluetooth barcode scanner, with identical add/increment behavior.
- [ ] KASIR replicates: barcode add/increment, QTY numpad popup, automatic tiered pricing recalculation, per-row discount, live running total, hold transaction.
- [ ] Payment screen replicates: denomination shortcuts, exact-pay, editable cash input, auto-calculated change, KONFIRMASI gated on cash paid ≥ total.
- [ ] Confirmed transactions are committed to local storage before any print attempt.
- [ ] Receipts print correctly to a paired Bluetooth ESC/POS printer in both 58mm and 80mm formats, matching the original's receipt content and layout.
- [ ] If printing fails, the transaction is still saved and a retry/reprint option is available.
- [ ] A held/interrupted transaction survives app close/crash and is resumable via "Lanjutkan Transaksi".
- [ ] Role-based access is enforced for Kasir, Admin, and Owner exactly as in the original.
- [ ] SETTING supports store info, receipt footer, tax rate, printer width, and Bluetooth printer selection.
- [ ] Backup/export writes to SD card when available, and falls back to internal storage/share sheet without erroring when it is not.
- [ ] No feature in this build requires a second device or any server/cloud component to function.
