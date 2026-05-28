import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { Expense } from '@core/models';
import { fmtThb, fmtUsd, fmtIdr, fmtDate } from '@core/utils/currency.utils';
import { categoryStyle } from '@core/utils/category-style';

@Component({
  selector: 'app-expense-detail-panel',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  template: `
    @if (expense) {
      <div class="panel-backdrop" (click)="close.emit()"></div>
      <div class="side-panel open">
        <div class="side-panel-header">
          <div>
            <h3 class="panel-title">Expense detail</h3>
            <p class="panel-sub">ID #<span class="num">{{ expense.id }}</span></p>
          </div>
          <button type="button" class="panel-close" (click)="close.emit()" aria-label="Close">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="side-panel-body">
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-lbl">Date</span>
              <span class="detail-val">{{ fmtDate(expense.expenseDate) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-lbl">Store</span>
              <span class="detail-val">{{ expense.toko || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-lbl">Description</span>
              <span class="detail-val">{{ expense.description }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-lbl">Category</span>
              <span class="cat-chip" [class]="'tone-' + catStyle(expense.category).tone">
                <i class="pi" [class]="catStyle(expense.category).icon"></i>
                <span>{{ expense.category }}</span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-lbl">Status</span>
              <app-status-badge [status]="expense.status"></app-status-badge>
            </div>
            <div class="detail-row">
              <span class="detail-lbl">Source</span>
              <span class="detail-val">{{ expense.source || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-lbl">Shared</span>
              <span class="detail-val">{{ expense.shared ? 'Yes' : 'No' }}</span>
            </div>
          </div>

          <div class="amount-block">
            <div class="amount-block-label">Amount</div>
            <div class="amount-thb num">{{ fmtThb(expense.amount) }}</div>
            <div class="amount-fx">
              <span class="fx-pill tone-success num">{{ fmtUsd(expense.amount) }}</span>
              <span class="fx-pill tone-accent  num">{{ fmtIdr(expense.amount) }}</span>
            </div>
          </div>
        </div>
        <div class="side-panel-footer">
          <button type="button" class="dlg-btn dlg-cancel" (click)="edit.emit(expense)">
            <i class="pi pi-pencil"></i> Edit
          </button>
          <button type="button" class="dlg-btn dlg-del" (click)="del.emit(expense)">
            <i class="pi pi-trash"></i> Delete
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .panel-title { font-size: 0.95rem; font-weight: 700; color: var(--text); margin: 0; letter-spacing: -0.01em; }
    .panel-sub   { font-size: 0.72rem; color: var(--text-faint); margin: 2px 0 0; }
    .panel-close {
      width: 32px; height: 32px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--surface);
      cursor: pointer; color: var(--text-subtle);
      display: inline-flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .panel-close:hover { background: var(--surface-muted); color: var(--text); }

    .detail-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; }
    .detail-row  {
      display: flex; justify-content: space-between; align-items: center;
      gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--surface-sunken);
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-lbl { font-size: 0.7rem; color: var(--text-faint); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .detail-val { font-size: 0.85rem; color: var(--text); font-weight: 500; text-align: right; }

    .cat-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 999px;
      font-size: 0.72rem; font-weight: 600;
    }
    .cat-chip i { font-size: 0.7rem; }

    .amount-block {
      padding: 14px 16px;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .amount-block-label { font-size: 0.68rem; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
    .amount-thb { font-size: 1.5rem; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
    .amount-fx  { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
    .fx-pill { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; }

    .dlg-btn {
      padding: 9px 16px; border-radius: var(--radius-sm);
      font-size: 0.875rem; font-weight: 600;
      cursor: pointer; font-family: inherit;
      display: inline-flex; align-items: center; gap: 6px;
      transition: background 0.15s;
    }
    .dlg-cancel {
      background: var(--surface); color: var(--text-muted); border: 1px solid var(--border);
      flex: 1;
    }
    .dlg-cancel:hover { background: var(--surface-muted); }
    .dlg-del {
      background: var(--danger-soft); color: var(--danger); border: 1px solid var(--danger-soft);
      flex: 1;
    }
    .dlg-del:hover { background: var(--danger); color: #fff; }
  `]
})
export class ExpenseDetailPanelComponent {
  @Input() expense: Expense | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() edit  = new EventEmitter<Expense>();
  @Output() del   = new EventEmitter<Expense>();

  protected fmtThb = fmtThb;
  protected fmtUsd = fmtUsd;
  protected fmtIdr = fmtIdr;
  protected fmtDate = fmtDate;
  protected catStyle = categoryStyle;
}
