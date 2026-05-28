import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { fmtThb, fmtUsd, fmtIdr } from '@core/utils/currency.utils';
import { DateGroup, TimelineItem, asExpense, asLoan, fmtTime } from './history-types';
import { Expense } from '@core/models';

@Component({
  selector: 'app-history-timeline',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, AvatarComponent],
  template: `
    @if (groups.length > 0) {
      <div class="timeline">
        @for (group of groups; track group.dateKey) {
          <div class="date-separator">
            <div class="date-line"></div>
            <div class="date-label-wrap">
              <span class="date-label">{{ group.dateLabel }}</span>
              <span class="date-meta">
                · <span class="num">{{ group.count }}</span> {{ group.count === 1 ? 'entry' : 'entries' }}
                · <span class="num">{{ fmtThb(group.totalAmount) }}</span>
                (<span class="num">{{ fmtUsd(group.totalAmount) }}</span>)
              </span>
            </div>
            <div class="date-line"></div>
          </div>

          @for (item of group.items; track item.data.id) {
            <div class="timeline-item" (click)="select.emit(item)">
              <div class="timeline-icon-col">
                <div class="timeline-icon-ring"
                  [class.expense-ring]="item.type === 'expense'"
                  [class.repayment-ring]="item.type === 'repayment'">
                  <i class="pi" [class.pi-wallet]="item.type === 'expense'" [class.pi-replay]="item.type === 'repayment'"></i>
                </div>
                <div class="timeline-connector"></div>
              </div>

              <div class="timeline-card"
                [class.expense-card]="item.type === 'expense'"
                [class.repayment-card]="item.type === 'repayment'">
                <div class="card-header">
                  <div class="header-left">
                    <span class="type-badge"
                      [class.type-expense]="item.type === 'expense'"
                      [class.type-repayment]="item.type === 'repayment'">
                      {{ item.type === 'expense' ? 'Expense' : 'Repayment' }}
                    </span>
                    <app-status-badge [status]="item.data.status"></app-status-badge>
                  </div>
                  <div class="header-right">
                    <span class="card-time num">{{ fmtTime(item.data.createdAt!) }}</span>
                    <i class="pi pi-chevron-right card-chevron"></i>
                  </div>
                </div>

                @if (item.type === 'expense') {
                  <div class="card-body">
                    <div class="body-main">
                      <span class="store-name">{{ asExpense(item.data).toko || '—' }}</span>
                      <span class="item-desc">{{ asExpense(item.data).description }}</span>
                    </div>
                    <div class="amount-col">
                      <span class="amount num text-accent">{{ fmtThb(asExpense(item.data).amount) }}</span>
                      <span class="amount-sub num">{{ fmtUsd(asExpense(item.data).amount) }}</span>
                    </div>
                  </div>
                  <div class="card-tags">
                    @if (asExpense(item.data).category) {
                      <span class="tag category-tag">{{ asExpense(item.data).category }}</span>
                    }
                    <span class="tag avatar-tag">
                      <app-avatar [name]="getUserName(asExpense(item.data).recorderId ?? 0)" [size]="'xs'"></app-avatar>
                      {{ getUserName(asExpense(item.data).recorderId ?? 0) }}
                    </span>
                    @if (asExpense(item.data).source) {
                      <span class="tag">Source: {{ asExpense(item.data).source }}</span>
                    }
                    <span class="tag" [class.shared-yes]="asExpense(item.data).shared">
                      Shared: {{ asExpense(item.data).shared ? 'Yes' : 'No' }}
                    </span>
                  </div>
                } @else {
                  <div class="card-body">
                    <div class="body-main">
                      <span class="store-name">Loan #<span class="num">{{ item.data.id }}</span></span>
                      <span class="item-desc">
                        {{ getUserName(asLoan(item.data).borrowerId ?? 0) }}
                        → {{ getUserName(asLoan(item.data).lenderId ?? 0) }}
                      </span>
                    </div>
                    <div class="amount-col">
                      <span class="amount num text-success">{{ fmtThb(asLoan(item.data).actualRepaid ?? 0) }}</span>
                      <span class="amount-sub num">{{ fmtUsd(asLoan(item.data).actualRepaid ?? 0) }}</span>
                    </div>
                  </div>
                  <div class="card-tags">
                    <span class="tag">
                      Remaining after:
                      <span class="num">{{ fmtThb(asLoan(item.data).remainingBalance ?? 0) }}</span>
                    </span>
                  </div>
                }

                <div class="card-footer">
                  <span class="view-link">View details <i class="pi pi-arrow-right"></i></span>
                </div>
              </div>
            </div>
          }
        }
        <div class="timeline-end">
          <div class="end-dot"></div>
          <span class="end-label">End of history</span>
        </div>
      </div>
    } @else {
      <div class="empty-state">
        <i class="pi pi-inbox empty-icon"></i>
        <span class="empty-title">No activity found</span>
        <span class="empty-sub">Try adjusting the filter above.</span>
      </div>
    }
  `,
  styles: [`
    .timeline { display: flex; flex-direction: column; }
    .date-separator {
      display: flex; align-items: center; gap: 10px;
      margin: 24px 0 12px;
    }
    .date-separator:first-child { margin-top: 0; }
    .date-line { flex: 1; height: 1px; background: var(--border); }
    .date-label-wrap {
      display: flex; align-items: center; gap: 6px;
      flex-shrink: 0; white-space: nowrap;
      flex-wrap: wrap; justify-content: center;
    }
    .date-label { font-size: 0.73rem; font-weight: 700; color: var(--text); }
    .date-meta  { font-size: 0.67rem; color: var(--text-faint); }

    .timeline-item { display: flex; gap: 0; margin-bottom: 10px; cursor: pointer; }
    .timeline-icon-col { display: flex; flex-direction: column; align-items: center; width: 50px; flex-shrink: 0; }
    .timeline-icon-ring {
      width: 38px; height: 38px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; border: 2px solid;
      background: var(--surface);
      transition: transform 0.15s;
    }
    .expense-ring   { border-color: var(--accent);  color: var(--accent); }
    .repayment-ring { border-color: var(--success); color: var(--success); }
    .timeline-item:hover .timeline-icon-ring { transform: scale(1.08); }
    .timeline-connector {
      width: 2px; flex: 1; min-height: 16px;
      background: var(--border); margin-top: 4px;
    }

    .timeline-card {
      flex: 1;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px 14px;
      margin-left: 12px;
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .expense-card   { border-left: 3px solid var(--accent); }
    .repayment-card { border-left: 3px solid var(--success); }
    .timeline-item:hover .timeline-card { box-shadow: var(--shadow); transform: translateY(-1px); }

    .card-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px;
    }
    .header-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .header-right { display: flex; align-items: center; gap: 8px; color: var(--text-faint); }
    .card-time { font-size: 0.72rem; }
    .card-chevron { font-size: 0.7rem; }
    .type-badge {
      font-size: 0.62rem; font-weight: 700;
      padding: 2px 8px; border-radius: 999px;
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .type-expense   { background: var(--accent-soft);  color: var(--accent); }
    .type-repayment { background: var(--success-soft); color: var(--success); }

    .card-body { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 6px; }
    .body-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .store-name { font-size: 0.92rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
    .item-desc  { font-size: 0.78rem; color: var(--text-subtle); }
    .amount-col { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
    .amount     { font-size: 1.05rem; font-weight: 700; letter-spacing: -0.01em; }
    .amount-sub { font-size: 0.7rem; color: var(--text-faint); margin-top: 1px; }

    .card-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
    .tag {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.68rem; font-weight: 500; color: var(--text-subtle);
      padding: 3px 8px; background: var(--surface-muted);
      border: 1px solid var(--surface-sunken); border-radius: 4px;
    }
    .category-tag { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-soft); }
    .avatar-tag   { padding: 2px 8px 2px 4px; }
    .shared-yes   { background: var(--success-soft); color: var(--success); border-color: var(--success-soft); }

    .card-footer {
      padding-top: 8px; margin-top: 6px;
      border-top: 1px solid var(--surface-sunken);
      text-align: right;
    }
    .view-link {
      font-size: 0.72rem; font-weight: 600; color: var(--accent);
      display: inline-flex; align-items: center; gap: 4px;
    }
    .view-link i { font-size: 0.7rem; }

    .timeline-end { display: flex; align-items: center; gap: 8px; margin: 24px 0 8px; justify-content: center; }
    .end-dot { width: 6px; height: 6px; background: var(--border); border-radius: 50%; }
    .end-label { font-size: 0.7rem; color: var(--text-faint); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 60px 24px; gap: 8px;
    }
    .empty-icon  { font-size: 2.5rem; color: var(--text-faint); }
    .empty-title { font-size: 0.95rem; font-weight: 700; color: var(--text-muted); }
    .empty-sub   { font-size: 0.78rem; color: var(--text-faint); }
  `]
})
export class HistoryTimelineComponent {
  @Input() groups: DateGroup[] = [];
  @Output() select = new EventEmitter<TimelineItem>();

  @Input() getUserName: (id: number) => string = () => 'Unknown';

  protected fmtThb = fmtThb;
  protected fmtUsd = fmtUsd;
  protected fmtIdr = fmtIdr;
  protected fmtTime = fmtTime;
  protected asExpense = asExpense;
  protected asLoan = asLoan;
}
