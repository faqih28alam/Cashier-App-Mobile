import {getDatabase} from '../database';
import {FinanceEntry, FinanceEntryType, FinanceSource} from '../../types';

function mapRow(row: any): FinanceEntry {
  return {
    id: row.id,
    type: row.type,
    source: row.source,
    refId: row.ref_id,
    amount: row.amount,
    description: row.description,
    createdAt: row.created_at,
  };
}

export async function insertFinanceEntry(input: {
  type: FinanceEntryType;
  source: FinanceSource;
  refId: number | null;
  amount: number;
  description: string;
}): Promise<FinanceEntry> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `INSERT INTO finance_entries (type, source, ref_id, amount, description)
     VALUES (?, ?, ?, ?, ?);`,
    [input.type, input.source, input.refId, input.amount, input.description],
  );
  const [row] = await db.executeSql(
    'SELECT * FROM finance_entries WHERE id = ?;',
    [result.insertId],
  );
  return mapRow(row.rows.item(0));
}

export async function listFinanceEntries(opts?: {
  from?: string;
  to?: string;
}): Promise<FinanceEntry[]> {
  const db = await getDatabase();
  const clauses: string[] = [];
  const params: any[] = [];
  if (opts?.from) {
    clauses.push('date(created_at) >= date(?)');
    params.push(opts.from);
  }
  if (opts?.to) {
    clauses.push('date(created_at) <= date(?)');
    params.push(opts.to);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [result] = await db.executeSql(
    `SELECT * FROM finance_entries ${where} ORDER BY created_at ASC, id ASC;`,
    params,
  );
  const items: FinanceEntry[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    items.push(mapRow(result.rows.item(i)));
  }
  return items;
}

/** Running cash balance: sum of debit - sum of kredit, across all entries (not just the filtered range). */
export async function getCashBalance(): Promise<number> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as debit_total,
      COALESCE(SUM(CASE WHEN type = 'kredit' THEN amount ELSE 0 END), 0) as kredit_total
     FROM finance_entries;`,
  );
  const row = result.rows.item(0);
  return row.debit_total - row.kredit_total;
}

export async function addManualEntry(input: {
  type: FinanceEntryType;
  amount: number;
  description: string;
}): Promise<FinanceEntry> {
  return insertFinanceEntry({
    type: input.type,
    source: 'manual',
    refId: null,
    amount: input.amount,
    description: input.description,
  });
}
