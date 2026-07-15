import {getDatabase} from '../database';

export interface SalesSummary {
  transactionCount: number;
  totalSales: number;
  totalDiscount: number;
  totalTax: number;
}

/** Aggregated sales totals for LAPORAN > Laporan Penjualan, filtered by paid date range. */
export async function getSalesSummary(opts?: {
  from?: string;
  to?: string;
}): Promise<SalesSummary> {
  const db = await getDatabase();
  const clauses: string[] = ["status = 'paid'"];
  const params: any[] = [];
  if (opts?.from) {
    clauses.push('date(paid_at) >= date(?)');
    params.push(opts.from);
  }
  if (opts?.to) {
    clauses.push('date(paid_at) <= date(?)');
    params.push(opts.to);
  }
  const [result] = await db.executeSql(
    `SELECT
      COUNT(*) as tx_count,
      COALESCE(SUM(total), 0) as total_sales,
      COALESCE(SUM(discount_total), 0) as total_discount,
      COALESCE(SUM(tax_total), 0) as total_tax
     FROM transactions WHERE ${clauses.join(' AND ')};`,
    params,
  );
  const row = result.rows.item(0);
  return {
    transactionCount: row.tx_count,
    totalSales: row.total_sales,
    totalDiscount: row.total_discount,
    totalTax: row.total_tax,
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
    `SELECT ti.product_id, ti.name, ti.barcode,
      SUM(ti.qty) as qty_sold, SUM(ti.line_total) as total_sales
     FROM transaction_items ti
     JOIN transactions t ON t.id = ti.transaction_id
     WHERE ${clauses.join(' AND ')}
     GROUP BY ti.product_id
     ORDER BY qty_sold DESC;`,
    params,
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
