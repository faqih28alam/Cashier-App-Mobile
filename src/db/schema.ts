/**
 * SQLite schema for the on-device database. All statements are idempotent
 * (CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS) so they can be
 * re-run safely on every app start.
 */
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('kasir','admin','owner')),
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`,

  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );`,

  `CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT
  );`,

  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    hpp REAL NOT NULL DEFAULT 0,
    harga_1 REAL NOT NULL DEFAULT 0,
    harga_2 REAL,
    harga_2_min_qty REAL,
    harga_3 REAL,
    harga_3_min_qty REAL,
    stock REAL NOT NULL DEFAULT 0,
    min_stock REAL NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );`,

  'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);',

  `CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open','paid','void')) DEFAULT 'open',
    cashier_id INTEGER NOT NULL REFERENCES users(id),
    subtotal REAL NOT NULL DEFAULT 0,
    discount_total REAL NOT NULL DEFAULT 0,
    tax_total REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    cash_paid REAL,
    change_due REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at TEXT
  );`,

  // hpp is snapshotted from products.hpp when the item is added to the cart,
  // not joined live, so gross-profit reports stay stable if a product's cost changes later.
  `CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    barcode TEXT NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    qty REAL NOT NULL,
    unit_price REAL NOT NULL,
    price_tier TEXT NOT NULL DEFAULT 'harga_1',
    discount REAL NOT NULL DEFAULT 0,
    line_total REAL NOT NULL,
    hpp REAL NOT NULL DEFAULT 0
  );`,

  'CREATE INDEX IF NOT EXISTS idx_txitems_tx ON transaction_items(transaction_id);',

  `CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    status TEXT NOT NULL CHECK (status IN ('draft','confirmed')) DEFAULT 'draft',
    total REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    confirmed_at TEXT
  );`,

  `CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    barcode TEXT NOT NULL,
    name TEXT NOT NULL,
    qty REAL NOT NULL,
    unit_cost REAL NOT NULL,
    harga_1 REAL,
    line_total REAL NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS finance_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('debit','kredit')),
    source TEXT NOT NULL CHECK (source IN ('kasir','purchas','manual')),
    ref_id INTEGER,
    amount REAL NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`,

  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    store_name TEXT NOT NULL DEFAULT '',
    store_address TEXT NOT NULL DEFAULT '',
    store_phone TEXT NOT NULL DEFAULT '',
    logo_uri TEXT,
    receipt_footer TEXT NOT NULL DEFAULT 'Terima kasih',
    tax_rate REAL NOT NULL DEFAULT 0,
    paper_width INTEGER NOT NULL DEFAULT 58,
    printer_address TEXT,
    printer_name TEXT
  );`,

  'INSERT OR IGNORE INTO settings (id) VALUES (1);',
];
