import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { fmtThb, fmtUsd, fmtIdr, fmtDateTime } from '@core/utils/currency.utils';
import { TimelineItem, asExpense, asLoan } from './history-types';

@Component({
  selector: 'app-history-detail-panel',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  template: `
    @if (item) {
      <div class="panel-backdrop" (click)="close.emit()"></div>
      <div class="detail-panel">
        <div class="panel-header">
          <button type="button" class="panel-close-btn" (click)="close.emit()">
            <i class="pi pi-arrow-left"></i>
            <span>Close</span>
          </button>
          <span class="panel-title">
            {{ item.type === 'expense' ? 'Expense detail' : 'Repayment detail' }}
          </span>
        </div>

        @if (item.type === 'expense') {
          <div class="panel-hero expense-hero">
            <div class="panel-hero-top">
              <span class="panel-hero-store">{{ asExpense(item.data).toko || '—' }}</span>
              <app-status-badge [status]="item.data.status"></app-status-badge>
            </div>
            <div class="panel-hero-amount num">{{ fmtThb(asExpense(item.data).amount) }}</div>
            <div class="panel-hero-currencies">
              <span class="currency-pill tone-accent num">{{ fmtUsd(asExpense(item.data).amount) }}</span>
              <span class="currency-pill tone-accent num">{{ fmtIdr(asExpense(item.data).amount) }}</span>
            </div>
            <div class="panel-hero-desc">{{ asExpense(item.data).description }}</div>
          </div>
          <div class="panel-detail-grid">
            <span class="detail-key">Category</span>
            <span class="detail-val">{{ asExpense(item.data).category }}</span>

            <span class="detail-key">Date</span>
            <span class="detail-val">{{ asExpense(item.data).expenseDate }}</span>

            <span class="detail-key">Recorded by</span>
            <span class="detail-val">{{ getUserName(asExpense(item.data).recorderId ?? 0) }}</span>

            <span class="detail-key">Source</span>
            <span class="detail-val">{{ asExpense(item.data).source ?? '—' }}</span>

            <span class="detail-key">Shared</span>
            <span class="detail-val">{{ asExpense(item.data).shared ? 'Yes' : 'No' }}</span>

            <span class="detail-key">Status</span>
            <span class="detail-val"><app-status-badge [status]="item.data.status"></app-status-badge></span>

            <span class="detail-key">Created</span>
            <span class="detail-val">{{ fmtDateTime(item.data.createdAt!) }}</span>

            <span class="detail-key">THB</span>
            <span class="detail-val num fw-bold">{{ fmtThb(asExpense(item.data).amount) }}</span>

            <span class="detail-key">USD</span>
            <span class="detail-val num">{{ fmtUsd(asExpense(item.data).amount) }}</span>

            <span class="detail-key">IDR</span>
            <span class="detail-val num">{{ fmtIdr(asExpense(item.data).amount) }}</span>
          </div>
        } @else {
          <div class="panel-hero repayment-hero">
            <div class="panel-hero-top">
              <span class="panel-hero-store">Loan #<span class="num">{{ item.data.id }}</span></span>
              <app-status-badge [status]="item.data.status"></app-status-badge>
            </div>
            <div class="panel-hero-amount num text-success">{{ fmtThb(asLoan(item.data).actualRepaid ?? 0) }}</div>
            <div class="panel-hero-currencies">
              <span class="currency-pill tone-success num">{{ fmtUsd(asLoan(item.data).actualRepaid ?? 0) }}</span>
            </div>
            <div class="panel-hero-desc">
              {{ getUserName(asLoan(item.data).borrowerId ?? 0) }} → {{ getUserName(asLoan(item.data).lenderId ?? 0) }}
            </div>
          </div>
          <div class="panel-detail-grid">
            <span class="detail-key">Lender</span>
            <span class="detail-val">{{ getUserName(asLoan(item.data).lenderId ?? 0) }}</span>

            <span class="detail-key">Borrower</span>
            <span class="detail-val">{{ getUserName(asLoan(item.data).borrowerId ?? 0) }}</span>

            <span class="detail-key">Repaid</span>
            <span class="detail-val num text-success">{{ fmtThb(asLoan(item.data).actualRepaid ?? 0) }}</span>

            <span class="detail-key">Repaid USD</span>
            <span class="detail-val num text-success">{{ fmtUsd(asLoan(item.data).actualRepaid ?? 0) }}</span>

            <span class="detail-key">Remaining</span>
            <span class="detail-val num text-danger">{{ fmtThb(asLoan(item.data).remainingBalance ?? 0) }}</span>

            <span class="detail-key">Status</span>
            <span class="detail-val"><app-status-badge [status]="item.data.status"></app-status-badge></span>

            <span class="detail-key">Created</span>
            <span class="detail-val">{{ fmtDateTime(item.data.createdAt!) }}</span>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .panel-backdrop {
      position: fixed; inset: 0;
      background: rgba(15,23,42,0.4);
      backdrop-filter: blur(2px);
      z-index: 150;
    }
    .detail-panel {
      position: fixed; top: 0; right: 0; bottom: 0;
      width: 440px; max-width: 100vw;
      background: var(--surface);
      z-index: 151;
      box-shadow: 0 0 0 1px rgba(15,23,42,0.05), -8px 0 24px rgba(15,23,42,0.1);
      display: flex; flex-direction: column;
      overflow-y: auto;
    }
    .panel-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; gap: 14px;
      background: var(--surface); position: sticky; top: 0; z-index: 1;
    }
    .panel-close-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 10px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--surface);
      font-size: 0.78rem; font-weight: 600; color: var(--text-muted);
      cursor: pointer; font-family: inherit;
    }
    .panel-close-btn:hover { background: var(--surface-muted); }
    .panel-title { font-size: 0.95rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }

    .panel-hero {
      padding: 22px 20px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .expense-hero   { background: linear-gradient(135deg, var(--accent-soft), var(--surface)); }
    .repayment-hero { background: linear-gradient(135deg, var(--success-soft), var(--surface)); }

    .panel-hero-top { display: flex; justify-content: space-between; align-items: center; }
    .panel-hero-store  { font-size: 0.95rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
    .panel-hero-amount { font-size: 2rem; font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
    .panel-hero-currencies { display: flex; gap: 6px; flex-wrap: wrap; }
    .currency-pill {
      font-size: 0.72rem; font-weight: 600;
      padding: 3px 10px; border-radius: 999px;
    }
    .panel-hero-desc { font-size: 0.82rem; color: var(--text-subtle); }

    .panel-detail-grid {
      display: grid; grid-template-columns: 110px 1fr;
      padding: 16px 20px;
    }
    .detail-key {
      font-size: 0.7rem; font-weight: 600; color: var(--text-faint);
      text-transform: uppercase; letter-spacing: 0.04em;
      padding: 9px 0; border-bottom: 1px solid var(--surface-sunken);
      display: flex; align-items: center;
    }
    .detail-val {
      font-size: 0.85rem; font-weight: 500; color: var(--text);
      padding: 9px 0; border-bottom: 1px solid var(--surface-sunken);
      display: flex; align-items: center;
    }
    .fw-bold { font-weight: 800; }
  `]
})
export class HistoryDetailPanelComponent {
  @Input() item: TimelineItem | null = null;
  @Output() close = new EventEmitter<void>();

  @Input() getUserName: (id: number) => string = () => 'Unknown';

  protected fmtThb = fmtThb;
  protected fmtUsd = fmtUsd;
  protected fmtIdr = fmtIdr;
  protected fmtDateTime = fmtDateTime;
  protected asExpense = asExpense;
  protected asLoan = asLoan;
}
