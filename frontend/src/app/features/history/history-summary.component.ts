import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { fmtThb, fmtUsd, fmtIdr } from '@core/utils/currency.utils';

@Component({
  selector: 'app-history-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary-banner">
      <div class="banner-item">
        <span class="banner-label">Total entries</span>
        <span class="banner-value num">{{ totalCount }}</span>
      </div>
      <div class="banner-divider"></div>
      <div class="banner-item">
        <span class="banner-label">Expenses total</span>
        <div class="banner-multi">
          <span class="banner-value num text-accent">{{ fmtThb(totalExpense) }}</span>
          <span class="banner-sub num">{{ fmtUsd(totalExpense) }} · {{ fmtIdr(totalExpense) }}</span>
        </div>
      </div>
      <div class="banner-divider"></div>
      <div class="banner-item">
        <span class="banner-label">Repayments total</span>
        <div class="banner-multi">
          <span class="banner-value num text-success">{{ fmtThb(totalRepayment) }}</span>
          <span class="banner-sub num">{{ fmtUsd(totalRepayment) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .summary-banner {
      display: flex; align-items: stretch;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
      margin-bottom: 16px;
      overflow: hidden;
    }
    .banner-item {
      flex: 1;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 4px; padding: 14px 12px;
    }
    .banner-label {
      font-size: 0.62rem; font-weight: 700;
      color: var(--text-faint);
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .banner-multi { display: flex; flex-direction: column; align-items: center; gap: 1px; }
    .banner-value { font-size: 1rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
    .banner-sub   { font-size: 0.65rem; color: var(--text-faint); font-weight: 500; }
    .banner-divider { width: 1px; background: var(--border); flex-shrink: 0; }

    @media (max-width: 540px) {
      .summary-banner { flex-direction: column; }
      .banner-divider { width: 100%; height: 1px; }
    }
  `]
})
export class HistorySummaryComponent {
  @Input() totalCount = 0;
  @Input() totalExpense = 0;
  @Input() totalRepayment = 0;

  protected fmtThb = fmtThb;
  protected fmtUsd = fmtUsd;
  protected fmtIdr = fmtIdr;
}
