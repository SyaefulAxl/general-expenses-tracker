import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import { Expense, User } from '@core/models';
import { ExpenseFiltersComponent, ExpenseFilters } from './expense-filters.component';
import { ExpenseListComponent } from './expense-list.component';
import { ExpenseFormComponent, ExpenseFormData, EMPTY_FORM, toFormData } from './expense-form.component';
import { ExpenseDetailPanelComponent } from './expense-detail-panel.component';

const PAGE_SIZE = 15;

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule, ToastModule,
    ExpenseFiltersComponent, ExpenseListComponent, ExpenseFormComponent, ExpenseDetailPanelComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast position="top-right" [life]="3000"></p-toast>

    <div class="exp-wrap">
      <div class="exp-header">
        <div>
          <h1 class="exp-title">Expenses</h1>
          <p class="exp-sub">
            <span class="num">{{ filteredExpenses().length }}</span> of
            <span class="num">{{ allExpenses().length }}</span> expenses
          </p>
        </div>
        <button type="button" class="btn-add" (click)="openAdd()">
          <i class="pi pi-plus"></i>
          <span>Add expense</span>
        </button>
      </div>

      <app-expense-filters
        [search]="filters().search"
        [category]="filters().category"
        [status]="filters().status"
        [totalAmount]="filteredTotal()"
        [pendingAmount]="pendingTotal()"
        [approvedAmount]="approvedTotal()"
        (filtersChange)="onFiltersChange($event)" />

      <app-expense-list
        [expenses]="pagedExpenses()"
        [isAdmin]="isAdmin()"
        [page]="currentPage()"
        [totalPages]="totalPages()"
        (select)="selectExp.set($event)"
        (edit)="openEdit($event)"
        (del)="confirmDelete($event)"
        (approve)="approve($event)"
        (reject)="reject($event)"
        (prev)="prevPage()"
        (next)="nextPage()" />
    </div>

    <app-expense-form
      [open]="dialogOpen()"
      [form]="form"
      (openChange)="dialogOpen.set($event)"
      (save)="saveExpense($event)" />

    <app-expense-detail-panel
      [expense]="selectExp()"
      (close)="selectExp.set(null)"
      (edit)="openEdit($event)"
      (del)="confirmDelete($event)" />
  `,
  styles: [`
    .exp-wrap { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .exp-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 18px; flex-wrap: wrap; gap: 12px;
    }
    .exp-title { font-size: 1.5rem; font-weight: 800; color: var(--text); margin: 0; letter-spacing: -0.02em; }
    .exp-sub   { font-size: 0.8rem; color: var(--text-subtle); margin: 4px 0 0; }
    .btn-add {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: var(--radius);
      background: var(--accent); color: #fff; font-size: 0.875rem; font-weight: 600;
      border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.25);
      transition: background 0.15s; font-family: inherit;
    }
    .btn-add:hover { background: var(--accent-hover); }
  `]
})
export class ExpensesComponent implements OnInit {
  private svc    = inject(MockDataService);
  private auth   = inject(AuthService);
  private msgSvc = inject(MessageService);

  protected allExpenses = this.svc.expenses;

  protected filters     = signal<ExpenseFilters>({ search: '', category: 'ALL', status: 'ALL' });
  protected dialogOpen  = signal(false);
  protected selectExp   = signal<Expense | null>(null);
  protected currentPage = signal(0);

  protected form: ExpenseFormData = { ...EMPTY_FORM };
  private editingId = signal<number | undefined>(undefined);

  protected currentUser = signal<User | null>(null);
  protected isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  protected filteredExpenses = computed(() => {
    const { search, category, status } = this.filters();
    const q = search.toLowerCase();
    return this.allExpenses().filter(e => {
      if (q && !`${e.description} ${e.toko ?? ''} ${e.category ?? ''}`.toLowerCase().includes(q)) return false;
      if (category !== 'ALL' && e.category !== category) return false;
      if (status   !== 'ALL' && e.status   !== status)   return false;
      return true;
    });
  });

  protected totalPages = computed(() => Math.max(1, Math.ceil(this.filteredExpenses().length / PAGE_SIZE)));

  protected pagedExpenses = computed(() => {
    const start = this.currentPage() * PAGE_SIZE;
    return this.filteredExpenses().slice(start, start + PAGE_SIZE);
  });

  protected filteredTotal = computed(() => this.filteredExpenses().reduce((s, e) => s + (e.amount ?? 0), 0));
  protected pendingTotal  = computed(() => this.filteredExpenses().filter(e => e.status === 'PENDING').reduce((s, e) => s + (e.amount ?? 0), 0));
  protected approvedTotal = computed(() => this.filteredExpenses().filter(e => e.status === 'APPROVED').reduce((s, e) => s + (e.amount ?? 0), 0));

  ngOnInit(): void {
    this.currentUser.set(this.auth.getCurrentUser());
  }

  onFiltersChange(f: ExpenseFilters): void {
    this.filters.set(f);
    this.currentPage.set(0);
  }

  openAdd(): void {
    this.editingId.set(undefined);
    this.form = { ...EMPTY_FORM, expenseDate: new Date() };
    this.dialogOpen.set(true);
  }

  openEdit(exp: Expense): void {
    this.editingId.set(exp.id);
    this.form = toFormData(exp);
    this.dialogOpen.set(true);
  }

  saveExpense(f: ExpenseFormData): void {
    const dateStr = (f.expenseDate ?? new Date()).toISOString().split('T')[0];
    const patch = {
      expenseDate: dateStr,
      toko:        f.toko,
      description: f.description,
      amount:      f.amount ?? 0,
      category:    f.category,
      source:      f.source,
      shared:      f.shared,
      status:      f.status,
    };

    const editId = this.editingId();
    if (editId) {
      this.svc.updateExpense(editId, patch);
      this.msgSvc.add({ severity: 'success', summary: 'Updated', detail: 'Expense updated successfully.' });
    } else {
      this.svc.addExpense({ ...patch, recorderId: this.currentUser()?.id });
      this.msgSvc.add({ severity: 'success', summary: 'Added', detail: 'Expense added successfully.' });
    }
    this.dialogOpen.set(false);
  }

  approve(exp: Expense): void {
    if (exp.id == null) return;
    this.svc.updateExpenseStatus(exp.id, 'APPROVED');
    this.msgSvc.add({ severity: 'success', summary: 'Approved', detail: `"${exp.description}" approved.` });
  }

  reject(exp: Expense): void {
    if (exp.id == null) return;
    this.svc.updateExpenseStatus(exp.id, 'REJECTED');
    this.msgSvc.add({ severity: 'warn', summary: 'Rejected', detail: `"${exp.description}" rejected.` });
  }

  confirmDelete(exp: Expense): void {
    if (exp.id == null) return;
    if (!confirm(`Delete "${exp.description}"?`)) return;
    this.svc.deleteExpense(exp.id);
    if (this.selectExp()?.id === exp.id) this.selectExp.set(null);
    this.msgSvc.add({ severity: 'success', summary: 'Deleted', detail: `"${exp.description}" deleted.` });
  }

  prevPage(): void { this.currentPage.update(p => Math.max(0, p - 1)); }
  nextPage(): void { this.currentPage.update(p => Math.min(this.totalPages() - 1, p + 1)); }
}
