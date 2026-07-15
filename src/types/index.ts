/**
 * Shared domain types for the Cashier App Mobile.
 * These mirror the local SQLite schema (see src/db/schema.ts).
 */

export type Role = 'kasir' | 'admin' | 'owner';

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
}

export interface Product {
  id: number;
  barcode: string;
  name: string;
  categoryId: number | null;
  categoryName?: string | null;
  unit: string;
  hpp: number;
  harga1: number;
  harga2: number | null;
  harga2MinQty: number | null;
  harga3: number | null;
  harga3MinQty: number | null;
  stock: number;
  minStock: number;
  active: boolean;
}

export type TransactionStatus = 'open' | 'paid' | 'void';

export interface TransactionItem {
  id: number;
  transactionId: number;
  productId: number;
  barcode: string;
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  priceTier: 'harga_1' | 'harga_2' | 'harga_3';
  discount: number;
  lineTotal: number;
}

export interface Transaction {
  id: number;
  code: string;
  status: TransactionStatus;
  cashierId: number;
  cashierName?: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  cashPaid: number | null;
  changeDue: number | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

export type PurchaseStatus = 'draft' | 'confirmed';

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number | null;
  barcode: string;
  name: string;
  qty: number;
  unitCost: number;
  harga1: number | null;
  lineTotal: number;
}

export interface Purchase {
  id: number;
  code: string;
  supplierId: number | null;
  supplierName?: string | null;
  status: PurchaseStatus;
  total: number;
  createdAt: string;
  confirmedAt: string | null;
}

export type FinanceEntryType = 'debit' | 'kredit';
export type FinanceSource = 'kasir' | 'purchas' | 'manual';

export interface FinanceEntry {
  id: number;
  type: FinanceEntryType;
  source: FinanceSource;
  refId: number | null;
  amount: number;
  description: string;
  createdAt: string;
}

export type PaperWidth = 58 | 80;

export interface Settings {
  id: 1;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  logoUri: string | null;
  receiptFooter: string;
  /**
   * Stored and edited as a percentage (e.g. `10` means 10% tax), not a raw
   * fraction/multiplier. Convert with `computeTaxTotal` (src/domain/pricing)
   * wherever tax needs to be applied to a subtotal.
   */
  taxRate: number;
  paperWidth: PaperWidth;
  printerAddress: string | null;
  printerName: string | null;
}

export interface CartLine {
  productId: number;
  barcode: string;
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  priceTier: 'harga_1' | 'harga_2' | 'harga_3';
  discount: number;
  lineTotal: number;
}
