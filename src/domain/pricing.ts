import {Product} from '../types';

export type PriceTier = 'harga_1' | 'harga_2' | 'harga_3';

export interface ResolvedPrice {
  unitPrice: number;
  tier: PriceTier;
}

/**
 * Resolves the applicable unit price for a product given a quantity, using
 * the original desktop app's tiered-pricing rule: pick the highest price
 * tier whose minimum quantity threshold is met, falling back to harga_1.
 *
 * - harga_1 always applies as the base/default price.
 * - harga_2 applies once qty >= harga2MinQty (if harga2 and harga2MinQty set).
 * - harga_3 applies once qty >= harga3MinQty (if harga3 and harga3MinQty set),
 *   and takes precedence over harga_2 when both thresholds are met.
 */
export function resolvePrice(product: Product, qty: number): ResolvedPrice {
  if (
    product.harga3 != null &&
    product.harga3MinQty != null &&
    qty >= product.harga3MinQty
  ) {
    return {unitPrice: product.harga3, tier: 'harga_3'};
  }
  if (
    product.harga2 != null &&
    product.harga2MinQty != null &&
    qty >= product.harga2MinQty
  ) {
    return {unitPrice: product.harga2, tier: 'harga_2'};
  }
  return {unitPrice: product.harga1, tier: 'harga_1'};
}

/** Line total for a cart row: (unitPrice * qty) - discount, floored at 0. */
export function computeLineTotal(
  unitPrice: number,
  qty: number,
  discount: number,
): number {
  const raw = unitPrice * qty - discount;
  return raw < 0 ? 0 : round2(raw);
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Computes the tax amount for a subtotal, given a tax rate stored/edited as
 * a percentage (e.g. `10` means 10%, not a raw 10x multiplier). This is the
 * single point where the percentage-to-fraction conversion happens; call
 * sites must not divide by 100 again themselves.
 */
export function computeTaxTotal(subtotal: number, taxRate: number): number {
  return round2(subtotal * ((taxRate || 0) / 100));
}
