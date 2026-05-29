import { Injectable, signal, computed, effect } from '@angular/core';
import { Expense, Loan, User, ExpenseStatus, LoanStatus } from '@core/models';

const STORAGE_KEY = 'gen_expenses_store_v2';

const SEED_USERS: User[] = [
  { id: 1, name: 'Syaeful', username: 'syaeful', email: 'syaeful@texcoms.my.id', role: 'ADMIN',  isActive: true, isSystem: false },
  { id: 2, name: 'Winda',   username: 'winda',   email: 'winda@texcoms.my.id',   role: 'MEMBER', isActive: true, isSystem: false },
  { id: 3, name: 'Dina',    username: 'dina',    email: 'dina@texcoms.my.id',    role: 'MEMBER', isActive: true, isSystem: false },
];

const SEED_EXPENSES: Expense[] = [
  { id: 1000, expenseDate: '2026-05-07', amount: 350,   description: 'Grab from Airport to Condo', toko: 'Grab',     source: 'Winda Cash', category: 'Travelling', recorderId: 1, shared: false, status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1001, expenseDate: '2026-05-07', amount: 100,   description: 'Grab ride',                  toko: 'Grab',     source: 'Winda Cash', category: 'Travelling', recorderId: 2, shared: true,  status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1002, expenseDate: '2026-05-07', amount: 100,   description: 'Grab ride',                  toko: 'Grab',     source: 'Winda Cash', category: 'Travelling', recorderId: 3, shared: true,  status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1003, expenseDate: '2026-05-07', amount: 100,   description: 'Grab ride',                  toko: 'Grab',     source: 'Winda Cash', category: 'Travelling', recorderId: 1, shared: true,  status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1004, expenseDate: '2026-05-07', amount:  66.67,description: 'Grab ride',                  toko: 'Grab',     source: 'Winda Cash', category: 'Travelling', recorderId: 2, shared: true,  status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1005, expenseDate: '2026-05-07', amount:  66.67,description: 'Grab ride',                  toko: 'Grab',     source: 'Winda Cash', category: 'Travelling', recorderId: 3, shared: true,  status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1006, expenseDate: '2026-05-07', amount:  66.67,description: 'Grab ride',                  toko: 'Grab',     source: 'Winda Cash', category: 'Travelling', recorderId: 1, shared: true,  status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1007, expenseDate: '2026-05-07', amount:   7.33,description: 'Water',                      toko: 'Grab',     source: 'Winda Cash', category: 'Travelling', recorderId: 2, shared: true,  status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1008, expenseDate: '2026-05-07', amount:   7.33,description: 'Water',                      toko: 'Grab',     source: 'Winda Cash', category: 'Travelling', recorderId: 3, shared: true,  status: 'PENDING',  createdAt: '2026-05-07T18:00:00Z' },
  { id: 1009, expenseDate: '2026-05-07', amount:   7.33,description: 'Water',                      toko: 'Grab',     source: 'Winda Cash', category: 'Travelling', recorderId: 1, shared: true,  status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1010, expenseDate: '2026-05-07', amount:  17,   description: 'Grab ride',                  toko: 'Grab',     source: 'Winda Cash', category: 'Travelling', recorderId: 1, shared: false, status: 'APPROVED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 1011, expenseDate: '2026-05-08', amount:  60,   description: 'Bawang dll',                 toko: 'Grab',     source: 'Winda Cash', category: 'Travelling', recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1012, expenseDate: '2026-05-08', amount:  32,   description: 'Lays',                       toko: 'Seven 11', source: 'Winda Cash', category: 'Makan',      recorderId: 1, shared: false, status: 'APPROVED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1013, expenseDate: '2026-05-08', amount:  10,   description: '7-Eleven snacks',            toko: 'Seven 11', source: 'Winda Cash', category: 'Makan',      recorderId: 2, shared: true,  status: 'REJECTED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1014, expenseDate: '2026-05-08', amount:  10,   description: '7-Eleven snacks',            toko: 'Seven 11', source: 'Winda Cash', category: 'Makan',      recorderId: 3, shared: true,  status: 'APPROVED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1015, expenseDate: '2026-05-08', amount:  10,   description: '7-Eleven snacks',            toko: 'Seven 11', source: 'Winda Cash', category: 'Makan',      recorderId: 1, shared: true,  status: 'APPROVED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1016, expenseDate: '2026-05-08', amount:  16.33,description: 'spicy seaweed snack',        toko: 'Seven 11', source: 'Winda Cash', category: 'Makan',      recorderId: 2, shared: true,  status: 'APPROVED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1017, expenseDate: '2026-05-08', amount:  16.33,description: 'spicy seaweed snack',        toko: 'Seven 11', source: 'Winda Cash', category: 'Makan',      recorderId: 3, shared: true,  status: 'APPROVED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1018, expenseDate: '2026-05-08', amount:  16.33,description: 'spicy seaweed snack',        toko: 'Seven 11', source: 'Winda Cash', category: 'Makan',      recorderId: 1, shared: true,  status: 'REJECTED', createdAt: '2026-05-08T18:00:00Z' },
  { id: 1019, expenseDate: '2026-05-09', amount:  16.33,description: '7-Eleven snacks',            toko: 'Seven 11', source: 'Winda Cash', category: 'Makan',      recorderId: 2, shared: true,  status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1020, expenseDate: '2026-05-09', amount:  16.33,description: '7-Eleven snacks',            toko: 'Seven 11', source: 'Winda Cash', category: 'Makan',      recorderId: 3, shared: true,  status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1021, expenseDate: '2026-05-09', amount:  16.33,description: '7-Eleven snacks',            toko: 'Seven 11', source: 'Winda Cash', category: 'Makan',      recorderId: 1, shared: true,  status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1022, expenseDate: '2026-05-09', amount:  63.25,description: 'Chicken Upper Wings',        toko: 'Makro',    source: 'Winda Cash', category: 'Makan',      recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1023, expenseDate: '2026-05-09', amount:  35,   description: 'Makro groceries',            toko: 'Makro',    source: 'Winda Cash', category: 'Grosir',      recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1024, expenseDate: '2026-05-09', amount:  34.50,description: 'Makro groceries',            toko: 'Makro',    source: 'Winda Cash', category: 'Grosir',      recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1025, expenseDate: '2026-05-09', amount:  57,   description: 'Makro groceries',            toko: 'Makro',    source: 'Winda Cash', category: 'Grosir',      recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1026, expenseDate: '2026-05-09', amount: 115,   description: 'Makro groceries',            toko: 'Makro',    source: 'Winda Cash', category: 'Grosir',      recorderId: 3, shared: false, status: 'PENDING',  createdAt: '2026-05-09T18:00:00Z' },
  { id: 1027, expenseDate: '2026-05-09', amount: 199,   description: 'Makro groceries',            toko: 'Makro',    source: 'Winda Cash', category: 'Grosir',      recorderId: 3, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1028, expenseDate: '2026-05-09', amount:  60,   description: 'Makro groceries',            toko: 'Makro',    source: 'Winda Cash', category: 'Grosir',      recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1029, expenseDate: '2026-05-09', amount: 199,   description: 'Makro groceries',            toko: 'Makro',    source: 'Winda Cash', category: 'Grosir',      recorderId: 1, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
  { id: 1030, expenseDate: '2026-05-09', amount:  49,   description: 'Makro groceries',            toko: 'Makro',    source: 'Winda Cash', category: 'Grosir',      recorderId: 2, shared: false, status: 'APPROVED', createdAt: '2026-05-09T18:00:00Z' },
];

// Assign expense type for seed data: trips are reimbursable (OFFICIAL), the rest personal.
const SEED_EXPENSES_TYPED: Expense[] = SEED_EXPENSES.map(e => ({
  ...e,
  type: e.type ?? (e.category === 'Travelling' ? 'OFFICIAL' : 'PERSONAL'),
}));

const SEED_LOANS: Loan[] = [
  { id: 5001, expenseId: 1001, lenderId: 2, borrowerId: 3, amount: 100,   declaredRepayment: 100,   actualRepaid: 50,    remainingBalance: 50,    status: 'PARTIAL',       createdAt: '2026-05-07T18:00:00Z' },
  { id: 5002, expenseId: 1003, lenderId: 2, borrowerId: 1, amount: 100,   declaredRepayment: 100,   actualRepaid:  0,    remainingBalance: 100,   status: 'UNSETTLED',     createdAt: '2026-05-07T18:00:00Z' },
  { id: 5003, expenseId: 1004, lenderId: 2, borrowerId: 3, amount:  66.67,declaredRepayment:  66.67,actualRepaid: 66.67, remainingBalance:   0,   status: 'FULLY_SETTLED', createdAt: '2026-05-07T18:00:00Z' },
  { id: 5004, expenseId: 1006, lenderId: 2, borrowerId: 1, amount:  66.67,declaredRepayment:  66.67,actualRepaid:  0,    remainingBalance:  66.67,status: 'UNSETTLED',     createdAt: '2026-05-07T18:00:00Z' },
  { id: 5005, expenseId: 1007, lenderId: 2, borrowerId: 3, amount:   7.33,declaredRepayment:   7.33,actualRepaid:  0,    remainingBalance:   7.33,status: 'UNSETTLED',     createdAt: '2026-05-07T18:00:00Z' },
  { id: 5006, expenseId: 1009, lenderId: 2, borrowerId: 1, amount:   7.33,declaredRepayment:   7.33,actualRepaid:  0,    remainingBalance:   7.33,status: 'UNSETTLED',     createdAt: '2026-05-07T18:00:00Z' },
  { id: 5007, expenseId: 1010, lenderId: 2, borrowerId: 1, amount:  17,   declaredRepayment:  17,   actualRepaid:  0,    remainingBalance:  17,   status: 'UNSETTLED',     createdAt: '2026-05-07T18:00:00Z' },
  { id: 5008, expenseId: 1011, lenderId: 2, borrowerId: 3, amount:  60,   declaredRepayment:  60,   actualRepaid:  0,    remainingBalance:  60,   status: 'UNSETTLED',     createdAt: '2026-05-08T18:00:00Z' },
  { id: 5009, expenseId: 1012, lenderId: 2, borrowerId: 1, amount:  32,   declaredRepayment:  32,   actualRepaid:  0,    remainingBalance:  32,   status: 'UNSETTLED',     createdAt: '2026-05-08T18:00:00Z' },
  { id: 5010, expenseId: 1015, lenderId: 2, borrowerId: 1, amount:  10,   declaredRepayment:  10,   actualRepaid:  0,    remainingBalance:  10,   status: 'UNSETTLED',     createdAt: '2026-05-08T18:00:00Z' },
];

interface PersistedStore {
  expenses: Expense[];
  loans: Loan[];
  users: User[];
}

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private readonly _expenses = signal<Expense[]>([]);
  private readonly _loans    = signal<Loan[]>([]);
  private readonly _users    = signal<User[]>([]);

  readonly expenses = this._expenses.asReadonly();
  readonly loans    = this._loans.asReadonly();
  readonly users    = this._users.asReadonly();

  readonly totalTeamSpend = computed(() =>
    this._expenses().filter(e => e.status !== 'REJECTED').reduce((s, e) => s + (e.amount ?? 0), 0)
  );

  readonly pendingCount = computed(() =>
    this._expenses().filter(e => e.status === 'PENDING').length
  );

  constructor() {
    this.loadFromStorage();
    effect(() => {
      const payload: PersistedStore = {
        expenses: this._expenses(),
        loans:    this._loans(),
        users:    this._users(),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
    });
  }

  // ─── Users ────────────────────────────────────────────────────────
  getUserById(id: number): User | undefined {
    return this._users().find(u => u.id === id);
  }

  updateUserRole(userId: number, role: 'ADMIN' | 'MEMBER'): void {
    this._users.update(list => list.map(u => u.id === userId ? { ...u, role } : u));
  }

  updateUserActive(userId: number, isActive: boolean): void {
    this._users.update(list => list.map(u => u.id === userId ? { ...u, isActive } : u));
  }

  // ─── Expenses ─────────────────────────────────────────────────────
  addExpense(input: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const id = Math.max(1000, ...this._expenses().map(e => e.id ?? 0)) + 1;
    const newExpense: Expense = { ...input, id, createdAt: new Date().toISOString() };
    this._expenses.update(list => [newExpense, ...list]);
    return newExpense;
  }

  updateExpense(id: number, patch: Partial<Expense>): void {
    this._expenses.update(list =>
      list.map(e => e.id === id ? { ...e, ...patch, id, updatedAt: new Date().toISOString() } : e)
    );
  }

  updateExpenseStatus(id: number, status: ExpenseStatus): void {
    this.updateExpense(id, { status });
  }

  deleteExpense(id: number): void {
    this._expenses.update(list => list.filter(e => e.id !== id));
    this._loans.update(list => list.filter(l => l.expenseId !== id));
  }

  // ─── Loans / Repayments ───────────────────────────────────────────
  recordRepayment(loanId: number, amount: number, _note?: string): void {
    this._loans.update(list =>
      list.map(l => {
        if (l.id !== loanId) return l;
        const newRepaid = (l.actualRepaid ?? 0) + amount;
        const declared  = l.declaredRepayment ?? l.amount ?? 0;
        const newRem    = Math.max(0, declared - newRepaid);
        const status: LoanStatus =
          newRepaid >= declared ? 'FULLY_SETTLED' :
          newRepaid > 0         ? 'PARTIAL'       :
                                  'UNSETTLED';
        return { ...l, actualRepaid: newRepaid, remainingBalance: newRem, status, updatedAt: new Date().toISOString() };
      })
    );
  }

  // ─── Convenience snapshots (kept for back-compat) ─────────────────
  getExpenses(): Expense[] { return this._expenses(); }
  getLoans():    Loan[]    { return this._loans();    }
  getUsers():    User[]    { return this._users();    }

  // ─── Reset (handy for debugging) ──────────────────────────────────
  resetToSeed(): void {
    this._expenses.set([...SEED_EXPENSES_TYPED]);
    this._loans.set([...SEED_LOANS]);
    this._users.set([...SEED_USERS]);
  }

  // ─── Persistence ──────────────────────────────────────────────────
  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedStore;
        this._expenses.set(parsed.expenses ?? [...SEED_EXPENSES_TYPED]);
        this._loans.set(parsed.loans       ?? [...SEED_LOANS]);
        this._users.set(parsed.users       ?? [...SEED_USERS]);
        return;
      }
    } catch {}
    this._expenses.set([...SEED_EXPENSES_TYPED]);
    this._loans.set([...SEED_LOANS]);
    this._users.set([...SEED_USERS]);
  }
}
