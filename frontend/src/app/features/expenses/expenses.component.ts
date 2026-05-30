import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import { Expense } from '@core/models';
import { ExpenseFiltersComponent, ExpenseFilters } from './expense-filters.component';
import { ExpenseListComponent } from './expense-list.component';
import { ExpenseFormComponent, ExpenseFormData, EMPTY_FORM, toFormData } from './expense-form.component';
import { ExpenseDetailPanelComponent } from './expense-detail-panel.component';
import { exportExpensesToExcel, parseExpensesFromExcel } from '@core/utils/excel.utils';

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
        <div class="exp-head-text">
          <h1 class="exp-title">Pengeluaran</h1>
          <p class="exp-sub">
            Menampilkan <span class="num">{{ filteredExpenses().length }}</span> dari
            <span class="num">{{ allExpenses().length }}</span> pengeluaran
          </p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-ghost" (click)="exportExcel()" title="Export ke Excel">
            <i class="pi pi-file-excel"></i>
            <span>Export</span>
          </button>
          <button type="button" class="btn-ghost" (click)="fileInput.click()" title="Import dari Excel">
            <i class="pi pi-upload"></i>
            <span>Import</span>
          </button>
          <input #fileInput type="file" accept=".xlsx,.xls" hidden (change)="onImportFile($event)" />
          <button type="button" class="btn-add" (click)="openAdd()">
            <i class="pi pi-plus"></i>
            <span>Tambah</span>
          </button>
        </div>
      </div>

      <app-expense-filters
        [search]="filters().search"
        [category]="filters().category"
        [status]="filters().status"
        [type]="filters().type"
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
        (submit)="submit($event)"
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
    /* The Sakai layout container supplies the page gutter (6rem top / 2rem sides),
       so the page only centers its content — no redundant outer padding. */
    .exp-wrap { max-width: 1400px; margin: 0 auto; }

    /* ── Header band ─────────────────────────────────────────── */
    .exp-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; flex-wrap: wrap;
      padding: 20px 24px; margin-bottom: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }
    .exp-head-text { display: flex; flex-direction: column; gap: 6px; }
    .exp-title { font-size: 1.5rem; font-weight: 800; color: var(--text); margin: 0; letter-spacing: -0.02em; }
    .exp-sub   { font-size: 0.8rem; color: var(--text-subtle); margin: 0; }

    /* ── Toolbar ─────────────────────────────────────────────── */
    .header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .btn-ghost {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 14px; border-radius: var(--radius);
      background: var(--surface); color: var(--text-muted);
      font-size: 0.83rem; font-weight: 600; font-family: inherit;
      border: 1px solid var(--border); cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .btn-ghost:hover { background: var(--surface-muted); color: var(--accent); border-color: var(--accent); }
    .btn-add {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: var(--radius);
      background: var(--accent); color: #fff; font-size: 0.875rem; font-weight: 600;
      border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.25);
      transition: background 0.15s; font-family: inherit;
    }
    .btn-add:hover { background: var(--accent-hover); }

    @media (max-width: 640px) {
      .exp-header { padding: 16px; flex-direction: column; align-items: stretch; }
      .exp-head-text { align-items: flex-start; }
      .header-actions { width: 100%; }
      .header-actions .btn-ghost,
      .header-actions .btn-add { flex: 1; justify-content: center; }
      .btn-add { margin-left: auto; }
    }
  `]
})
export class ExpensesComponent {
  private svc    = inject(MockDataService);
  private auth   = inject(AuthService);
  private msgSvc = inject(MessageService);

  protected allExpenses = this.svc.expenses;

  protected filters     = signal<ExpenseFilters>({ search: '', category: 'ALL', status: 'ALL', type: 'ALL' });
  protected dialogOpen  = signal(false);
  protected selectExp   = signal<Expense | null>(null);
  protected currentPage = signal(0);

  protected form: ExpenseFormData = { ...EMPTY_FORM };
  private editingId = signal<number | undefined>(undefined);

  // Reactive — populated immediately after login.
  protected currentUser = this.auth.currentUser;
  protected isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  protected filteredExpenses = computed(() => {
    const { search, category, status, type } = this.filters();
    const q = search.toLowerCase();
    return this.allExpenses().filter(e => {
      if (q && !`${e.description} ${e.toko ?? ''} ${e.category ?? ''}`.toLowerCase().includes(q)) return false;
      if (category !== 'ALL' && e.category !== category) return false;
      if (status   !== 'ALL' && e.status   !== status)   return false;
      if (type     !== 'ALL' && (e.type ?? 'PERSONAL') !== type) return false;
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
    const base = {
      expenseDate: dateStr,
      toko:        f.toko,
      description: f.description,
      amount:      f.amount ?? 0,
      category:    f.category,
      type:        f.type,
      source:      f.source,
      shared:      f.shared,
    };

    const editId = this.editingId();
    if (editId) {
      // Status is flow-driven (Ajukan / Setujui / Tolak) — never edited here.
      this.svc.updateExpense(editId, base);
      this.msgSvc.add({ severity: 'success', summary: 'Tersimpan', detail: 'Pengeluaran berhasil diperbarui.' });
    } else {
      this.svc.addExpense({ ...base, status: 'DRAFT', recorderId: this.currentUser()?.id });
      this.msgSvc.add({ severity: 'success', summary: 'Ditambahkan', detail: 'Pengeluaran baru dibuat sebagai Draf.' });
    }
    this.dialogOpen.set(false);
  }

  /** DRAFT/REJECTED → PENDING (diajukan ke approver). */
  submit(exp: Expense): void {
    if (exp.id == null) return;
    this.svc.updateExpenseStatus(exp.id, 'PENDING');
    this.msgSvc.add({ severity: 'info', summary: 'Diajukan', detail: `"${exp.description}" menunggu persetujuan.` });
  }

  approve(exp: Expense): void {
    if (exp.id == null) return;
    this.svc.updateExpenseStatus(exp.id, 'APPROVED');
    this.msgSvc.add({ severity: 'success', summary: 'Disetujui', detail: `"${exp.description}" disetujui / lunas.` });
  }

  reject(exp: Expense): void {
    if (exp.id == null) return;
    this.svc.updateExpenseStatus(exp.id, 'REJECTED');
    this.msgSvc.add({ severity: 'warn', summary: 'Ditolak', detail: `"${exp.description}" ditolak.` });
  }

  confirmDelete(exp: Expense): void {
    if (exp.id == null) return;
    if (!confirm(`Hapus "${exp.description}"?`)) return;
    this.svc.deleteExpense(exp.id);
    if (this.selectExp()?.id === exp.id) this.selectExp.set(null);
    this.msgSvc.add({ severity: 'success', summary: 'Dihapus', detail: `"${exp.description}" dihapus.` });
  }

  // ─── Excel ──────────────────────────────────────────────────────────
  exportExcel(): void {
    const rows = this.filteredExpenses();
    if (rows.length === 0) {
      this.msgSvc.add({ severity: 'warn', summary: 'Kosong', detail: 'Tidak ada data untuk di-export.' });
      return;
    }
    const namePart = this.filters().type === 'OFFICIAL' ? 'pengeluaran-resmi'
                   : this.filters().type === 'PERSONAL' ? 'pengeluaran-pribadi'
                   : 'pengeluaran';
    exportExpensesToExcel(rows, namePart);
    this.msgSvc.add({ severity: 'success', summary: 'Export', detail: `${rows.length} baris di-export ke Excel.` });
  }

  onImportFile(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    parseExpensesFromExcel(file)
      .then((rows) => {
        if (rows.length === 0) {
          this.msgSvc.add({ severity: 'warn', summary: 'Import', detail: 'Tidak ada baris yang bisa diimport.' });
          return;
        }
        const recorderId = this.currentUser()?.id;
        for (const r of rows) this.svc.addExpense({ ...r, recorderId });
        this.msgSvc.add({ severity: 'success', summary: 'Import', detail: `${rows.length} pengeluaran berhasil diimport.` });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Gagal mengimport file.';
        this.msgSvc.add({ severity: 'error', summary: 'Import gagal', detail: msg });
      })
      .finally(() => { input.value = ''; });
  }

  prevPage(): void { this.currentPage.update(p => Math.max(0, p - 1)); }
  nextPage(): void { this.currentPage.update(p => Math.min(this.totalPages() - 1, p + 1)); }
}
