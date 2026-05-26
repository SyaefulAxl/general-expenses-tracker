import { Injectable, signal, computed } from '@angular/core';
import { Expense, Loan, User, ExpenseStatus, LoanStatus } from '@core/models';

// ── Seed data matching prototype ──────────────────────────────────
const SEED_USERS: User[] = [
  { id: 1, name: 'Syaeful', username: 'syaeful', email: 'syaeful@texcoms.my.id', role: 'ADMIN', isActive: true, isSystem: false },
  { id: 2, name: 'Winda', username: 'winda', email: 'winda@texcoms.my.id', role: 'MEMBER', isActive: true, isSystem: false },
  { id: 3, name: 'Dina', username: 'dina', email: 'dina@texcoms.my.id', role: 'MEMBER', isActive: true, isSystem: false },
];

const SEED_EXPENSES: Expense[] = [
  { id: 1000, expenseDate: '2026-05-07', amount: 350, description: 'Grab from Airport to Condo', toko: 'Grab', source: 'Winda Cash', category: 'Transport', recorderId: 1, shared: false, status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1001, expenseDate: '2026-05-07', amount: 100, description: 'Grab ride', toko: 'Grab', source: 'Winda Cash', category: 'Transport', recorderId: 2, shared: true, status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1002, expenseDate: '2026-05-07', amount: 100, description: 'Grab ride', toko: 'Grab', source: 'Winda Cash', category: 'Transport', recorderId: 3, shared: true, status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1003, expenseDate: '2026-05-07', amount: 100, description: 'Grab ride', toko: 'Grab', source: 'Winda Cash', category: 'Transport', recorderId: 1, shared: true, status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1004, expenseDate: '2026-05-07', amount: 66.67, description: 'Grab ride', toko: 'Grab', source: 'Winda Cash', category: 'Transport', recorderId: 2, shared: true, status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1005, expenseDate: '2026-05-07', amount: 66.67, description: 'Grab ride', toko: 'Grab', source: 'Winda Cash', category: 'Transport', recorderId: 3, shared: true, status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1006, expenseDate: '2026-05-07', amount: 66.67, description: 'Grab ride', toko: 'Grab', source: 'Winda Cash', category: 'Transport', recorderId: 1, shared: true, status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1007, expenseDate: '2026-05-07', amount: 7.33, description: 'Water', toko: 'Grab', source: 'Winda Cash', category: 'Transport', recorderId: 2, shared: true, status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1008, expenseDate: '2026-05-07', amount: 7.33, description: 'Water', toko: 'Grab', source: 'Winda Cash', category: 'Transport', recorderId: 3, shared: true, status: 'PENDING', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1009, expenseDate: '2026-05-07', amount: 7.33, description: 'Water', toko: 'Grab', source: 'Winda Cash', category: 'Transport', recorderId: 1, shared: true, status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1010, expenseDate: '2026-05-07', amount: 17, description: 'Grab ride', toko: 'Grab', source: 'Winda Cash', category: 'Transport', recorderId: 1, shared: false, status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1011, expenseDate: '2026-05-08', amount: 60, description: 'Bawang dll', toko: 'Grab', source: 'Winda Cash', category: 'Transport', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1012, expenseDate: '2026-05-08', amount: 32, description: 'Lays', toko: 'Seven 11', source: 'Winda Cash', category: 'Food', recorderId: 1, shared: false, status: 'APPROVED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1013, expenseDate: '2026-05-08', amount: 10, description: '7-Eleven snacks', toko: 'Seven 11', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: true, status: 'REJECTED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1014, expenseDate: '2026-05-08', amount: 10, description: '7-Eleven snacks', toko: 'Seven 11', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: true, status: 'APPROVED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1015, expenseDate: '2026-05-08', amount: 10, description: '7-Eleven snacks', toko: 'Seven 11', source: 'Winda Cash', category: 'Food', recorderId: 1, shared: true, status: 'APPROVED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1016, expenseDate: '2026-05-08', amount: 16.33, description: 'spicy seaweed snack', toko: 'Seven 11', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: true, status: 'APPROVED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1017, expenseDate: '2026-05-08', amount: 16.33, description: 'spicy seaweed snack', toko: 'Seven 11', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: true, status: 'APPROVED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1018, expenseDate: '2026-05-08', amount: 16.33, description: 'spicy seaweed snack', toko: 'Seven 11', source: 'Winda Cash', category: 'Food', recorderId: 1, shared: true, status: 'REJECTED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1019, expenseDate: '2026-05-09', amount: 16.33, description: '7-Eleven snacks', toko: 'Seven 11', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: true, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1020, expenseDate: '2026-05-09', amount: 16.33, description: '7-Eleven snacks', toko: 'Seven 11', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: true, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1021, expenseDate: '2026-05-09', amount: 16.33, description: '7-Eleven snacks', toko: 'Seven 11', source: 'Winda Cash', category: 'Food', recorderId: 1, shared: true, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1022, expenseDate: '2026-05-09', amount: 63.25, description: 'Chicken Upper Wings (per kg)', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1023, expenseDate: '2026-05-09', amount: 35, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1024, expenseDate: '2026-05-09', amount: 34.50, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1025, expenseDate: '2026-05-09', amount: 57, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1026, expenseDate: '2026-05-09', amount: 115, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'PENDING', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1027, expenseDate: '2026-05-09', amount: 199, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1028, expenseDate: '2026-05-09', amount: 60, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1029, expenseDate: '2026-05-09', amount: 199, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 1, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1030, expenseDate: '2026-05-09', amount: 49, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1031, expenseDate: '2026-05-09', amount: 40, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'PENDING', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1032, expenseDate: '2026-05-09', amount: 38, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1033, expenseDate: '2026-05-09', amount: 69, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1034, expenseDate: '2026-05-09', amount: 51, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1035, expenseDate: '2026-05-09', amount: 29, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 1, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1036, expenseDate: '2026-05-09', amount: 34, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 1, shared: false, status: 'REJECTED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1037, expenseDate: '2026-05-09', amount: 29, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1038, expenseDate: '2026-05-09', amount: 43, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1039, expenseDate: '2026-05-09', amount: 105, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1040, expenseDate: '2026-05-09', amount: 25.50, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1041, expenseDate: '2026-05-09', amount: 118, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1042, expenseDate: '2026-05-09', amount: 36, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1043, expenseDate: '2026-05-09', amount: 11.50, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1044, expenseDate: '2026-05-09', amount: 80, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 1, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1045, expenseDate: '2026-05-09', amount: 9.50, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1046, expenseDate: '2026-05-09', amount: 24.50, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1047, expenseDate: '2026-05-09', amount: 24.50, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1048, expenseDate: '2026-05-09', amount: 48.50, description: 'Makro groceries', toko: 'Makro', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1049, expenseDate: '2026-05-10', amount: 22, description: 'Vixol Sunny Fresh (700ml)', toko: 'Lotus', source: 'Winda Cash', category: 'Food', recorderId: 3, shared: false, status: 'PENDING', createdAt: '2026-05-10T18:00:00Z' },
  { id: 1050, expenseDate: '2026-05-10', amount: 40, description: 'Lotus groceries', toko: 'Lotus', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-10T18:00:00Z' },
  { id: 1051, expenseDate: '2026-05-10', amount: 48, description: 'Lotus groceries', toko: 'Lotus', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-10T18:00:00Z' },
  { id: 1052, expenseDate: '2026-05-10', amount: 40, description: 'Lotus groceries', toko: 'Lotus', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-10T18:00:00Z' },
  { id: 1053, expenseDate: '2026-05-10', amount: 29, description: 'Lotus groceries', toko: 'Lotus', source: 'Winda Cash', category: 'Food', recorderId: 1, shared: false, status: 'APPROVED', createdAt: '2026-05-10T18:00:00Z' },
  { id: 1054, expenseDate: '2026-05-10', amount: 44, description: 'Lotus groceries', toko: 'Lotus', source: 'Winda Cash', category: 'Food', recorderId: 1, shared: false, status: 'REJECTED', createdAt: '2026-05-10T18:00:00Z' },
  { id: 1055, expenseDate: '2026-05-10', amount: 9, description: 'Lotus groceries', toko: 'Lotus', source: 'Winda Cash', category: 'Food', recorderId: 2, shared: false, status: 'PENDING', createdAt: '2026-05-10T18:00:00Z' },
];

const SEED_LOANS: Loan[] = [
  { id: 5001, expenseId: 1001, lenderId: 2, borrowerId: 3, amount: 100, declaredRepayment: 100, actualRepaid: 50, remainingBalance: 50, status: 'PARTIAL', createdAt: '2026-05-07T18:00:00Z' },
  { id: 5002, expenseId: 1003, lenderId: 2, borrowerId: 1, amount: 100, declaredRepayment: 100, actualRepaid: 0, remainingBalance: 100, status: 'UNSETTLED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 5003, expenseId: 1004, lenderId: 2, borrowerId: 3, amount: 66.67, declaredRepayment: 66.67, actualRepaid: 66.67, remainingBalance: 0, status: 'FULLY_SETTLED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 5004, expenseId: 1006, lenderId: 2, borrowerId: 1, amount: 66.67, declaredRepayment: 66.67, actualRepaid: 0, remainingBalance: 66.67, status: 'UNSETTLED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 5005, expenseId: 1007, lenderId: 2, borrowerId: 3, amount: 7.33, declaredRepayment: 7.33, actualRepaid: 0, remainingBalance: 7.33, status: 'UNSETTLED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 5006, expenseId: 1009, lenderId: 2, borrowerId: 1, amount: 7.33, declaredRepayment: 7.33, actualRepaid: 0, remainingBalance: 7.33, status: 'UNSETTLED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 5007, expenseId: 1010, lenderId: 2, borrowerId: 1, amount: 17, declaredRepayment: 17, actualRepaid: 0, remainingBalance: 17, status: 'UNSETTLED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 5008, expenseId: 1011, lenderId: 2, borrowerId: 3, amount: 60, declaredRepayment: 60, actualRepaid: 0, remainingBalance: 60, status: 'UNSETTLED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 5009, expenseId: 1012, lenderId: 2, borrowerId: 1, amount: 32, declaredRepayment: 32, actualRepaid: 0, remainingBalance: 32, status: 'UNSETTLED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 5010, expenseId: 1015, lenderId: 2, borrowerId: 1, amount: 10, declaredRepayment: 10, actualRepaid: 0, remainingBalance: 10, status: 'UNSETTLED', createdAt: '2026-05-08T18:00:00Z' },
];

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private _expenses = signal<Expense[]>([...SEED_EXPENSES]);
  private _loans = signal<Loan[]>([...SEED_LOANS]);
  private _users = signal<User[]>([...SEED_USERS]);

  readonly expenses = this._expenses.asReadonly();
  readonly loans = this._loans.asReadonly();
  readonly users = this._users.asReadonly();

  readonly totalTeamSpend = computed(() =>
    this._expenses().filter(e => e.status !== 'REJECTED').reduce((sum, e) => sum + e.amount, 0)
  );

  readonly myExpenses = (userId: number) => computed(() =>
    this._expenses().filter(e => e.recorderId === userId && e.status !== 'REJECTED')
  );

  readonly pendingCount = computed(() =>
    this._expenses().filter(e => e.status === 'PENDING').length
  );

  readonly owedToMe = (userId: number) => computed(() =>
    this._loans().filter(l => l.lenderId === userId && l.status !== 'FULLY_SETTLED')
      .reduce((sum, l) => sum + (l.remainingBalance ?? (l.amount ?? 0) - (l.actualRepaid ?? 0)), 0)
  );

  readonly iOwe = (userId: number) => computed(() =>
    this._loans().filter(l => l.borrowerId === userId && l.status !== 'FULLY_SETTLED')
      .reduce((sum, l) => sum + (l.remainingBalance ?? (l.amount ?? 0) - (l.actualRepaid ?? 0)), 0)
  );

  getUserById(id: number): User | undefined {
    return this._users().find(u => u.id === id);
  }

  addExpense(expense: Omit<Expense, 'id'>): Expense {
    const id = Math.max(...this._expenses().map(e => e.id ?? 0), 1000) + 1;
    const newExpense = { ...expense, id } as Expense;
    this._expenses.update(list => [...list, newExpense]);
    return newExpense;
  }

  updateExpenseStatus(id: number, status: ExpenseStatus): void {
    this._expenses.update(list =>
      list.map(e => e.id === id ? { ...e, status } : e)
    );
  }

  deleteExpense(id: number): void {
    this._expenses.update(list => list.filter(e => e.id !== id));
    this._loans.update(list => list.filter(l => l.expenseId !== id));
  }

  recordRepayment(loanId: number, amount: number, note?: string): void {
    this._loans.update(list =>
      list.map(l => {
        if (l.id !== loanId) return l;
        const newRepaid = (l.actualRepaid ?? 0) + amount;
        const declared = l.declaredRepayment ?? l.amount ?? 0;
        const newRem = Math.max(0, declared - newRepaid);
        const status: LoanStatus = newRepaid >= declared ? 'FULLY_SETTLED' : newRepaid > 0 ? 'PARTIAL' : 'UNSETTLED';
        return { ...l, actualRepaid: newRepaid, remainingBalance: newRem, status };
      })
    );
  }

  updateUserRole(userId: number, newRole: 'ADMIN' | 'MEMBER'): void {
    this._users.update(list => list.map(u => u.id === userId ? { ...u, role: newRole } : u));
  }

  updateUserActive(userId: number, isActive: boolean): void {
    this._users.update(list => list.map(u => u.id === userId ? { ...u, isActive } : u));
  }
}
