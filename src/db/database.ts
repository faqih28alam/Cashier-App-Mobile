import SQLite, {SQLiteDatabase} from 'react-native-sqlite-storage';
import {SCHEMA_STATEMENTS} from './schema';

SQLite.enablePromise(true);

let dbInstance: SQLiteDatabase | null = null;
let openPromise: Promise<SQLiteDatabase> | null = null;

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
