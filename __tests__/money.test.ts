import {formatCurrency} from '../src/domain/money';

describe('formatCurrency', () => {
  it('formats thousands with dot separators, Indonesian style', () => {
    expect(formatCurrency(12500)).toBe('Rp 12.500');
    expect(formatCurrency(1000000)).toBe('Rp 1.000.000');
    expect(formatCurrency(0)).toBe('Rp 0');
    expect(formatCurrency(500)).toBe('Rp 500');
  });

  it('rounds to the nearest whole rupiah', () => {
    expect(formatCurrency(12500.6)).toBe('Rp 12.501');
  });

  it('handles negative values', () => {
    expect(formatCurrency(-2000)).toBe('Rp -2.000');
  });
});
