import {getDatabase} from '../database';
import {Settings} from '../../types';

function mapRow(row: any): Settings {
  return {
    id: 1,
    storeName: row.store_name,
    storeAddress: row.store_address,
    storePhone: row.store_phone,
    logoUri: row.logo_uri,
    receiptFooter: row.receipt_footer,
    taxRate: row.tax_rate,
    paperWidth: row.paper_width === 80 ? 80 : 58,
    printerAddress: row.printer_address,
    printerName: row.printer_name,
  };
}

export async function getSettings(): Promise<Settings> {
  const db = await getDatabase();
  const [result] = await db.executeSql('SELECT * FROM settings WHERE id = 1;');
  return mapRow(result.rows.item(0));
}

export async function updateSettings(
  input: Omit<Settings, 'id'>,
): Promise<Settings> {
  const db = await getDatabase();
  await db.executeSql(
    `UPDATE settings SET
      store_name = ?, store_address = ?, store_phone = ?, logo_uri = ?,
      receipt_footer = ?, tax_rate = ?, paper_width = ?, printer_address = ?, printer_name = ?
     WHERE id = 1;`,
    [
      input.storeName,
      input.storeAddress,
      input.storePhone,
      input.logoUri,
      input.receiptFooter,
      input.taxRate,
      input.paperWidth,
      input.printerAddress,
      input.printerName,
    ],
  );
  return getSettings();
}

export async function setPrinterSelection(
  address: string,
  name: string,
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    'UPDATE settings SET printer_address = ?, printer_name = ? WHERE id = 1;',
    [address, name],
  );
}
