import {getDatabase} from '../database';
import {Transaction, TransactionItem} from '../../types';
import {
  findProductById,
  findProductByBarcode,
  adjustStock,
} from './productRepo';
import {
  resolvePrice,
  computeLineTotal,
  computeTaxTotal,
  round2,
} from '../../domain/pricing';
import {insertFinanceEntry} from './financeRepo';

function mapTxRow(row: any): Transaction {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    cashierId: row.cashier_id,
    cashierName: row.cashier_name ?? undefined,
    subtotal: row.subtotal,
    discountTotal: row.discount_total,
    taxTotal: row.tax_total,
    total: row.total,
    cashPaid: row.cash_paid,
    changeDue: row.change_due,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    paidAt: row.paid_at,
  };
}

function mapItemRow(row: any): TransactionItem {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    productId: row.product_id,
    barcode: row.barcode,
    name: row.name,
    unit: row.unit,
    qty: row.qty,
    unitPrice: row.unit_price,
    priceTier: row.price_tier,
    discount: row.discount,
    lineTotal: row.line_total,
    hpp: row.hpp,
  };
}

function generateCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `TX-${y}${m}${d}-${rand}`;
}

/** Returns the single in-progress (status='open') transaction, if any. */
export async function getOpenTransaction(): Promise<Transaction | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT t.*, u.name as cashier_name FROM transactions t
     JOIN users u ON u.id = t.cashier_id
     WHERE t.status = 'open' ORDER BY t.id DESC LIMIT 1;`,
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapTxRow(result.rows.item(0));
}

export async function getTransactionItems(
  transactionId: number,
): Promise<TransactionItem[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM transaction_items WHERE transaction_id = ? ORDER BY id ASC;',
    [transactionId],
  );
  const items: TransactionItem[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    items.push(mapItemRow(result.rows.item(i)));
  }
  return items;
}

export async function getTransactionById(
  id: number,
): Promise<Transaction | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT t.*, u.name as cashier_name FROM transactions t
     JOIN users u ON u.id = t.cashier_id WHERE t.id = ?;`,
    [id],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapTxRow(result.rows.item(0));
}

/** Creates a brand-new open transaction for the given cashier. */
export async function createOpenTransaction(
  cashierId: number,
): Promise<Transaction> {
  const db = await getDatabase();
  const code = generateCode();
  const [result] = await db.executeSql(
    `INSERT INTO transactions (code, status, cashier_id, subtotal, discount_total, tax_total, total)
     VALUES (?, 'open', ?, 0, 0, 0, 0);`,
    [code, cashierId],
  );
  const tx = await getTransactionById(result.insertId);
  return tx as Transaction;
}

/** Voids (discards) a transaction, e.g. when the cashier chooses "Mulai Baru". */
export async function voidTransaction(transactionId: number): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    "UPDATE transactions SET status = 'void', updated_at = datetime('now') WHERE id = ?;",
    [transactionId],
  );
}

async function recomputeTotals(
  transactionId: number,
  taxRate: number,
): Promise<void> {
  const db = await getDatabase();
  const items = await getTransactionItems(transactionId);
  const subtotal = round2(items.reduce((sum, i) => sum + i.lineTotal, 0));
  const discountTotal = round2(items.reduce((sum, i) => sum + i.discount, 0));
  const taxTotal = computeTaxTotal(subtotal, taxRate);
  const total = round2(subtotal + taxTotal);
  await db.executeSql(
    "UPDATE transactions SET subtotal = ?, discount_total = ?, tax_total = ?, total = ?, updated_at = datetime('now') WHERE id = ?;",
    [subtotal, discountTotal, taxTotal, total, transactionId],
  );
}

/**
 * Adds a scanned/entered barcode's product to the transaction, or increments
 * its quantity by 1 if already present. Recalculates tiered pricing.
 * Returns null if no matching product was found (barcode not found).
 */
export async function addOrIncrementItemByBarcode(
  transactionId: number,
  barcode: string,
  taxRate: number,
): Promise<{ok: true} | {ok: false; reason: 'not_found'}> {
  const db = await getDatabase();
  const [existingResult] = await db.executeSql(
    'SELECT * FROM transaction_items WHERE transaction_id = ? AND barcode = ?;',
    [transactionId, barcode],
  );

  if (existingResult.rows.length > 0) {
    const row = existingResult.rows.item(0);
    const product = await findProductById(row.product_id);
    if (!product) {
      return {ok: false, reason: 'not_found'};
    }
    const newQty = row.qty + 1;
    const {unitPrice, tier} = resolvePrice(product, newQty);
    const lineTotal = computeLineTotal(unitPrice, newQty, row.discount);
    await db.executeSql(
      'UPDATE transaction_items SET qty = ?, unit_price = ?, price_tier = ?, line_total = ? WHERE id = ?;',
      [newQty, unitPrice, tier, lineTotal, row.id],
    );
  } else {
    const product = await findProductByBarcode(barcode);
    if (!product) {
      return {ok: false, reason: 'not_found'};
    }
    const {unitPrice, tier} = resolvePrice(product, 1);
    const lineTotal = computeLineTotal(unitPrice, 1, 0);
    await db.executeSql(
      `INSERT INTO transaction_items
        (transaction_id, product_id, barcode, name, unit, qty, unit_price, price_tier, discount, line_total, hpp)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, 0, ?, ?);`,
      [
        transactionId,
        product.id,
        product.barcode,
        product.name,
        product.unit,
        unitPrice,
        tier,
        lineTotal,
        product.hpp,
      ],
    );
  }

  await recomputeTotals(transactionId, taxRate);
  return {ok: true};
}

