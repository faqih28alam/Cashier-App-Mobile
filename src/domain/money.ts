/** Formats a number as Indonesian Rupiah, e.g. 12500 -> "Rp 12.500". */
export function formatCurrency(value: number): string {
  const rounded = Math.round(value);
  const parts = Math.abs(rounded).toString().split('');
  let grouped = '';
  let count = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    grouped = parts[i] + grouped;
    count++;
    if (count % 3 === 0 && i !== 0) {
      grouped = '.' + grouped;
    }
  }
  return `Rp ${rounded < 0 ? '-' : ''}${grouped}`;
}

/** Standard cash denominations available in Indonesian Rupiah for quick-pay buttons. */
export const CASH_DENOMINATIONS = [
  1000, 2000, 5000, 10000, 20000, 50000, 100000,
];
