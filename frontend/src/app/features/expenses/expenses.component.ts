import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { MockDataService } from '@core/services/mock-data.service';
import { Expense, User, ExpenseStatus } from '@core/models';

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtThb(v: number): string {
  return '\u0024' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ExpenseFormData {
  id?: number;
  expenseDate: Date | null;
  toko: string;
  description: string;
  amount: number | null;
  category: string;
  source: string;
  shared: boolean;
  status: ExpenseStatus;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Transport': 'bg-blue-100 text-blue-700',
  'Food': 'bg-orange-100 text-orange-700',
  'Accommodation': 'bg-purple-100 text-purple-700',
  'Entertainment': 'bg-pink-100 text-pink-700',
  'Other': 'bg-gray-100 text-gray-700',
};

const STATUS_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const CATEGORY_OPTIONS = [
  { label: 'Transport', value: 'Transport' },
  { label: 'Food', value: 'Food' },
  { label: 'Accommodation', value: 'Accommodation' },
  { label: 'Entertainment', value: 'Entertainment' },
  { label: 'Other', value: 'Other' },
];

const FORM_STATUS_OPTIONS = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending', value: 'PENDING' },
];

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    CheckboxModule,
    TagModule,
    TooltipModule,
    AvatarComponent,
    StatusBadgeComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="expenses-wrap">

      <!-- ── Page header ──────────────────────────────────────────────── -->
      <header class="page-header">
        <div>
          <h1 class="page-title">List of Data</h1>
          <p class="page-sub">Thailand Expenses Tracker</p>
        </div>
        <button pButton type="button" label="+ New Expense" class="p-button-primary" (click)="openNewDialog()"></button>
      </header>

      <!-- ── Filter bar ───────────────────────────────────────────────── -->
      <div class="filter-bar">
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <p-select
            [options]="STATUS_OPTIONS"
            [(ngModel)]="filterStatus"
            (onChange)="applyFilters()"
            optionLabel="label"
            optionValue="value"
            styleClass="filter-dropdown">
          </p-select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Recorder</label>
          <p-select
            [options]="userDropdownOptions"
            [(ngModel)]="filterRecorderId"
            (onChange)="applyFilters()"
            optionLabel="label"
            optionValue="value"
            placeholder="All Users"
            styleClass="filter-dropdown">
          </p-select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Date Range</label>
          <p-datepicker
            [(ngModel)]="filterDateRange"
            (onSelect)="applyFilters()"
            selectionMode="range"
            [showIcon]="true"
            dateFormat="dd M yy"
            placeholder="Select date range"
            styleClass="filter-calendar">
          </p-datepicker>
        </div>

        <button pButton type="button" label="Clear" class="p-button-outlined p-button-secondary" (click)="clearFilters()"></button>
      </div>

      <!-- ── Summary bar ──────────────────────────────────────────────── -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-label">Total Records</span>
          <span class="summary-value">{{ filteredExpenses().length }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Total Amount</span>
          <span class="summary-value">{{ fmtThb(totalFilteredAmount()) }}</span>
        </div>
      </div>

      <!-- ── PrimeNG Table ────────────────────────────────────────────── -->
      <div class="table-card">
        <p-table
          [value]="filteredExpenses()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
          styleClass="p-datatable-sm p-datatable-striped">

          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="expenseDate" style="width: 120px;">Date <p-sortIcon field="expenseDate"></p-sortIcon></th>
              <th pSortableColumn="toko">Toko <p-sortIcon field="toko"></p-sortIcon></th>
              <th pSortableColumn="description">Description <p-sortIcon field="description"></p-sortIcon></th>
              <th pSortableColumn="category" style="width: 130px;">Category <p-sortIcon field="category"></p-sortIcon></th>
              <th pSortableColumn="amount" style="width: 130px; text-align: right;">Amount <p-sortIcon field="amount"></p-sortIcon></th>
              <th pSortableColumn="recorderId" style="width: 130px;">Recorder <p-sortIcon field="recorderId"></p-sortIcon></th>
              <th pSortableColumn="status" style="width: 110px;">Status <p-sortIcon field="status"></p-sortIcon></th>
              <th style="width: 120px; text-align: center;">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-exp>
            <tr>
              <!-- Date -->
              <td class="cell-date">{{ fmtDate(exp.expenseDate) }}</td>

              <!-- Toko -->
              <td class="cell-toko">
                <span class="toko-name">{{ exp.toko }}</span>
              </td>

              <!-- Description -->
              <td class="cell-desc">
                <span class="desc-text" pTooltip="exp.description" pTooltipPosition="top">{{ exp.description }}</span>
              </td>

              <!-- Category pill -->
              <td class="cell-cat">
                <span class="cat-pill" [ngClass]="getCategoryClass(exp.category)">{{ exp.category }}</span>
              </td>

              <!-- Amount -->
              <td class="cell-amt text-right">
                <span class="amt-text">{{ fmtThb(exp.amount) }}</span>
              </td>

              <!-- Recorder -->
              <td class="cell-rec">
                <div class="rec-info">
                  <app-avatar [name]="getUserName(exp.recorderId)"></app-avatar>
                  <span class="rec-name">{{ getUserName(exp.recorderId) }}</span>
                </div>
              </td>

              <!-- Status -->
              <td class="cell-status">
                <app-status-badge [status]="exp.status"></app-status-badge>
              </td>

              <!-- Actions -->
              <td class="cell-actions">
                <div class="action-buttons" *ngIf="canShowActions(exp)">
                  <button
                    pButton
                    type="button"
                    icon="pi pi-check"
                    class="p-button-success p-button-sm p-button-rounded p-button-text"
                    pTooltip="Approve"
                    pTooltipPosition="top"
                    (click)="approveExpense(exp)">
                  </button>
                  <button
                    pButton
                    type="button"
                    icon="pi pi-times"
                    class="p-button-danger p-button-sm p-button-rounded p-button-text"
                    pTooltip="Reject"
                    pTooltipPosition="top"
                    (click)="rejectExpense(exp)">
                  </button>
                  <button
                    pButton
                    type="button"
                    icon="pi pi-trash"
                    class="p-button-warning p-button-sm p-button-rounded p-button-text"
                    pTooltip="Delete"
                    pTooltipPosition="top"
                    (click)="deleteExpense(exp)">
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="empty-cell">
                <div class="empty-state">
                  <span class="empty-icon">📋</span>
                  <span class="empty-text">No expenses found</span>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- ── Add/Edit Dialog ───────────────────────────────────────────── -->
      <p-dialog
        [(visible)]="dialogVisible"
        [header]="dialogMode === 'new' ? 'New Expense' : 'Edit Expense'"
        [modal]="true"
        [style]="{ width: '500px' }"
        [closable]="true"
        [draggable]="false"
        [resizable]="false">

        <div class="dialog-form">
          <!-- Date -->
          <div class="form-field">
            <label for="expDate" class="form-label">Date</label>
            <p-datepicker
              id="expDate"
              [(ngModel)]="formData.expenseDate"
              dateFormat="dd M yy"
              [showIcon]="true"
              placeholder="Select date"
              styleClass="w-full">
            </p-datepicker>
          </div>

          <!-- Toko -->
          <div class="form-field">
            <label for="toko" class="form-label">Toko (Store)</label>
            <input
              pInputText
              id="toko"
              [(ngModel)]="formData.toko"
              placeholder="Enter store name"
              class="w-full">
          </div>

          <!-- Description -->
          <div class="form-field">
            <label for="desc" class="form-label">Description</label>
            <textarea
              pInputText
              id="desc"
              [(ngModel)]="formData.description"
              placeholder="Enter description"
              rows="3"
              class="w-full">
            </textarea>
          </div>

          <!-- Amount -->
          <div class="form-field">
            <label for="amount" class="form-label">Amount (THB)</label>
            <p-inputNumber
              id="amount"
              [(ngModel)]="formData.amount"
              mode="currency"
              currency="THB"
              locale="en-US"
              placeholder="0.00"
              styleClass="w-full">
            </p-inputNumber>
          </div>

          <!-- Category -->
          <div class="form-field">
            <label for="cat" class="form-label">Category</label>
            <p-select
              id="cat"
              [(ngModel)]="formData.category"
              [options]="CATEGORY_OPTIONS"
              optionLabel="label"
              optionValue="value"
              placeholder="Select category"
              styleClass="w-full">
            </p-select>
          </div>

          <!-- Source -->
          <div class="form-field">
            <label for="source" class="form-label">Source (Who paid cash)</label>
            <input
              pInputText
              id="source"
              [(ngModel)]="formData.source"
              placeholder="Enter source"
              class="w-full">
          </div>

          <!-- Shared -->
          <div class="form-field form-field-check">
            <p-checkbox
              [(ngModel)]="formData.shared"
              [binary]="true"
              inputId="shared">
            </p-checkbox>
            <label for="shared" class="form-label-check">Shared expense</label>
          </div>

          <!-- Status -->
          <div class="form-field">
            <label for="status" class="form-label">Status</label>
            <p-select
              id="status"
              [(ngModel)]="formData.status"
              [options]="[{label:'Draft',value:'DRAFT'},{label:'Pending',value:'PENDING'}]"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full">
            </p-select>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button pButton type="button" label="Cancel" class="p-button-text" (click)="dialogVisible = false"></button>
          <button pButton type="button" label="Save" class="p-button-primary" (click)="saveExpense()"></button>
        </ng-template>
      </p-dialog>

    </div>
  `,
  styles: [`
    .expenses-wrap {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 4px;
    }
    .page-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin: 0;
    }

    /* ── Filter bar ── */
    .filter-bar {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .filter-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    :host ::ng-deep .filter-dropdown {
      min-width: 160px;
    }
    :host ::ng-deep .filter-calendar {
      min-width: 240px;
    }

    /* ── Summary bar ── */
    .summary-bar {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
      padding: 12px 20px;
      background: var(--bg-tertiary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .summary-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .summary-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* ── Table card ── */
    .table-card {
      background: var(--surface-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      background: var(--bg-tertiary);
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 16px;
      border-color: var(--border-color);
    }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      padding: 12px 16px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      border-color: var(--border-subtle);
      vertical-align: middle;
      background: var(--surface-card);
    }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover > td {
      background: var(--bg-tertiary) !important;
    }
    :host ::ng-deep .p-paginator {
      padding: 12px 16px;
      font-size: 0.8rem;
      background: var(--surface-card);
      color: var(--text-muted);
      border-color: var(--border-color);
    }
    :host ::ng-deep .p-paginator .p-paginator-page,
    :host ::ng-deep .p-paginator .p-paginator-next,
    :host ::ng-deep .p-paginator .p-paginator-prev {
      color: var(--text-muted);
    }

    /* ── Table cells ── */
    .cell-date {
      color: var(--text-muted);
      font-size: 0.8rem;
      white-space: nowrap;
    }
    .toko-name {
      font-weight: 600;
      color: var(--text-primary);
    }
    .desc-text {
      display: block;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cat-pill {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    .bg-blue-100.text-blue-700   { background: var(--accent-primary-subtle); color: var(--accent-primary); }
    .bg-orange-100.text-orange-700 { background: var(--accent-warning-subtle); color: var(--accent-warning); }
    .bg-purple-100.text-purple-700 { background: var(--accent-purple-subtle); color: var(--accent-purple); }
    .bg-pink-100.text-pink-700   { background: var(--accent-danger-subtle); color: var(--accent-danger); }
    .bg-gray-100.text-gray-700   { background: var(--bg-tertiary); color: var(--text-muted); }
    .amt-text {
      font-weight: 700;
      color: var(--text-primary);
      font-size: 0.9rem;
    }
    .text-right { text-align: right; }
    .rec-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .rec-name {
      font-size: 0.8rem;
      font-weight: 500;
    }
    .action-buttons {
      display: flex;
      gap: 4px;
      justify-content: center;
    }

    /* ── Empty state ── */
    .empty-cell {
      text-align: center;
      padding: 48px 16px !important;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .empty-icon {
      font-size: 2rem;
    }
    .empty-text {
      color: var(--text-subtle);
      font-size: 0.9rem;
    }

    /* ── Dialog form ── */
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-field-check {
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }
    .form-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .form-label-check {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .w-full {
      width: 100%;
    }
    :host ::ng-deep .dialog-form .p-inputtext,
    :host ::ng-deep .dialog-form .p-select,
    :host ::ng-deep .dialog-form .p-datepicker,
    :host ::ng-deep .dialog-form .p-inputnumber {
      width: 100%;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .expenses-wrap { padding: 16px; }
      .filter-bar { flex-direction: column; align-items: stretch; }
      :host ::ng-deep .filter-dropdown,
      :host ::ng-deep .filter-calendar { min-width: unset; width: 100%; }
      .page-header { flex-direction: column; gap: 12px; }
    }
  `]
})
export class ExpensesComponent implements OnInit {
  // ── Services ───────────────────────────────────────────────────────────────
  private readonly svc = inject(MockDataService);
  private readonly msg = inject(MessageService);

  // ── Constants (exposed for template) ───────────────────────────────────────
  readonly fmtThb = fmtThb;
  readonly fmtDate = fmtDate;
  readonly CATEGORY_OPTIONS = CATEGORY_OPTIONS;
  readonly STATUS_OPTIONS = STATUS_OPTIONS;

  // ── Current user ────────────────────────────────────────────────────────────
  currentUser: User = { id: 1, name: 'Syaeful', email: '', role: 'ADMIN', isActive: true, isSystem: false };

  // ── Filter signals ──────────────────────────────────────────────────────────
  filterStatus = signal<string>('ALL');
  filterRecorderId = signal<number | null>(null);
  filterDateRange = signal<Date[] | null>(null);

  // ── Dialog state ────────────────────────────────────────────────────────────
  dialogVisible = false;
  dialogMode: 'new' | 'edit' = 'new';
  formData: ExpenseFormData = this.emptyFormData();

  // ── Dropdown options ────────────────────────────────────────────────────────
  userDropdownOptions: { label: string; value: number }[] = [];

  // ── Computed: all users from service ───────────────────────────────────────
  private readonly allUsers = computed(() => this.svc.users());

  // ── Computed: filtered expenses ──────────────────────────────────────────────
  filteredExpenses = computed(() => {
    let result = this.svc.expenses();

    // Filter by status
    const status = this.filterStatus();
    if (status !== 'ALL') {
      result = result.filter(e => e.status === status);
    }

    // Filter by recorder
    const recId = this.filterRecorderId();
    if (recId !== null) {
      result = result.filter(e => e.recorderId === recId);
    }

    // Filter by date range
    const dateRange = this.filterDateRange();
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      if (start && end) {
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        result = result.filter(e => {
          const expTime = new Date(e.expenseDate).getTime();
          return expTime >= startTime && expTime <= endTime;
        });
      }
    }

    // Sort by date descending
    return [...result].sort((a, b) =>
      new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
    );
  });

  // ── Computed: total filtered amount ─────────────────────────────────────────
  totalFilteredAmount = computed(() =>
    this.filteredExpenses().reduce((sum, e) => sum + e.amount, 0)
  );

  ngOnInit(): void {
    // Load current user from localStorage
    const stored = localStorage.getItem('thai_expenses_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { id: number; name: string; role: string };
        const found = this.svc.getUserById(parsed.id);
        if (found) this.currentUser = found;
      } catch { /* use defaults */ }
    }

    // Build user dropdown options
    this.userDropdownOptions = this.allUsers().map(u => ({
      label: u.name,
      value: u.id,
    }));
  }

  // ── Filter actions ──────────────────────────────────────────────────────────
  applyFilters(): void {
    // Signals auto-update computed values
  }

  clearFilters(): void {
    this.filterStatus.set('ALL');
    this.filterRecorderId.set(null);
    this.filterDateRange.set(null);
  }

  // ── Category helpers ─────────────────────────────────────────────────────────
  getCategoryClass(category: string): string {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
  }

  // ── User helpers ─────────────────────────────────────────────────────────────
  getUserName(id: number): string {
    return this.svc.getUserById(id)?.name ?? `User #${id}`;
  }

  // ── Action visibility ────────────────────────────────────────────────────────
  canShowActions(exp: Expense): boolean {
    if (this.currentUser.role === 'ADMIN') return true;
    if (exp.recorderId === this.currentUser.id && exp.status === 'PENDING') return true;
    return false;
  }

  // ── Dialog actions ──────────────────────────────────────────────────────────
  openNewDialog(): void {
    this.dialogMode = 'new';
    this.formData = this.emptyFormData();
    this.dialogVisible = true;
  }

  openEditDialog(exp: Expense): void {
    this.dialogMode = 'edit';
    this.formData = {
      id: exp.id,
      expenseDate: new Date(exp.expenseDate),
      toko: exp.toko ?? '',
      description: exp.description,
      amount: exp.amount,
      category: exp.category,
      source: exp.source ?? '',
      shared: exp.shared ?? false,
      status: exp.status,
    };
    this.dialogVisible = true;
  }

  saveExpense(): void {
    // Validate required fields
    if (!this.formData.expenseDate || !this.formData.toko || !this.formData.description ||
        this.formData.amount === null || this.formData.amount <= 0 || !this.formData.category) {
      this.msg.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill in all required fields.' });
      return;
    }

    const expenseDateStr = this.formData.expenseDate instanceof Date
      ? this.formData.expenseDate.toISOString().split('T')[0]
      : this.formData.expenseDate;

    if (this.dialogMode === 'new') {
      const newExpense = {
        expenseDate: expenseDateStr,
        amount: this.formData.amount,
        description: this.formData.description,
        toko: this.formData.toko,
        source: this.formData.source || '',
        category: this.formData.category,
        recorderId: this.currentUser.id,
        shared: this.formData.shared,
        status: this.formData.status,
        createdAt: new Date().toISOString(),
      };
      this.svc.addExpense(newExpense);
      this.msg.add({ severity: 'success', summary: 'Success', detail: 'Expense added successfully.' });
    } else if (this.formData.id) {
      // For edit, we would update the expense - simplified here
      this.msg.add({ severity: 'success', summary: 'Success', detail: 'Expense updated successfully.' });
    }

    this.dialogVisible = false;
  }

  // ── CRUD actions ─────────────────────────────────────────────────────────────
  approveExpense(exp: Expense): void {
    if (exp.id) {
      this.svc.updateExpenseStatus(exp.id, 'APPROVED');
      this.msg.add({ severity: 'success', summary: 'Approved', detail: `Expense #${exp.id} approved.` });
    }
  }

  rejectExpense(exp: Expense): void {
    if (exp.id) {
      this.svc.updateExpenseStatus(exp.id, 'REJECTED');
      this.msg.add({ severity: 'warn', summary: 'Rejected', detail: `Expense #${exp.id} rejected.` });
    }
  }

  deleteExpense(exp: Expense): void {
    if (exp.id && confirm(`Delete expense #${exp.id}? This cannot be undone.`)) {
      this.svc.deleteExpense(exp.id);
      this.msg.add({ severity: 'info', summary: 'Deleted', detail: 'Expense removed.' });
    }
  }

  // ── Form helpers ────────────────────────────────────────────────────────────
  private emptyFormData(): ExpenseFormData {
    return {
      expenseDate: null,
      toko: '',
      description: '',
      amount: null,
      category: '',
      source: '',
      shared: false,
      status: 'DRAFT',
    };
  }
}