/** Directly sets a row's quantity (from the QTY numpad popup) and re-resolves tiered pricing. */
export async function setItemQty(
  transactionId: number,
  itemId: number,
  qty: number,
  taxRate: number,
): Promise<void> {
  const db = await getDatabase();
  if (qty <= 0) {
    await removeItem(transactionId, itemId, taxRate);
    return;
  }
  const [result] = await db.executeSql(
    'SELECT * FROM transaction_items WHERE id = ?;',
    [itemId],
  );
  if (result.rows.length === 0) {
    return;
  }
  const row = result.rows.item(0);
  const product = await findProductById(row.product_id);
  if (!product) {
    return;
  }
  const {unitPrice, tier} = resolvePrice(product, qty);
  const lineTotal = computeLineTotal(unitPrice, qty, row.discount);
  await db.executeSql(
    'UPDATE transaction_items SET qty = ?, unit_price = ?, price_tier = ?, line_total = ? WHERE id = ?;',
    [qty, unitPrice, tier, lineTotal, itemId],
  );
  await recomputeTotals(transactionId, taxRate);
}

/** Sets a per-row discount amount (currency, not percent) and recomputes totals. */
export async function setItemDiscount(
  transactionId: number,
  itemId: number,
  discount: number,
  taxRate: number,
): Promise<void> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM transaction_items WHERE id = ?;',
    [itemId],
  );
  if (result.rows.length === 0) {
    return;
  }
  const row = result.rows.item(0);
  const safeDiscount = Math.max(0, discount);
  const lineTotal = computeLineTotal(row.unit_price, row.qty, safeDiscount);
  await db.executeSql(
    'UPDATE transaction_items SET discount = ?, line_total = ? WHERE id = ?;',
    [safeDiscount, lineTotal, itemId],
  );
  await recomputeTotals(transactionId, taxRate);
}

export async function removeItem(
  transactionId: number,
  itemId: number,
  taxRate: number,
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM transaction_items WHERE id = ?;', [itemId]);
  await recomputeTotals(transactionId, taxRate);
}

/**
 * Commits payment: persists cash paid/change and marks the transaction paid,
 * decrements stock for each line, and posts a debit finance entry.
 * This must complete (and does) before any print attempt is made.
 */
export async function completeTransactionPayment(
  transactionId: number,
  cashPaid: number,
): Promise<Transaction> {
  const db = await getDatabase();
  const tx = await getTransactionById(transactionId);
  if (!tx) {
    throw new Error('Transaction not found');
  }
  const changeDue = round2(cashPaid - tx.total);

  await db.executeSql(
    "UPDATE transactions SET status = 'paid', cash_paid = ?, change_due = ?, paid_at = datetime('now'), updated_at = datetime('now') WHERE id = ?;",
    [cashPaid, changeDue, transactionId],
  );

  const items = await getTransactionItems(transactionId);
  for (const item of items) {
    await adjustStock(item.productId, -item.qty);
  }

  await insertFinanceEntry({
    type: 'debit',
    source: 'kasir',
    refId: transactionId,
    amount: tx.total,
    description: `Penjualan ${tx.code}`,
  });

  const updated = await getTransactionById(transactionId);
  return updated as Transaction;
}

export async function listPaidTransactions(opts?: {
  from?: string;
  to?: string;
}): Promise<Transaction[]> {
  const db = await getDatabase();
  const clauses: string[] = ["t.status = 'paid'"];
  const params: any[] = [];
  if (opts?.from) {
    clauses.push('date(t.paid_at) >= date(?)');
    params.push(opts.from);
  }
  if (opts?.to) {
    clauses.push('date(t.paid_at) <= date(?)');
    params.push(opts.to);
  }
  const [result] = await db.executeSql(
    `SELECT t.*, u.name as cashier_name FROM transactions t
     JOIN users u ON u.id = t.cashier_id
     WHERE ${clauses.join(' AND ')} ORDER BY t.paid_at DESC;`,
    params,
  );
  const items: Transaction[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    items.push(mapTxRow(result.rows.item(i)));
  }
  return items;
}
