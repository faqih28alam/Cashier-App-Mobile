import {CartLine, Settings, Transaction} from '../types';
import {formatCurrency} from './money';

/** Character columns per line for common ESC/POS thermal paper widths (Font A, 12x24). */
const COLUMNS: Record<58 | 80, number> = {
  58: 32,
  80: 48,
};

export function columnsFor(paperWidth: 58 | 80): number {
  return COLUMNS[paperWidth];
}

function padCenter(text: string, width: number): string {
  if (text.length >= width) {
    return text.slice(0, width);
  }
  const totalPad = width - text.length;
  const left = Math.floor(totalPad / 2);
  const right = totalPad - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

function twoCol(left: string, right: string, width: number): string {
  const space = width - left.length - right.length;
  if (space < 1) {
    // Truncate left to make room.
    const truncated = left.slice(0, Math.max(0, width - right.length - 1));
    return `${truncated} ${right}`;
  }
  return `${left}${' '.repeat(space)}${right}`;
}

function divider(width: number, char = '-'): string {
  return char.repeat(width);
}

export interface ReceiptContext {
  settings: Settings;
  transaction: Transaction;
  items: CartLine[];
  cashierName: string;
}

/**
 * Builds the plain-text receipt content (line by line), matching the
 * original desktop app's layout: store header, date/time, cashier,
 * itemized list, subtotal, cash paid, change, footer.
 * This same text is used both for the on-screen preview and, line by line,
 * for ESC/POS printing.
 */
export function buildReceiptLines(
  ctx: ReceiptContext,
  paperWidth: 58 | 80,
): string[] {
  const width = columnsFor(paperWidth);
  const {settings, transaction, items, cashierName} = ctx;
  const lines: string[] = [];

  lines.push(padCenter(settings.storeName || '-', width));
  if (settings.storeAddress) {
    lines.push(padCenter(settings.storeAddress, width));
  }
  if (settings.storePhone) {
    lines.push(padCenter(settings.storePhone, width));
  }
  lines.push(divider(width));

  const dateStr = new Date(
    transaction.paidAt ?? transaction.createdAt,
  ).toLocaleString('id-ID');
  lines.push(twoCol('No', transaction.code, width));
  lines.push(twoCol('Tgl', dateStr, width));
  lines.push(twoCol('Kasir', cashierName, width));
  lines.push(divider(width));

  for (const item of items) {
    lines.push(item.name.slice(0, width));
    const qtyPrice = `${item.qty} x ${formatCurrency(item.unitPrice)}`;
    lines.push(twoCol(qtyPrice, formatCurrency(item.lineTotal), width));
    if (item.discount > 0) {
      lines.push(
        twoCol('  Diskon', `-${formatCurrency(item.discount)}`, width),
      );
    }
  }
  lines.push(divider(width));

  lines.push(twoCol('Subtotal', formatCurrency(transaction.subtotal), width));
  if (transaction.discountTotal > 0) {
    lines.push(
      twoCol('Diskon', `-${formatCurrency(transaction.discountTotal)}`, width),
    );
  }
  if (transaction.taxTotal > 0) {
    lines.push(twoCol('Pajak', formatCurrency(transaction.taxTotal), width));
  }
  lines.push(twoCol('TOTAL', formatCurrency(transaction.total), width));
  lines.push(divider(width));
  lines.push(twoCol('Bayar', formatCurrency(transaction.cashPaid ?? 0), width));
  lines.push(
    twoCol('Kembalian', formatCurrency(transaction.changeDue ?? 0), width),
  );
  lines.push(divider(width));

  if (settings.receiptFooter) {
    for (const footerLine of settings.receiptFooter.split('\n')) {
      lines.push(padCenter(footerLine, width));
    }
  }

  return lines;
}
