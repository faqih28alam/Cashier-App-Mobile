import {getDatabase} from '../database';
import {Supplier} from '../../types';

function mapRow(row: any): Supplier {
  return {id: row.id, name: row.name, phone: row.phone, address: row.address};
}

export async function listSuppliers(): Promise<Supplier[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM suppliers ORDER BY name ASC;',
  );
  const items: Supplier[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    items.push(mapRow(result.rows.item(i)));
  }
  return items;
}

export async function createSupplier(input: {
  name: string;
  phone?: string | null;
  address?: string | null;
}): Promise<Supplier> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?);',
    [input.name, input.phone ?? null, input.address ?? null],
  );
  return {
    id: result.insertId,
    name: input.name,
    phone: input.phone ?? null,
    address: input.address ?? null,
  };
}

export async function updateSupplier(
  id: number,
  input: {name: string; phone?: string | null; address?: string | null},
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    'UPDATE suppliers SET name = ?, phone = ?, address = ? WHERE id = ?;',
    [input.name, input.phone ?? null, input.address ?? null, id],
  );
}

export async function deleteSupplier(id: number): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM suppliers WHERE id = ?;', [id]);
}
