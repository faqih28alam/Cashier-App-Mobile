import {resolvePrice, computeLineTotal, round2} from '../src/domain/pricing';
import {Product} from '../src/types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    barcode: '123456',
    name: 'Test Product',
    categoryId: null,
    unit: 'pcs',
    hpp: 1000,
    harga1: 2000,
    harga2: 1800,
    harga2MinQty: 5,
    harga3: 1500,
    harga3MinQty: 10,
    stock: 100,
    minStock: 5,
    active: true,
    ...overrides,
  };
}

describe('resolvePrice (tiered pricing)', () => {
  it('uses harga_1 for quantities below the harga_2 threshold', () => {
    const product = makeProduct();
    expect(resolvePrice(product, 1)).toEqual({
      unitPrice: 2000,
      tier: 'harga_1',
    });
    expect(resolvePrice(product, 4)).toEqual({
      unitPrice: 2000,
      tier: 'harga_1',
    });
  });

  it('uses harga_2 once qty meets its min threshold', () => {
    const product = makeProduct();
    expect(resolvePrice(product, 5)).toEqual({
      unitPrice: 1800,
      tier: 'harga_2',
    });
    expect(resolvePrice(product, 9)).toEqual({
      unitPrice: 1800,
      tier: 'harga_2',
    });
  });

  it('uses harga_3 once qty meets its min threshold, taking precedence over harga_2', () => {
    const product = makeProduct();
    expect(resolvePrice(product, 10)).toEqual({
      unitPrice: 1500,
      tier: 'harga_3',
    });
    expect(resolvePrice(product, 50)).toEqual({
      unitPrice: 1500,
      tier: 'harga_3',
    });
  });

  it('recalculates automatically when qty crosses a threshold (spec edge case: 4 -> 6 units)', () => {
    const product = makeProduct();
    expect(resolvePrice(product, 4).tier).toBe('harga_1');
    expect(resolvePrice(product, 6).tier).toBe('harga_2');
  });

  it('falls back to harga_1 when harga_2/harga_3 are not configured', () => {
    const product = makeProduct({
      harga2: null,
      harga2MinQty: null,
      harga3: null,
      harga3MinQty: null,
    });
    expect(resolvePrice(product, 100)).toEqual({
      unitPrice: 2000,
      tier: 'harga_1',
    });
  });
});

describe('computeLineTotal', () => {
  it('multiplies unit price by qty and subtracts discount', () => {
    expect(computeLineTotal(1000, 3, 500)).toBe(2500);
  });

  it('never goes below zero even if discount exceeds the raw total', () => {
    expect(computeLineTotal(1000, 1, 5000)).toBe(0);
  });
});

describe('round2', () => {
  it('rounds to two decimal places', () => {
    expect(round2(10.126)).toBeCloseTo(10.13, 2);
    expect(round2(10.124)).toBeCloseTo(10.12, 2);
  });
});
