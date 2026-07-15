import {getDatabase} from '../database';
import {Role, User} from '../../types';
import {hashPassword} from '../../domain/auth';

function mapRow(row: any): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    active: !!row.active,
    createdAt: row.created_at,
  };
}

export async function countUsers(): Promise<number> {
  const db = await getDatabase();
  const [result] = await db.executeSql('SELECT COUNT(*) as c FROM users;');
  return result.rows.item(0).c as number;
}

export async function listUsers(): Promise<User[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM users ORDER BY name ASC;',
  );
  const users: User[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    users.push(mapRow(result.rows.item(i)));
  }
  return users;
}

export async function findUserById(id: number): Promise<User | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql('SELECT * FROM users WHERE id = ?;', [
    id,
  ]);
  if (result.rows.length === 0) {
    return null;
  }
  return mapRow(result.rows.item(0));
}

export async function findUserByUsername(
  username: string,
): Promise<User | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM users WHERE username = ? LIMIT 1;',
    [username],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapRow(result.rows.item(0));
}

export async function createUser(input: {
  username: string;
  password: string;
  name: string;
  role: Role;
}): Promise<User> {
  const db = await getDatabase();
  const passwordHash = await hashPassword(input.password);
  const [result] = await db.executeSql(
    'INSERT INTO users (username, password_hash, name, role, active) VALUES (?, ?, ?, ?, 1);',
    [input.username, passwordHash, input.name, input.role],
  );
  const id = result.insertId;
  const db2 = await getDatabase();
  const [row] = await db2.executeSql('SELECT * FROM users WHERE id = ?;', [id]);
  return mapRow(row.rows.item(0));
}

export async function updateUser(
  id: number,
  input: {name: string; role: Role; active: boolean},
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    'UPDATE users SET name = ?, role = ?, active = ? WHERE id = ?;',
    [input.name, input.role, input.active ? 1 : 0, id],
  );
}

export async function updateUserPassword(
  id: number,
  newPassword: string,
): Promise<void> {
  const db = await getDatabase();
  const passwordHash = await hashPassword(newPassword);
  await db.executeSql('UPDATE users SET password_hash = ? WHERE id = ?;', [
    passwordHash,
    id,
  ]);
}

export async function deleteUser(id: number): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM users WHERE id = ?;', [id]);
}
