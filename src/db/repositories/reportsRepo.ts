import {getDatabase, SQLiteDatabase} from '../database';
import {toDateStr, todayStr, monthStartStr} from '../../domain/date';

/** Builds a `date(column) >= ? AND date(column) <= ?`-style clause/params pair for an optional paid-date range. */
function dateRangeClause(
  column: string,
  opts?: {from?: string; to?: string},
): {clause: string; params: any[]} {
  const parts: string[] = [];
  const params: any[] = [];
  if (opts?.from) {
    parts.push(`date(${column}) >= date(?)`);
    params.push(opts.from);
  }
  if (opts?.to) {
    parts.push(`date(${column}) <= date(?)`);
    params.push(opts.to);
  }
  return {clause: parts.map(p => ` AND ${p}`).join(''), params};
}

/** Item-level omzet (pre-tax revenue) and laba kotor (gross profit) for a paid-date range. */
async function queryOmzetLaba(
  db: SQLiteDatabase,
  opts?: {from?: string; to?: string},
): Promise<{omzet: number; laba: number}> {
  const items = dateRangeClause('t.paid_at', opts);
  const [result] = await db.executeSql(
    `SELECT COALESCE(SUM(ti.line_total), 0) as omzet,
      COALESCE(SUM(ti.line_total - ti.hpp * ti.qty), 0) as laba
     FROM transaction_items ti
     JOIN transactions t ON t.id = ti.transaction_id
     WHERE t.status = 'paid'${items.clause};`,
    items.params,
  );
  const row = result.rows.item(0);
  return {omzet: row.omzet, laba: row.laba};
}

export interface RevenueProfitOverview {
  todayOmzet: number;
  todayLabaKotor: number;
  monthOmzet: number;
  monthLabaKotor: number;
  monthTransactionCount: number;
}

/** Today + month-to-date omzet/laba kotor and month transaction count, for the Ringkasan stat cards. */
export async function getRevenueProfitOverview(): Promise<RevenueProfitOverview> {
  const db = await getDatabase();
  const today = todayStr();
  const monthStart = monthStartStr();

  const todayTotals = await queryOmzetLaba(db, {from: today, to: today});
  const monthTotals = await queryOmzetLaba(db, {from: monthStart, to: today});

  const monthRange = dateRangeClause('t.paid_at', {from: monthStart, to: today});
  const [monthCountResult] = await db.executeSql(
    `SELECT COUNT(DISTINCT t.id) as tx_count
     FROM transaction_items ti
     JOIN transactions t ON t.id = ti.transaction_id
     WHERE t.status = 'paid'${monthRange.clause};`,
    monthRange.params,
  );
  const monthCountRow = monthCountResult.rows.item(0);

  return {
    todayOmzet: todayTotals.omzet,
    todayLabaKotor: todayTotals.laba,
    monthOmzet: monthTotals.omzet,
    monthLabaKotor: monthTotals.laba,
    monthTransactionCount: monthCountRow.tx_count,
  };
}

export interface DailyRevenueProfit {
  date: string;
  omzet: number;
  labaKotor: number;
}

/**
 * One row per calendar day in [from, to] (inclusive), zero-filled for days
 * with no paid transactions, so line/bar charts get a continuous, evenly
 * spaced axis instead of gaps. Feeds both the 14-day trend chart and the
 * custom-range chart on the Ringkasan dashboard.
 */
export async function getDailyRevenueProfit(opts: {
  from: string;
  to: string;
}): Promise<DailyRevenueProfit[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT date(t.paid_at) as day,
      COALESCE(SUM(ti.line_total), 0) as omzet,
      COALESCE(SUM(ti.line_total - ti.hpp * ti.qty), 0) as laba
     FROM transaction_items ti
     JOIN transactions t ON t.id = ti.transaction_id
     WHERE t.status = 'paid' AND date(t.paid_at) >= date(?) AND date(t.paid_at) <= date(?)
     GROUP BY date(t.paid_at);`,
    [opts.from, opts.to],
  );
  const byDay = new Map<string, {omzet: number; labaKotor: number}>();
  for (let i = 0; i < result.rows.length; i++) {
    const r = result.rows.item(i);
    byDay.set(r.day, {omzet: r.omzet, labaKotor: r.laba});
  }

  const rows: DailyRevenueProfit[] = [];
  const cursor = new Date(`${opts.from}T00:00:00`);
  const end = new Date(`${opts.to}T00:00:00`);
  while (cursor <= end) {
    const key = toDateStr(cursor);
    const found = byDay.get(key);
    rows.push({
      date: key,
      omzet: found?.omzet ?? 0,
      labaKotor: found?.labaKotor ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return rows;
}

export interface SalesSummary {
  transactionCount: number;
  totalSales: number;
  totalDiscount: number;
  totalTax: number;
  totalGrossProfit: number;
}

/** Aggregated sales totals for LAPORAN > Laporan Penjualan, filtered by paid date range. */
export async function getSalesSummary(opts?: {
  from?: string;
  to?: string;
}): Promise<SalesSummary> {
  const db = await getDatabase();

  const tx = dateRangeClause('paid_at', opts);
  const [txResult] = await db.executeSql(
    `SELECT
      COUNT(*) as tx_count,
      COALESCE(SUM(total), 0) as total_sales,
      COALESCE(SUM(discount_total), 0) as total_discount,
      COALESCE(SUM(tax_total), 0) as total_tax
     FROM transactions WHERE status = 'paid'${tx.clause};`,
    tx.params,
  );
  const txRow = txResult.rows.item(0);

  // Gross profit is computed from transaction_items.hpp, the cost snapshotted
  // at the moment each item was added to the cart (see schema.ts), not a live
  // join to products.hpp — so this stays stable if a product's cost changes later.
  const items = dateRangeClause('t.paid_at', opts);
  const [profitResult] = await db.executeSql(
    `SELECT COALESCE(SUM(ti.line_total - ti.hpp * ti.qty), 0) as total_gross_profit
     FROM transaction_items ti
     JOIN transactions t ON t.id = ti.transaction_id
     WHERE t.status = 'paid'${items.clause};`,
    items.params,
  );
  const profitRow = profitResult.rows.item(0);

  return {
    transactionCount: txRow.tx_count,
    totalSales: txRow.total_sales,
    totalDiscount: txRow.total_discount,
    totalTax: txRow.total_tax,
    totalGrossProfit: profitRow.total_gross_profit,
  };
}

export interface ProductSalesRow {
  productId: number;
  name: string;
  barcode: string;
  qtySold: number;
  totalSales: number;
}

/** Per-product sales breakdown for the date range (used by Laporan Penjualan detail). */
export async function getProductSales(opts?: {
  from?: string;
  to?: string;
}): Promise<ProductSalesRow[]> {
  const db = await getDatabase();
  const items = dateRangeClause('t.paid_at', opts);
  const [result] = await db.executeSql(
    `SELECT ti.product_id, ti.name, ti.barcode,
      SUM(ti.qty) as qty_sold, SUM(ti.line_total) as total_sales
     FROM transaction_items ti
     JOIN transactions t ON t.id = ti.transaction_id
     WHERE t.status = 'paid'${items.clause}
     GROUP BY ti.product_id
     ORDER BY qty_sold DESC;`,
    items.params,
  );
  const rows: ProductSalesRow[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const r = result.rows.item(i);
    rows.push({
      productId: r.product_id,
      name: r.name,
      barcode: r.barcode,
      qtySold: r.qty_sold,
      totalSales: r.total_sales,
    });
  }
  return rows;
}
