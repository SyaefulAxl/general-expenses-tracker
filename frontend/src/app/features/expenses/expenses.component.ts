import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import { Expense, User, ExpenseStatus } from '@core/models';
import { fmtThb, fmtUsd, fmtIdr, fmtDate, fmtDateTime, THB_TO_USD, THB_TO_IDR } from '@core/utils/currency.utils';

interface ExpenseForm {
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

const EMPTY_FORM: ExpenseForm = {
  expenseDate: new Date(),
  toko: '',
  description: '',
  amount: null,
  category: 'Food',
  source: 'Cash',
  shared: false,
  status: 'PENDING',
};

const CATEGORIES = ['Transport', 'Food', 'Accommodation', 'Entertainment', 'Other'];
const SOURCES    = ['Cash', 'Credit Card', 'Debit Card', 'Transfer', 'Winda Cash'];
const STATUSES: ExpenseStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];

const CAT_BADGE: Record<string, { bg: string; fg: string }> = {
  Transport:     { bg: '#eff6ff', fg: '#1d4ed8' },
  Food:          { bg: '#fff7ed', fg: '#c2410c' },
  Accommodation: { bg: '#f5f3ff', fg: '#6d28d9' },
  Entertainment: { bg: '#fdf2f8', fg: '#be185d' },
  Other:         { bg: '#f8fafc', fg: '#475569' },
};

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    DialogModule, ButtonModule, InputTextModule, InputNumberModule,
    SelectModule, DatePickerModule, CheckboxModule, ToastModule, TooltipModule,
    StatusBadgeComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast position="top-right" [life]="3000"></p-toast>

    <div class="exp-wrap">

      <!-- ── Header ──────────────────────────────────────────── -->
      <div class="exp-header">
        <div>
          <h1 class="exp-title">Expenses</h1>
          <p class="exp-sub">{{ filteredExpenses().length }} of {{ allExpenses().length }} expenses</p>
        </div>
        <button class="btn-add" (click)="openAddDialog()">
          <span>＋</span> Add Expense
        </button>
      </div>

      <!-- ── Filters ──────────────────────────────────────────── -->
      <div class="filters-bar">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input
            class="search-input"
            type="text"
            placeholder="Search description, store…"
            [(ngModel)]="searchQ"
            (ngModelChange)="onSearch($event)" />
        </div>
        <div class="filter-pills">
          @for (cat of ['ALL', ...cats]; track cat) {
            <button
              class="filter-pill"
              [class.active]="filterCat() === cat"
              (click)="filterCat.set(cat)">
              {{ cat }}
            </button>
          }
        </div>
        <div class="filter-pills">
          @for (st of ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'DRAFT']; track st) {
            <button
              class="filter-pill"
              [class.active]="filterStatus() === st"
              (click)="filterStatus.set(st)">
              {{ st }}
            </button>
          }
        </div>
      </div>

      <!-- ── Summary bar ──────────────────────────────────────── -->
      <div class="summary-strip">
        <div class="summary-chip">
          <span class="summary-label">Total</span>
          <span class="summary-val">{{ fmtThb(filteredTotal()) }}</span>
          <span class="summary-sub">{{ fmtUsd(filteredTotal()) }} · {{ fmtIdr(filteredTotal()) }}</span>
        </div>
        <div class="summary-chip chip-amber">
          <span class="summary-label">Pending</span>
          <span class="summary-val num text-warning">{{ pendingTotal() > 0 ? fmtThb(pendingTotal()) : '—' }}</span>
        </div>
        <div class="summary-chip chip-green">
          <span class="summary-label">Approved</span>
          <span class="summary-val num text-success">{{ fmtThb(approvedTotal()) }}</span>
        </div>
      </div>

      <!-- ── Table ────────────────────────────────────────────── -->
      <div class="table-card">
        <div class="table-scroll">
          <table class="exp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Store</th>
                <th>Description</th>
                <th>Category</th>
                <th class="col-amount">Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (exp of pagedExpenses(); track exp.id) {
                <tr (click)="selectExp(exp)" class="exp-row">
                  <td class="col-date">{{ fmtDate(exp.expenseDate) }}</td>
                  <td class="col-store">{{ exp.toko || '—' }}</td>
                  <td class="col-desc">
                    <div class="desc-main">{{ exp.description }}</div>
                    @if (exp.shared) { <span class="shared-chip">Shared</span> }
                  </td>
                  <td>
                    <span class="cat-chip"
                      [style.background]="catBg(exp.category)"
                      [style.color]="catFg(exp.category)">
                      {{ exp.category }}
                    </span>
                  </td>
                  <td class="col-amount">
                    <div class="amt-main">{{ fmtThb(exp.amount) }}</div>
                    <div class="amt-sub">{{ fmtUsd(exp.amount) }} · {{ fmtIdr(exp.amount) }}</div>
                  </td>
                  <td><app-status-badge [status]="exp.status"></app-status-badge></td>
                  <td class="col-actions" (click)="$event.stopPropagation()">
                    <button class="act-btn act-edit" (click)="openEditDialog(exp)" title="Edit">✏</button>
                    @if (isAdmin()) {
                      @if (exp.status === 'PENDING') {
                        <button class="act-btn act-ok" (click)="approve(exp)" title="Approve">✓</button>
                        <button class="act-btn act-rej" (click)="reject(exp)" title="Reject">✕</button>
                      }
                    }
                    <button class="act-btn act-del" (click)="confirmDelete(exp)" title="Delete">🗑</button>
                  </td>
                </tr>
              }
              @if (filteredExpenses().length === 0) {
                <tr>
                  <td colspan="7" class="empty-row">
                    <div class="empty-state">
                      <div class="empty-icon">📋</div>
                      <div class="empty-text">No expenses found</div>
                      <div class="empty-sub">Try adjusting your filters or add a new expense</div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button class="page-btn" [disabled]="currentPage() === 0" (click)="prevPage()">← Prev</button>
            <span class="page-info">Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
            <button class="page-btn" [disabled]="currentPage() >= totalPages() - 1" (click)="nextPage()">Next →</button>
          </div>
        }
      </div>

    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- Add / Edit Dialog                                         -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <p-dialog
      [visible]="dialogVisible()"
      (visibleChange)="dialogVisible.set($event)"
      [header]="editingId() ? 'Edit Expense' : 'Add Expense'"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '520px' }"
      appendTo="body">

      <div class="dialog-body">
        <!-- Date + Store row -->
        <div class="form-row">
          <div class="form-grp">
            <label class="form-lbl">Date <span class="req">*</span></label>
            <p-datepicker
              [(ngModel)]="form.expenseDate"
              [showIcon]="true"
              dateFormat="yy-mm-dd"
              placeholder="Select date"
              styleClass="w-full">
            </p-datepicker>
          </div>
          <div class="form-grp">
            <label class="form-lbl">Store / Toko</label>
            <input class="form-inp" type="text" [(ngModel)]="form.toko" placeholder="e.g. Seven 11" />
          </div>
        </div>

        <!-- Description -->
        <div class="form-grp">
          <label class="form-lbl">Description <span class="req">*</span></label>
          <input class="form-inp" type="text" [(ngModel)]="form.description" placeholder="What was this expense for?" />
        </div>

        <!-- Amount + Category row -->
        <div class="form-row">
          <div class="form-grp">
            <label class="form-lbl">Amount (THB) <span class="req">*</span></label>
            <p-inputnumber
              [(ngModel)]="form.amount"
              mode="decimal"
              [minFractionDigits]="2"
              [maxFractionDigits]="2"
              placeholder="0.00"
              styleClass="w-full"
              (ngModelChange)="onAmountChange()">
            </p-inputnumber>
            <!-- Live conversion -->
            @if (form.amount && form.amount > 0) {
              <div class="amount-preview">
                <span class="prev-pill prev-usd">≈ {{ fmtUsd(form.amount) }}</span>
                <span class="prev-pill prev-idr">≈ {{ fmtIdr(form.amount) }}</span>
              </div>
            }
          </div>
          <div class="form-grp">
            <label class="form-lbl">Category <span class="req">*</span></label>
            <p-select
              [(ngModel)]="form.category"
              [options]="categoryOptions"
              placeholder="Select category"
              styleClass="w-full">
            </p-select>
          </div>
        </div>

        <!-- Source + Status row -->
        <div class="form-row">
          <div class="form-grp">
            <label class="form-lbl">Payment Source</label>
            <p-select
              [(ngModel)]="form.source"
              [options]="sourceOptions"
              placeholder="Select source"
              styleClass="w-full">
            </p-select>
          </div>
          <div class="form-grp">
            <label class="form-lbl">Status</label>
            <p-select
              [(ngModel)]="form.status"
              [options]="statusOptions"
              placeholder="Select status"
              styleClass="w-full">
            </p-select>
          </div>
        </div>

        <!-- Shared -->
        <div class="form-check">
          <p-checkbox [(ngModel)]="form.shared" [binary]="true" inputId="shared"></p-checkbox>
          <label for="shared" class="check-lbl">This expense is shared among team members</label>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button class="dlg-btn dlg-cancel" (click)="closeDialog()">Cancel</button>
        <button class="dlg-btn dlg-save" (click)="saveExpense()" [disabled]="!isFormValid()">
          {{ editingId() ? 'Update Expense' : 'Add Expense' }}
        </button>
      </ng-template>
    </p-dialog>

    <!-- ── Expense Detail Side Panel ──────────────────────────── -->
    @if (selectedExp()) {
      <div class="panel-backdrop" (click)="selectedExp.set(null)"></div>
      <div class="side-panel open">
        <div class="side-panel-header">
          <div>
            <h3 class="panel-title">Expense Detail</h3>
            <p class="panel-sub">ID #{{ selectedExp()!.id }}</p>
          </div>
          <button class="panel-close" (click)="selectedExp.set(null)">✕</button>
        </div>
        <div class="side-panel-body">
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-lbl">Date</span>
              <span class="detail-val">{{ fmtDate(selectedExp()!.expenseDate) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-lbl">Store</span>
              <span class="detail-val">{{ selectedExp()!.toko || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-lbl">Description</span>
              <span class="detail-val">{{ selectedExp()!.description }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-lbl">Category</span>
              <span class="cat-chip"
                [style.background]="catBg(selectedExp()!.category)"
                [style.color]="catFg(selectedExp()!.category)">
                {{ selectedExp()!.category }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-lbl">Status</span>
              <app-status-badge [status]="selectedExp()!.status"></app-status-badge>
            </div>
            <div class="detail-row">
              <span class="detail-lbl">Source</span>
              <span class="detail-val">{{ selectedExp()!.source || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-lbl">Shared</span>
              <span class="detail-val">{{ selectedExp()!.shared ? 'Yes' : 'No' }}</span>
            </div>
          </div>
          <!-- Amount block -->
          <div class="amount-block">
            <div class="amount-block-label">Amount</div>
            <div class="amount-thb">{{ fmtThb(selectedExp()!.amount) }}</div>
            <div class="amount-fx">
              <span class="fx-pill fx-usd">{{ fmtUsd(selectedExp()!.amount) }}</span>
              <span class="fx-pill fx-idr">{{ fmtIdr(selectedExp()!.amount) }}</span>
            </div>
          </div>
        </div>
        <div class="side-panel-footer">
          <button class="dlg-btn dlg-cancel" (click)="openEditDialog(selectedExp()!)">✏ Edit</button>
          <button class="dlg-btn dlg-del" (click)="confirmDelete(selectedExp()!)">🗑 Delete</button>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── ng-deep dialog override (transparency fix) ─────────── */
    :host ::ng-deep .p-dialog {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 14px !important;
      box-shadow: 0 25px 60px rgba(0,0,0,0.2) !important;
      overflow: hidden !important;
    }
    :host ::ng-deep .p-dialog .p-dialog-header {
      background: #ffffff !important;
      border-bottom: 1px solid #e2e8f0 !important;
      padding: 18px 22px !important;
      border-radius: 14px 14px 0 0 !important;
    }
    :host ::ng-deep .p-dialog .p-dialog-header .p-dialog-title {
      font-weight: 700 !important;
      font-size: 1rem !important;
      color: #0f172a !important;
    }
    :host ::ng-deep .p-dialog .p-dialog-content {
      background: #ffffff !important;
      padding: 0 !important;
    }
    :host ::ng-deep .p-dialog .p-dialog-footer {
      background: #f8fafc !important;
      border-top: 1px solid #e2e8f0 !important;
      padding: 0 !important;
      border-radius: 0 0 14px 14px !important;
    }
    :host ::ng-deep .p-dialog-mask {
      background: rgba(15,23,42,0.55) !important;
      backdrop-filter: blur(4px) !important;
    }

    /* ── Page ──────────────────────────────────────────────── */
    .exp-wrap { padding: 24px; max-width: 1400px; margin: 0 auto; }

    .exp-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }
    .exp-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
    .exp-sub   { font-size: 0.8rem; color: #64748b; margin: 4px 0 0; }

    .btn-add {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 10px;
      background: #2563eb; color: #ffffff;
      font-size: 0.875rem; font-weight: 700;
      border: none; cursor: pointer;
      box-shadow: 0 4px 12px rgba(37,99,235,0.3);
      transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
      font-family: inherit;
    }
    .btn-add:hover  { background: #1d4ed8; box-shadow: 0 6px 16px rgba(37,99,235,0.4); }
    .btn-add:active { transform: translateY(1px); }

    /* ── Filters ───────────────────────────────────────────── */
    .filters-bar {
      display: flex; align-items: center; flex-wrap: wrap;
      gap: 12px; margin-bottom: 16px;
    }
    .search-wrap {
      display: flex; align-items: center; gap: 8px;
      background: #ffffff; border: 1.5px solid #e2e8f0;
      border-radius: 10px; padding: 8px 12px;
      flex: 1; min-width: 200px; max-width: 320px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .search-wrap:focus-within {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }
    .search-icon  { font-size: 0.9rem; color: #94a3b8; }
    .search-input {
      border: none; outline: none; background: transparent;
      font-size: 0.875rem; color: #0f172a; width: 100%; font-family: inherit;
    }
    .search-input::placeholder { color: #94a3b8; }

    .filter-pills { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-pill {
      padding: 5px 12px; border-radius: 999px; font-size: 0.72rem; font-weight: 600;
      border: 1.5px solid #e2e8f0; background: #ffffff; color: #64748b;
      cursor: pointer; transition: all 0.15s; font-family: inherit;
    }
    .filter-pill:hover  { background: #f8fafc; border-color: #cbd5e1; }
    .filter-pill.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }

    /* ── Summary strip ─────────────────────────────────────── */
    .summary-strip {
      display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 18px;
    }
    .summary-chip {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 16px; border-radius: 10px;
      background: #ffffff; border: 1px solid #e2e8f0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .chip-amber { background: #fffbeb; border-color: #fde68a; }
    .chip-green { background: #f0fdf4; border-color: #a7f3d0; }
    .summary-label { font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; }
    .summary-val   { font-size: 0.95rem; font-weight: 800; color: #0f172a; }
    .summary-sub   { font-size: 0.7rem; color: #94a3b8; }

    /* ── Table ─────────────────────────────────────────────── */
    .table-card {
      background: #ffffff; border-radius: 14px;
      border: 1px solid #e2e8f0; overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .exp-table { width: 100%; border-collapse: collapse; }
    .exp-table thead th {
      background: #f8fafc; padding: 10px 14px;
      text-align: left; font-size: 0.66rem; font-weight: 700;
      color: #64748b; text-transform: uppercase; letter-spacing: 0.07em;
      border-bottom: 1px solid #e2e8f0; white-space: nowrap;
    }
    .exp-table tbody td {
      padding: 11px 14px; border-bottom: 1px solid #f1f5f9;
      vertical-align: middle; font-size: 0.84rem; color: #334155;
    }
    .exp-row { cursor: pointer; transition: background 0.12s; }
    .exp-row:hover td { background: #f8fafc; }
    .exp-table tbody tr:last-child td { border-bottom: none; }

    .col-date  { white-space: nowrap; color: #64748b !important; font-size: 0.78rem !important; }
    .col-store { color: #64748b !important; font-size: 0.8rem !important; }
    .col-desc  { max-width: 200px; }
    .col-amount{ text-align: right; }
    .col-actions { white-space: nowrap; }

    .desc-main   { font-weight: 600; color: #0f172a; }
    .shared-chip {
      display: inline-block; padding: 1px 6px;
      background: #eff6ff; color: #2563eb;
      border-radius: 999px; font-size: 0.6rem; font-weight: 700;
      margin-top: 2px;
    }
    .cat-chip {
      display: inline-block; padding: 3px 9px;
      border-radius: 999px; font-size: 0.68rem; font-weight: 700;
    }
    .amt-main { font-weight: 700; color: #0f172a; font-size: 0.88rem; }
    .amt-sub  { font-size: 0.68rem; color: #94a3b8; margin-top: 2px; }

    /* ── Action buttons ────────────────────────────────────── */
    .act-btn {
      width: 28px; height: 28px; border-radius: 6px;
      border: 1px solid #e2e8f0; background: #ffffff;
      font-size: 0.8rem; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      margin-left: 3px; transition: all 0.15s;
    }
    .act-edit:hover { background: #eff6ff; border-color: #bfdbfe; }
    .act-ok:hover   { background: #f0fdf4; border-color: #a7f3d0; color: #059669; }
    .act-rej:hover  { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
    .act-del:hover  { background: #fef2f2; border-color: #fecaca; }

    /* ── Empty state ───────────────────────────────────────── */
    .empty-row td { padding: 48px !important; }
    .empty-state  { text-align: center; }
    .empty-icon   { font-size: 2rem; margin-bottom: 8px; }
    .empty-text   { font-size: 0.9rem; font-weight: 600; color: #334155; }
    .empty-sub    { font-size: 0.78rem; color: #94a3b8; margin-top: 4px; }

    /* ── Pagination ────────────────────────────────────────── */
    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 16px;
      padding: 12px; border-top: 1px solid #f1f5f9;
    }
    .page-btn {
      padding: 6px 14px; border-radius: 8px;
      border: 1.5px solid #e2e8f0; background: #ffffff;
      color: #334155; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; transition: all 0.15s; font-family: inherit;
    }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-btn:not(:disabled):hover { background: #f8fafc; border-color: #2563eb; color: #2563eb; }
    .page-info { font-size: 0.8rem; color: #64748b; }

    /* ── Dialog body ───────────────────────────────────────── */
    .dialog-body { padding: 22px; display: flex; flex-direction: column; gap: 16px; }
    .form-row    { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .form-grp    { display: flex; flex-direction: column; gap: 6px; }
    .form-lbl    { font-size: 0.78rem; font-weight: 600; color: #334155; }
    .req         { color: #dc2626; }
    .form-inp {
      width: 100%; padding: 9px 12px;
      border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; font-family: inherit; color: #0f172a;
      background: #ffffff; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-inp:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .form-check { display: flex; align-items: center; gap: 10px; }
    .check-lbl  { font-size: 0.82rem; color: #334155; cursor: pointer; }

    .amount-preview { display: flex; gap: 8px; margin-top: 6px; }
    .prev-pill {
      padding: 3px 10px; border-radius: 999px;
      font-size: 0.72rem; font-weight: 700;
    }
    .prev-usd { background: #f0fdf4; color: #059669; }
    .prev-idr { background: #eff6ff; color: #1d4ed8; }

    /* ── Dialog buttons ────────────────────────────────────── */
    .dlg-btn {
      padding: 9px 20px; border-radius: 8px; font-size: 0.875rem;
      font-weight: 700; border: none; cursor: pointer;
      transition: all 0.15s; font-family: inherit;
    }
    .dlg-cancel {
      background: #f1f5f9; color: #334155;
      border: 1.5px solid #e2e8f0;
      margin: 12px 4px 12px 12px;
    }
    .dlg-cancel:hover { background: #e2e8f0; }
    .dlg-save {
      background: #2563eb; color: #ffffff;
      box-shadow: 0 4px 12px rgba(37,99,235,0.3);
      margin: 12px 12px 12px 4px;
    }
    .dlg-save:hover:not(:disabled) { background: #1d4ed8; }
    .dlg-save:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
    .dlg-del {
      background: #fee2e2; color: #dc2626;
      border: 1.5px solid #fecaca;
      margin: 12px;
    }
    .dlg-del:hover { background: #fecaca; }

    /* ── Side panel ────────────────────────────────────────── */
    .panel-backdrop {
      position: fixed; inset: 0;
      background: rgba(15,23,42,0.4); backdrop-filter: blur(2px);
      z-index: 150;
    }
    .side-panel {
      position: fixed; top: 0; right: 0; bottom: 0; width: 420px;
      max-width: 100vw; background: #ffffff; z-index: 151;
      box-shadow: -4px 0 24px rgba(0,0,0,0.1);
      display: flex; flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
    }
    .side-panel.open { transform: translateX(0); }
    .side-panel-header {
      padding: 18px 20px; border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: flex-start; justify-content: space-between;
    }
    .panel-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0; }
    .panel-sub   { font-size: 0.72rem; color: #94a3b8; margin: 3px 0 0; }
    .panel-close {
      width: 30px; height: 30px; border-radius: 6px;
      border: 1px solid #e2e8f0; background: #f8fafc;
      cursor: pointer; font-size: 0.75rem; color: #64748b;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .panel-close:hover { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
    .side-panel-body { flex: 1; overflow-y: auto; padding: 20px; }
    .side-panel-footer {
      padding: 14px 20px; border-top: 1px solid #e2e8f0;
      display: flex; gap: 8px;
    }

    .detail-grid { display: flex; flex-direction: column; gap: 2px; margin-bottom: 20px; }
    .detail-row  {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
      padding: 10px 0; border-bottom: 1px solid #f1f5f9;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-lbl { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
    .detail-val { font-size: 0.84rem; color: #0f172a; font-weight: 500; text-align: right; }

    .amount-block {
      background: #f8fafc; border-radius: 12px; padding: 16px;
      border: 1px solid #e2e8f0; text-align: center;
    }
    .amount-block-label { font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }
    .amount-thb { font-size: 1.8rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .amount-fx  { display: flex; justify-content: center; gap: 8px; margin-top: 8px; }
    .fx-pill    { padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    .fx-usd     { background: #f0fdf4; color: #059669; }
    .fx-idr     { background: #eff6ff; color: #1d4ed8; }
  `]
})
export class ExpensesComponent implements OnInit {
  private svc    = inject(MockDataService);
  private auth   = inject(AuthService);
  private msgSvc = inject(MessageService);

  fmtThb = fmtThb;
  fmtUsd = fmtUsd;
  fmtIdr = fmtIdr;
  fmtDate = fmtDate;
  fmtDateTime = fmtDateTime;

  cats = CATEGORIES;
  categoryOptions = CATEGORIES.map(c => ({ label: c, value: c }));
  sourceOptions   = SOURCES.map(s => ({ label: s, value: s }));
  statusOptions   = STATUSES.map(s => ({ label: s, value: s }));

  // Live data — direct read from store
  allExpenses = this.svc.expenses;

  // UI state
  dialogVisible = signal(false);
  editingId     = signal<number | undefined>(undefined);
  selectedExp   = signal<Expense | null>(null);
  filterCat     = signal('ALL');
  filterStatus  = signal('ALL');
  currentPage   = signal(0);
  pageSize      = 15;

  searchQ = '';
  private searchSignal = signal('');

  form: ExpenseForm = { ...EMPTY_FORM };

  currentUser = signal<User | null>(null);

  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  filteredExpenses = computed(() => {
    const q = this.searchSignal().toLowerCase();
    const cat = this.filterCat();
    const st  = this.filterStatus();
    return this.allExpenses().filter(e => {
      if (q && !`${e.description} ${e.toko ?? ''} ${e.category ?? ''}`.toLowerCase().includes(q)) return false;
      if (cat !== 'ALL' && e.category !== cat) return false;
      if (st  !== 'ALL' && e.status   !== st)  return false;
      return true;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredExpenses().length / this.pageSize)));

  pagedExpenses = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.filteredExpenses().slice(start, start + this.pageSize);
  });

  filteredTotal = computed(() => this.filteredExpenses().reduce((s, e) => s + (e.amount ?? 0), 0));
  pendingTotal  = computed(() => this.filteredExpenses().filter(e => e.status === 'PENDING').reduce((s, e) => s + (e.amount ?? 0), 0));
  approvedTotal = computed(() => this.filteredExpenses().filter(e => e.status === 'APPROVED').reduce((s, e) => s + (e.amount ?? 0), 0));

  ngOnInit() {
    this.currentUser.set(this.auth.getCurrentUser());
  }

  onSearch(q: string) {
    this.searchSignal.set(q);
    this.currentPage.set(0);
  }

  openAddDialog() {
    this.editingId.set(undefined);
    this.form = { ...EMPTY_FORM, expenseDate: new Date() };
    this.dialogVisible.set(true);
  }

  openEditDialog(exp: Expense) {
    this.editingId.set(exp.id);
    this.form = {
      id: exp.id,
      expenseDate: exp.expenseDate ? new Date(exp.expenseDate) : new Date(),
      toko: exp.toko ?? '',
      description: exp.description,
      amount: exp.amount,
      category: exp.category,
      source: exp.source ?? 'Cash',
      shared: exp.shared ?? false,
      status: exp.status,
    };
    this.dialogVisible.set(true);
  }

  closeDialog() { this.dialogVisible.set(false); }

  isFormValid(): boolean {
    return !!(this.form.description?.trim() && this.form.amount && this.form.amount > 0 && this.form.expenseDate);
  }

  onAmountChange() { /* templated computed handles preview */ }

  saveExpense() {
    if (!this.isFormValid()) return;
    const dateStr = (this.form.expenseDate ?? new Date()).toISOString().split('T')[0];

    const patch = {
      expenseDate: dateStr,
      toko:        this.form.toko,
      description: this.form.description,
      amount:      this.form.amount ?? 0,
      category:    this.form.category,
      source:      this.form.source,
      shared:      this.form.shared,
      status:      this.form.status,
    };

    const editId = this.editingId();
    if (editId) {
      this.svc.updateExpense(editId, patch);
      this.msgSvc.add({ severity: 'success', summary: 'Updated', detail: 'Expense updated successfully' });
    } else {
      this.svc.addExpense({ ...patch, recorderId: this.currentUser()?.id });
      this.msgSvc.add({ severity: 'success', summary: 'Added', detail: 'Expense added successfully' });
    }
    this.closeDialog();
  }

  approve(exp: Expense) {
    if (exp.id == null) return;
    this.svc.updateExpenseStatus(exp.id, 'APPROVED');
    this.msgSvc.add({ severity: 'success', summary: 'Approved', detail: `"${exp.description}" approved` });
  }

  reject(exp: Expense) {
    if (exp.id == null) return;
    this.svc.updateExpenseStatus(exp.id, 'REJECTED');
    this.msgSvc.add({ severity: 'warn', summary: 'Rejected', detail: `"${exp.description}" rejected` });
  }

  confirmDelete(exp: Expense) {
    if (exp.id == null) return;
    if (!confirm(`Delete "${exp.description}"?`)) return;
    this.svc.deleteExpense(exp.id);
    if (this.selectedExp()?.id === exp.id) this.selectedExp.set(null);
    this.msgSvc.add({ severity: 'success', summary: 'Deleted', detail: `"${exp.description}" deleted` });
  }

  selectExp(exp: Expense) { this.selectedExp.set(exp); }

  prevPage() { this.currentPage.update(p => Math.max(0, p - 1)); }
  nextPage() { this.currentPage.update(p => Math.min(this.totalPages() - 1, p + 1)); }

  catBg(cat: string): string { return CAT_BADGE[cat]?.bg ?? '#f8fafc'; }
  catFg(cat: string): string { return CAT_BADGE[cat]?.fg ?? '#475569'; }
}
