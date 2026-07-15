import {getDatabase} from '../database';
import {Category} from '../../types';

function mapRow(row: any): Category {
  return {id: row.id, name: row.name};
}

export async function listCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM categories ORDER BY name ASC;',
  );
  const items: Category[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    items.push(mapRow(result.rows.item(i)));
  }
  return items;
}

export async function createCategory(name: string): Promise<Category> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'INSERT INTO categories (name) VALUES (?);',
    [name],
  );
  return {id: result.insertId, name};
}

export async function updateCategory(id: number, name: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE categories SET name = ? WHERE id = ?;', [
    name,
    id,
  ]);
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM categories WHERE id = ?;', [id]);
}
