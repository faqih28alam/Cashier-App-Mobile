import SQLite, {SQLiteDatabase} from 'react-native-sqlite-storage';
import {SCHEMA_STATEMENTS} from './schema';

SQLite.enablePromise(true);

let dbInstance: SQLiteDatabase | null = null;
let openPromise: Promise<SQLiteDatabase> | null = null;

/**
 * CREATE TABLE IF NOT EXISTS in schema.ts only covers fresh installs — it
 * won't add columns to a table that already exists from an earlier version.
 * New columns need an explicit, idempotency-checked ALTER TABLE here.
 */
async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const [info] = await db.executeSql('PRAGMA table_info(transaction_items);');
  let hasHpp = false;
  for (let i = 0; i < info.rows.length; i++) {
    if (info.rows.item(i).name === 'hpp') {
      hasHpp = true;
      break;
    }
  }
  if (!hasHpp) {
    await db.executeSql(
      'ALTER TABLE transaction_items ADD COLUMN hpp REAL NOT NULL DEFAULT 0;',
    );
  }
}

/** Opens (or returns the cached handle to) the on-device SQLite database. */
export async function getDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  if (!openPromise) {
    openPromise = SQLite.openDatabase({
      name: 'cashier_app_mobile.db',
      location: 'default',
    }).then(async db => {
      await db.executeSql('PRAGMA foreign_keys = ON;');
      for (const statement of SCHEMA_STATEMENTS) {
        await db.executeSql(statement);
      }
      await runMigrations(db);
      dbInstance = db;
      return db;
    });
  }
  return openPromise;
}

/**
 * Closes and clears the cached database handle. Used by restore/replace-file
 * flows; not otherwise needed in normal operation.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    openPromise = null;
  }
}

export type {SQLiteDatabase};
