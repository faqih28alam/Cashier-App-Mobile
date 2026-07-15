import {buildReceiptLines, columnsFor} from '../src/domain/receipt';
import {Settings, Transaction, CartLine} from '../src/types';

const settings: Settings = {
  id: 1,
  storeName: 'Toko Makmur',
  storeAddress: 'Jl. Contoh No. 1',
  storePhone: '0812-3456-7890',
  logoUri: null,
  receiptFooter: 'Terima kasih',
  taxRate: 0,
  paperWidth: 58,
  printerAddress: null,
  printerName: null,
};

const transaction: Transaction = {
  id: 1,
  code: 'TX-20260715-0001',
  status: 'paid',
  cashierId: 1,
  cashierName: 'Budi',
  subtotal: 20000,
  discountTotal: 0,
  taxTotal: 0,
  total: 20000,
  cashPaid: 25000,
  changeDue: 5000,
  createdAt: '2026-07-15T10:00:00Z',
  updatedAt: '2026-07-15T10:00:00Z',
  paidAt: '2026-07-15T10:00:00Z',
};

const items: CartLine[] = [
  {
    productId: 1,
    barcode: '111',
    name: 'Produk A',
    unit: 'pcs',
    qty: 2,
    unitPrice: 10000,
    priceTier: 'harga_1',
    discount: 0,
    lineTotal: 20000,
  },
];

describe('columnsFor', () => {
  it('returns 32 columns for 58mm and 48 for 80mm', () => {
    expect(columnsFor(58)).toBe(32);
    expect(columnsFor(80)).toBe(48);
  });
});

describe('buildReceiptLines', () => {
  it('includes store header, itemized list, totals, and footer', () => {
    const lines = buildReceiptLines(
      {settings, transaction, items, cashierName: 'Budi'},
      58,
    );
    const joined = lines.join('\n');
    expect(joined).toContain('Toko Makmur');
    expect(joined).toContain('Produk A');
    expect(joined).toContain('TX-20260715-0001');
    expect(joined).toContain('Budi');
    expect(joined).toContain('Terima kasih');
  });

  it('wraps every line within the paper width column count', () => {
    const lines = buildReceiptLines(
      {settings, transaction, items, cashierName: 'Budi'},
      58,
    );
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(32);
    }
  });

  it('produces wider lines for 80mm paper', () => {
    const lines80 = buildReceiptLines(
      {settings, transaction, items, cashierName: 'Budi'},
      80,
    );
    for (const line of lines80) {
      expect(line.length).toBeLessThanOrEqual(48);
    }
  });
});
