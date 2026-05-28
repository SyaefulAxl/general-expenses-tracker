import { Expense, Loan } from '@core/models';

export type TimelineItem =
  | { type: 'expense';   data: Expense }
  | { type: 'repayment'; data: Loan };

export interface DateGroup {
  dateKey: string;
  dateLabel: string;
  items: TimelineItem[];
  totalAmount: number;
  count: number;
}

export function asExpense(data: Expense | Loan): Expense { return data as Expense; }
export function asLoan(data: Expense | Loan): Loan       { return data as Loan; }

export function fmtTime(d: string): string {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function dayKey(d: string): string {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
}

export function fmtDayLabel(d: string): string {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}
