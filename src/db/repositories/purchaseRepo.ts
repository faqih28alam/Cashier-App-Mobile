import {getDatabase} from '../database';
import {Purchase, PurchaseItem} from '../../types';
import {
  findProductByBarcode,
  adjustStock,
  createProductFromPurchaseLine,
} from './productRepo';
import {insertFinanceEntry} from './financeRepo';
import {round2} from '../../domain/pricing';

export interface PurchaseLineInput {
  barcode: string;
  name: string;
  unit: string;
  qty: number;
  unitCost: number;
  harga1?: number | null;
}

function mapPurchaseRow(row: any): Purchase {
  return {
    id: row.id,
    code: row.code,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name ?? null,
    status: row.status,
    total: row.total,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
  };
}

function mapItemRow(row: any): PurchaseItem {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    productId: row.product_id,
    barcode: row.barcode,
    name: row.name,
    qty: row.qty,
    unitCost: row.unit_cost,
    harga1: row.harga_1,
    lineTotal: row.line_total,
  };
}

function generateCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `PO-${y}${m}${d}-${rand}`;
}

export async function listPurchases(): Promise<Purchase[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT p.*, s.name as supplier_name FROM purchases p
     LEFT JOIN suppliers s ON s.id = p.supplier_id
     ORDER BY p.created_at DESC;`,
  );
  const items: Purchase[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    items.push(mapPurchaseRow(result.rows.item(i)));
  }
  return items;
}

export async function getPurchaseById(id: number): Promise<Purchase | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT p.*, s.name as supplier_name FROM purchases p
     LEFT JOIN suppliers s ON s.id = p.supplier_id WHERE p.id = ?;`,
    [id],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapPurchaseRow(result.rows.item(0));
}

export async function getPurchaseItems(
  purchaseId: number,
): Promise<PurchaseItem[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM purchase_items WHERE purchase_id = ? ORDER BY id ASC;',
    [purchaseId],
  );
  const items: PurchaseItem[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    items.push(mapItemRow(result.rows.item(i)));
  }
  return items;
}

async function insertLines(
  db: Awaited<ReturnType<typeof getDatabase>>,
  purchaseId: number,
  lines: PurchaseLineInput[],
): Promise<void> {
  for (const line of lines) {
    const product = await findProductByBarcode(line.barcode);
    const lineTotal = round2(line.qty * line.unitCost);
    await db.executeSql(
      `INSERT INTO purchase_items
        (purchase_id, product_id, barcode, name, unit, qty, unit_cost, harga_1, line_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        purchaseId,
        product?.id ?? null,
        line.barcode,
        line.name,
        line.unit,
        line.qty,
        line.unitCost,
        line.harga1 ?? null,
        lineTotal,
      ],
    );
  }
}

export async function createDraftPurchase(
  supplierId: number | null,
  lines: PurchaseLineInput[],
): Promise<Purchase> {
  const db = await getDatabase();
  const code = generateCode();
  const total = round2(lines.reduce((s, l) => s + l.qty * l.unitCost, 0));
  const [result] = await db.executeSql(
    "INSERT INTO purchases (code, supplier_id, status, total) VALUES (?, ?, 'draft', ?);",
    [code, supplierId, total],
  );
  const purchaseId = result.insertId;
  await insertLines(db, purchaseId, lines);
  const purchase = await getPurchaseById(purchaseId);
  return purchase as Purchase;
}

/** Replaces a draft purchase's lines/supplier and recomputes its total. Rejected if not draft. */
export async function updateDraftPurchase(
  purchaseId: number,
  supplierId: number | null,
  lines: PurchaseLineInput[],
): Promise<{ok: true} | {ok: false; reason: 'not_draft'}> {
  const purchase = await getPurchaseById(purchaseId);
  if (!purchase || purchase.status !== 'draft') {
    return {ok: false, reason: 'not_draft'};
  }
  const db = await getDatabase();
  const total = round2(lines.reduce((s, l) => s + l.qty * l.unitCost, 0));
  await db.executeSql(
    'UPDATE purchases SET supplier_id = ?, total = ? WHERE id = ?;',
    [supplierId, total, purchaseId],
  );
  await db.executeSql('DELETE FROM purchase_items WHERE purchase_id = ?;', [
    purchaseId,
  ]);
  await insertLines(db, purchaseId, lines);
  return {ok: true};
}

/**
 * Confirms a draft purchase: increments stock for each line (auto-creating
 * the product from the line's harga1 if the barcode has no match yet), and
 * posts a kredit entry to Keuangan. Confirming an already-confirmed purchase
 * is rejected.
 */
export async function confirmPurchase(
  purchaseId: number,
): Promise<
  {ok: true} | {ok: false; reason: 'already_confirmed' | 'not_found'}
> {
  const purchase = await getPurchaseById(purchaseId);
  if (!purchase) {
    return {ok: false, reason: 'not_found'};
  }
  if (purchase.status === 'confirmed') {
    return {ok: false, reason: 'already_confirmed'};
  }

  const db = await getDatabase();
  const lines = await getPurchaseItems(purchaseId);
  for (const line of lines) {
    let productId = line.productId;
    if (!productId) {
      const existing = await findProductByBarcode(line.barcode);
      if (existing) {
        productId = existing.id;
      } else {
        const created = await createProductFromPurchaseLine({
          barcode: line.barcode,
          name: line.name,
          unit: 'pcs',
          hpp: line.unitCost,
          harga1: line.harga1 ?? line.unitCost,
          stock: 0,
        });
        productId = created.id;
      }
      await db.executeSql(
        'UPDATE purchase_items SET product_id = ? WHERE id = ?;',
        [productId, line.id],
      );
    }
    await adjustStock(productId, line.qty);
  }

  await db.executeSql(
    "UPDATE purchases SET status = 'confirmed', confirmed_at = datetime('now') WHERE id = ?;",
    [purchaseId],
  );

  await insertFinanceEntry({
    type: 'kredit',
    source: 'purchas',
    refId: purchaseId,
    amount: purchase.total,
    description: `Pembelian ${purchase.code}`,
  });

  return {ok: true};
}
