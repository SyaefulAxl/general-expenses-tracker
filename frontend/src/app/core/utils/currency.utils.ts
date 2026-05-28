/** Currency conversion utilities — rates as of 2026 */

// Approximate fixed rates (in a real app, fetch from API)
export const THB_TO_USD = 0.0293;  // 1 THB ≈ 0.0293 USD
export const THB_TO_IDR = 455;     // 1 THB ≈ 455 IDR

export function toUSD(thb: number): number {
  return thb * THB_TO_USD;
}

export function toIDR(thb: number): number {
  return thb * THB_TO_IDR;
}

export function fmtThb(v: number | undefined | null): string {
  const n = v ?? 0;
  return '฿' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtUsd(v: number | undefined | null): string {
  const n = toUSD(v ?? 0);
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtIdr(v: number | undefined | null): string {
  const n = toIDR(v ?? 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/** Show all three currencies as a formatted multi-line block */
export function fmtAllCurrencies(thb: number | undefined | null): { thb: string; usd: string; idr: string } {
  return {
    thb: fmtThb(thb),
    usd: fmtUsd(thb),
    idr: fmtIdr(thb),
  };
}

export function fmtDate(d: string | undefined | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(d: string | undefined | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
