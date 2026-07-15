import {getDatabase} from '../database';
import {Product} from '../../types';

function mapRow(row: any): Product {
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    categoryId: row.category_id,
    categoryName: row.category_name ?? null,
    unit: row.unit,
    hpp: row.hpp,
    harga1: row.harga_1,
    harga2: row.harga_2,
    harga2MinQty: row.harga_2_min_qty,
    harga3: row.harga_3,
    harga3MinQty: row.harga_3_min_qty,
    stock: row.stock,
    minStock: row.min_stock,
    active: !!row.active,
  };
}

const SELECT_BASE = `
  SELECT p.*, c.name as category_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

export async function listProducts(opts?: {
  search?: string;
  onlyActive?: boolean;
}): Promise<Product[]> {
  const db = await getDatabase();
  const clauses: string[] = [];
  const params: any[] = [];
  if (opts?.search) {
    clauses.push('(p.name LIKE ? OR p.barcode LIKE ?)');
    params.push(`%${opts.search}%`, `%${opts.search}%`);
  }
  if (opts?.onlyActive) {
    clauses.push('p.active = 1');
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [result] = await db.executeSql(
    `${SELECT_BASE} ${where} ORDER BY p.name ASC;`,
    params,
  );
  const items: Product[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    items.push(mapRow(result.rows.item(i)));
  }
  return items;
}

export async function findProductByBarcode(
  barcode: string,
): Promise<Product | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `${SELECT_BASE} WHERE p.barcode = ? LIMIT 1;`,
    [barcode],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapRow(result.rows.item(0));
}

export async function findProductById(id: number): Promise<Product | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(`${SELECT_BASE} WHERE p.id = ?;`, [id]);
  if (result.rows.length === 0) {
    return null;
  }
  return mapRow(result.rows.item(0));
}

export async function listLowStockProducts(): Promise<Product[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `${SELECT_BASE} WHERE p.stock <= p.min_stock AND p.active = 1 ORDER BY p.name ASC;`,
  );
  const items: Product[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    items.push(mapRow(result.rows.item(i)));
  }
  return items;
}

export interface ProductInput {
  barcode: string;
  name: string;
  categoryId: number | null;
  unit: string;
  hpp: number;
  harga1: number;
  harga2: number | null;
  harga2MinQty: number | null;
  harga3: number | null;
  harga3MinQty: number | null;
  stock: number;
  minStock: number;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `INSERT INTO products
      (barcode, name, category_id, unit, hpp, harga_1, harga_2, harga_2_min_qty, harga_3, harga_3_min_qty, stock, min_stock, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);`,
    [
      input.barcode,
      input.name,
      input.categoryId,
      input.unit,
      input.hpp,
      input.harga1,
      input.harga2,
      input.harga2MinQty,
      input.harga3,
      input.harga3MinQty,
      input.stock,
      input.minStock,
    ],
  );
  const product = await findProductById(result.insertId);
  return product as Product;
}

export async function updateProduct(
  id: number,
  input: ProductInput,
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    `UPDATE products SET
      barcode = ?, name = ?, category_id = ?, unit = ?, hpp = ?,
      harga_1 = ?, harga_2 = ?, harga_2_min_qty = ?, harga_3 = ?, harga_3_min_qty = ?,
      stock = ?, min_stock = ?
     WHERE id = ?;`,
    [
      input.barcode,
      input.name,
      input.categoryId,
      input.unit,
      input.hpp,
      input.harga1,
      input.harga2,
      input.harga2MinQty,
      input.harga3,
      input.harga3MinQty,
      input.stock,
      input.minStock,
      id,
    ],
  );
}

export async function setProductActive(
  id: number,
  active: boolean,
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE products SET active = ? WHERE id = ?;', [
    active ? 1 : 0,
    id,
  ]);
}

export async function adjustStock(id: number, deltaQty: number): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE products SET stock = stock + ? WHERE id = ?;', [
    deltaQty,
    id,
  ]);
}

/** Creates a product on-the-fly from a purchase line for a barcode with no existing match. */
export async function createProductFromPurchaseLine(input: {
  barcode: string;
  name: string;
  unit: string;
  hpp: number;
  harga1: number;
  stock: number;
}): Promise<Product> {
  return createProduct({
    barcode: input.barcode,
    name: input.name,
    categoryId: null,
    unit: input.unit,
    hpp: input.hpp,
    harga1: input.harga1,
    harga2: null,
    harga2MinQty: null,
    harga3: null,
    harga3MinQty: null,
    stock: input.stock,
    minStock: 0,
  });
}
