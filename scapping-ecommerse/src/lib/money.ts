export const CURRENCY_BDT = 'BDT';

export function normalizePriceObject(value) {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.Lo === 'number') return value.Lo;
  return null;
}

export function parsePrice(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const fromObject = normalizePriceObject(value);
  if (fromObject !== null) return fromObject;

  const text = String(value).replace(/,/g, '').replace(/[^0-9.]/g, '');
  if (!text) return null;
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calcDiscountPercent(current, original) {
  if (!Number.isFinite(current) || !Number.isFinite(original)) return null;
  if (current <= 0 || original <= 0 || original <= current) return null;
  return Math.round(((original - current) / original) * 100);
}

export function formatBdt(value) {
  if (!Number.isFinite(value)) return 'N/A';
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0
  }).format(value);
}
