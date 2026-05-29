import * as XLSX from 'xlsx';
import { Expense, ExpenseStatus, ExpenseType } from '@core/models';
import { toIDR } from './currency.utils';

const TYPE_LABEL: Record<ExpenseType, string> = { PERSONAL: 'Pribadi', OFFICIAL: 'Resmi' };
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draf', PENDING: 'Menunggu', APPROVED: 'Disetujui', REJECTED: 'Ditolak',
};

/** Build a worksheet row from an expense (human-friendly, Bahasa Indonesia headers). */
function toRow(e: Expense): Record<string, string | number> {
  return {
    'Tanggal':        e.expenseDate ?? '',
    'Deskripsi':      e.description ?? '',
    'Toko':           e.toko ?? '',
    'Kategori':       e.category ?? '',
    'Tipe':           TYPE_LABEL[e.type ?? 'PERSONAL'],
    'Jumlah (THB)':   Number(e.amount ?? 0),
    'Jumlah (IDR)':   Math.round(toIDR(e.amount ?? 0)),
    'Sumber Dana':    e.source ?? '',
    'Status':         STATUS_LABEL[e.status] ?? e.status,
  };
}

/**
 * Export the given expenses to a .xlsx file (downloads immediately).
 * Intended for the "official" expenses → reimburse-to-office flow, but works for any list.
 */
export function exportExpensesToExcel(expenses: Expense[], filename = 'pengeluaran'): void {
  const rows = expenses.map(toRow);
  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths for readability.
  ws['!cols'] = [
    { wch: 12 }, { wch: 34 }, { wch: 14 }, { wch: 14 },
    { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pengeluaran');
  const stamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${filename}-${stamp}.xlsx`);
}

const TYPE_FROM_LABEL: Record<string, ExpenseType> = {
  'pribadi': 'PERSONAL', 'personal': 'PERSONAL',
  'resmi': 'OFFICIAL', 'official': 'OFFICIAL',
};
const STATUS_FROM_LABEL: Record<string, ExpenseStatus> = {
  'draf': 'DRAFT', 'draft': 'DRAFT',
  'menunggu': 'PENDING', 'pending': 'PENDING',
  'disetujui': 'APPROVED', 'approved': 'APPROVED',
  'ditolak': 'REJECTED', 'rejected': 'REJECTED',
};

function pick(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
    if (found != null && row[found] != null && `${row[found]}`.trim() !== '') return `${row[found]}`.trim();
  }
  return '';
}

/**
 * Parse a .xlsx / .xls file into expense drafts. Lenient about column headers
 * (accepts Indonesian or English). Returns objects ready to feed addExpense.
 */
export function parseExpensesFromExcel(file: File): Promise<Array<Omit<Expense, 'id' | 'createdAt'>>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        const result: Array<Omit<Expense, 'id' | 'createdAt'>> = [];
        for (const row of json) {
          const description = pick(row, 'Deskripsi', 'Description', 'Keterangan');
          const amountRaw   = pick(row, 'Jumlah (THB)', 'Jumlah', 'Amount', 'THB');
          const amount      = parseFloat(amountRaw.replace(/[^0-9.\-]/g, ''));
          if (!description && !amount) continue; // skip blank rows

          const dateRaw = pick(row, 'Tanggal', 'Date');
          const expenseDate = normalizeDate(dateRaw);
          const typeLabel = pick(row, 'Tipe', 'Type').toLowerCase();
          const statusLabel = pick(row, 'Status').toLowerCase();

          result.push({
            description: description || '(tanpa deskripsi)',
            amount: isNaN(amount) ? 0 : amount,
            category: pick(row, 'Kategori', 'Category') || 'Lainnya',
            type: TYPE_FROM_LABEL[typeLabel] ?? 'OFFICIAL',
            expenseDate,
            status: STATUS_FROM_LABEL[statusLabel] ?? 'DRAFT',
            toko: pick(row, 'Toko', 'Store', 'Merchant'),
            source: pick(row, 'Sumber Dana', 'Source', 'Payment') || 'Cash',
            shared: false,
          });
        }
        resolve(result);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Format file tidak valid.'));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

/** Best-effort date normalisation to YYYY-MM-DD. */
function normalizeDate(raw: string): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  // Excel serial date number
  const asNum = Number(raw);
  if (!isNaN(asNum) && asNum > 20000 && asNum < 80000) {
    const d = XLSX.SSF ? new Date(Math.round((asNum - 25569) * 86400 * 1000)) : new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
}
