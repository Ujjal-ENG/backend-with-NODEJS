import { describe, expect, it } from 'vitest';
import { calcDiscountPercent, parsePrice } from '../../src/lib/money.js';

describe('money helpers', () => {
  it('parses BDT strings and object prices', () => {
    expect(parsePrice('৳12,345')).toBe(12345);
    expect(parsePrice({ Lo: 99, Mid: 0, Hi: 0, SignScale: 0 })).toBe(99);
  });

  it('calculates discount percent correctly', () => {
    expect(calcDiscountPercent(80, 100)).toBe(20);
    expect(calcDiscountPercent(100, 100)).toBe(null);
  });
});
