import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { Expense } from '@core/models';
import { fmtThb, fmtUsd, fmtIdr, fmtDate } from '@core/utils/currency.utils';
import { categoryStyle } from '@core/utils/category-style';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  template: `
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
            @for (exp of expenses; track exp.id) {
              <tr class="exp-row" (click)="select.emit(exp)">
                <td class="col-date">{{ fmtDate(exp.expenseDate) }}</td>
                <td class="col-store">{{ exp.toko || '—' }}</td>
                <td class="col-desc">
                  <div class="desc-main">{{ exp.description }}</div>
                  @if (exp.shared) { <span class="shared-chip">Shared</span> }
                </td>
                <td>
                  <span class="cat-chip" [class]="'tone-' + catStyle(exp.category).tone">
                    <i class="pi" [class]="catStyle(exp.category).icon"></i>
                    <span>{{ exp.category }}</span>
                  </span>
                </td>
                <td class="col-amount">
                  <div class="amt-main num">{{ fmtThb(exp.amount) }}</div>
                  <div class="amt-sub num">{{ fmtUsd(exp.amount) }} · {{ fmtIdr(exp.amount) }}</div>
                </td>
                <td><app-status-badge [status]="exp.status"></app-status-badge></td>
                <td class="col-actions" (click)="$event.stopPropagation()">
                  <button type="button" class="act-btn act-edit" (click)="edit.emit(exp)" title="Edit">
                    <i class="pi pi-pencil"></i>
                  </button>
                  @if (isAdmin && exp.status === 'PENDING') {
                    <button type="button" class="act-btn act-ok"  (click)="approve.emit(exp)" title="Approve">
                      <i class="pi pi-check"></i>
                    </button>
                    <button type="button" class="act-btn act-rej" (click)="reject.emit(exp)" title="Reject">
                      <i class="pi pi-times"></i>
                    </button>
                  }
                  <button type="button" class="act-btn act-del" (click)="del.emit(exp)" title="Delete">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
            }
            @if (expenses.length === 0) {
              <tr>
                <td colspan="7" class="empty-row">
                  <div class="empty-state">
                    <div class="empty-icon"><i class="pi pi-inbox"></i></div>
                    <div class="empty-text">No expenses found</div>
                    <div class="empty-sub">Try adjusting your filters or add a new expense</div>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages > 1) {
        <div class="pagination">
          <button type="button" class="page-btn" [disabled]="page === 0" (click)="prev.emit()">
            <i class="pi pi-chevron-left"></i> Prev
          </button>
          <span class="page-info">Page <span class="num">{{ page + 1 }}</span> of <span class="num">{{ totalPages }}</span></span>
          <button type="button" class="page-btn" [disabled]="page >= totalPages - 1" (click)="next.emit()">
            Next <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .table-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .table-scroll { overflow-x: auto; }
    .exp-table {
      width: 100%; border-collapse: collapse;
      font-size: 0.85rem; min-width: 880px;
    }
    .exp-table thead th {
      background: var(--surface-muted);
      padding: 10px 14px; text-align: left;
      font-size: 0.65rem; font-weight: 700; color: var(--text-subtle);
      text-transform: uppercase; letter-spacing: 0.06em;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    .exp-table tbody td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--surface-sunken);
      vertical-align: middle;
    }
    .exp-table tbody tr:last-child td { border-bottom: none; }
    .exp-row { cursor: pointer; transition: background 0.12s; }
    .exp-row:hover td { background: var(--surface-muted); }

    .col-date    { color: var(--text-subtle); white-space: nowrap; font-size: 0.78rem; }
    .col-store   { color: var(--text); font-weight: 500; }
    .desc-main   { color: var(--text); font-weight: 500; }
    .shared-chip {
      display: inline-block; margin-top: 3px;
      padding: 1px 7px; border-radius: 999px;
      background: var(--accent-soft); color: var(--accent);
      font-size: 0.62rem; font-weight: 700;
    }

    .cat-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 999px;
      font-size: 0.72rem; font-weight: 600;
    }
    .cat-chip i { font-size: 0.7rem; }

    .col-amount  { text-align: right; }
    .amt-main    { font-size: 0.92rem; font-weight: 700; color: var(--text); }
    .amt-sub     { font-size: 0.68rem; color: var(--text-faint); margin-top: 2px; }

    .col-actions { display: flex; gap: 4px; justify-content: flex-end; }
    .act-btn {
      width: 28px; height: 28px; border-radius: 6px;
      border: 1px solid var(--border); background: var(--surface);
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; transition: background 0.12s, border-color 0.12s;
      font-family: inherit; font-size: 0.78rem; color: var(--text-muted);
    }
    .act-btn:hover { background: var(--surface-muted); }
    .act-edit:hover { color: var(--accent);  border-color: var(--accent);  }
    .act-ok:hover   { color: var(--success); border-color: var(--success); }
    .act-rej:hover,
    .act-del:hover  { color: var(--danger);  border-color: var(--danger);  }

    .empty-row     { padding: 0 !important; border-bottom: none !important; }
    .empty-state   { padding: 56px 24px; text-align: center; }
    .empty-icon    { font-size: 2.2rem; color: var(--text-faint); margin-bottom: 10px; }
    .empty-text    { font-size: 1rem; font-weight: 700; color: var(--text-muted); }
    .empty-sub     { font-size: 0.82rem; color: var(--text-faint); margin-top: 4px; }

    .pagination {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px; border-top: 1px solid var(--border);
      background: var(--surface-muted);
    }
    .page-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--surface);
      font-size: 0.78rem; font-weight: 600; color: var(--text-muted);
      cursor: pointer; font-family: inherit;
      transition: background 0.12s;
    }
    .page-btn:hover:not(:disabled) { background: var(--surface-muted); }
    .page-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .page-info { font-size: 0.78rem; color: var(--text-subtle); }
  `]
})
export class ExpenseListComponent {
  @Input() expenses: Expense[] = [];
  @Input() isAdmin = false;
  @Input() page = 0;
  @Input() totalPages = 1;

  @Output() select  = new EventEmitter<Expense>();
  @Output() edit    = new EventEmitter<Expense>();
  @Output() del     = new EventEmitter<Expense>();
  @Output() approve = new EventEmitter<Expense>();
  @Output() reject  = new EventEmitter<Expense>();
  @Output() prev    = new EventEmitter<void>();
  @Output() next    = new EventEmitter<void>();

  protected fmtThb = fmtThb;
  protected fmtUsd = fmtUsd;
  protected fmtIdr = fmtIdr;
  protected fmtDate = fmtDate;
  protected catStyle = categoryStyle;
}
