import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { MockDataService } from '@core/services/mock-data.service';
import { Expense, Loan } from '@core/models';

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtThb(v: number): string {
  return '฿' + v.toLocaleString('en-US', { minimumFractionDigits: 2 });
}
function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d: string): string {
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─── Union type for timeline items ─────────────────────────────────────────
type TimelineItem =
  | { type: 'expense'; data: Expense; }
  | { type: 'repayment'; data: Loan; };

type FilterType = 'ALL' | 'EXPENSE' | 'REPAYMENT';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="history-wrap">

      <!-- ── Page header ──────────────────────────────────────────────── -->
      <header class="page-header">
        <div>
          <h1 class="page-title">History</h1>
          <p class="page-sub">All activity log</p>
        </div>
      </header>

      <!-- ── Filter bar ───────────────────────────────────────────────── -->
      <div class="filter-bar">
        <div class="filter-group">
          <label class="filter-label">Show</label>
          <select [(ngModel)]="filterType" class="filter-select">
            <option value="ALL">All Activity</option>
            <option value="EXPENSE">Expenses Only</option>
            <option value="REPAYMENT">Repayments Only</option>
          </select>
        </div>
        <div class="filter-summary">
          <span class="summary-text">
            Showing {{ filteredTimeline().length }} of {{ allTimeline().length }} entries
          </span>
        </div>
      </div>

      <!-- ── Timeline / Table ─────────────────────────────────────────── -->
      <div class="table-card">
        <table class="history-table" *ngIf="filteredTimeline().length > 0; else emptyState">
          <thead>
            <tr>
              <th style="width: 50px;"></th>
              <th>Description</th>
              <th style="width: 160px;">Date / Time</th>
              <th style="width: 120px;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredTimeline()" class="timeline-row">
              <!-- Icon -->
              <td class="cell-icon">
                <span class="item-icon">{{ item.type === 'expense' ? '📋' : '💰' }}</span>
              </td>

              <!-- Description -->
              <td class="cell-desc">
                <ng-container *ngIf="item.type === 'expense'; else repaymentDesc">
                  <span class="desc-main">
                    Expense: {{ $any(item.data).toko }} - {{ fmtThb($any(item.data).amount) }}
                  </span>
                  <span class="desc-sub">
                    by {{ getUserName($any(item.data).recorderId) }}
                  </span>
                </ng-container>
                <ng-template #repaymentDesc>
                  <span class="desc-main">
                    Repayment: {{ fmtThb($any(item.data).actualRepaid) }}
                  </span>
                  <span class="desc-sub">
                    recorded by {{ getUserName($any(item.data).lenderId) }} on loan #{{ item.data.id }}
                  </span>
                </ng-template>
              </td>

              <!-- Date/Time -->
              <td class="cell-date">
                {{ fmtDateTime(item.data.createdAt!) }}
              </td>

              <!-- Status badge -->
              <td class="cell-status">
                <app-status-badge *ngIf="item.type === 'expense'" [status]="item.data.status"></app-status-badge>
                <app-status-badge *ngIf="item.type === 'repayment'" [status]="item.data.status"></app-status-badge>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #emptyState>
          <div class="empty-state">
            <span class="empty-icon">📋</span>
            <span class="empty-text">No activity found</span>
          </div>
        </ng-template>
      </div>

    </div>
  `,
  styles: [`
    .history-wrap {
      padding: 24px;
      max-width: 1200px;
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
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 16px;
      gap: 16px;
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
    .filter-select {
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      background: var(--surface-card);
      min-width: 160px;
      cursor: pointer;
    }
    .filter-select:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px var(--accent-primary-subtle);
    }
    .filter-summary {
      display: flex;
      align-items: center;
    }
    .summary-text {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* ── Table card ── */
    .table-card {
      background: var(--surface-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .history-table {
      width: 100%;
      border-collapse: collapse;
    }
    .history-table thead tr {
      background: var(--bg-tertiary);
    }
    .history-table thead th {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    .history-table tbody tr {
      border-bottom: 1px solid var(--border-subtle);
      transition: background 0.15s;
    }
    .history-table tbody tr:last-child {
      border-bottom: none;
    }
    .history-table tbody tr:hover {
      background: var(--bg-tertiary);
    }
    .history-table tbody td {
      padding: 12px 16px;
      vertical-align: middle;
    }

    /* ── Cells ── */
    .cell-icon {
      text-align: center;
    }
    .item-icon {
      font-size: 1.2rem;
    }
    .cell-desc {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .desc-main {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .desc-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .cell-date {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .cell-status {
      text-align: left;
    }

    /* ── Empty state ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      gap: 12px;
    }
    .empty-icon {
      font-size: 2.5rem;
    }
    .empty-text {
      font-size: 0.9rem;
      color: var(--text-muted);
    }
  `]
})
export class HistoryComponent {
  private readonly mockData = inject(MockDataService);

  filterType: FilterType = 'ALL';

  // Build combined timeline sorted by date (newest first)
  protected readonly allTimeline = computed<TimelineItem[]>(() => {
    const expenses: TimelineItem[] = this.mockData.expenses().map(e => ({
      type: 'expense' as const,
      data: e
    }));
    const repayments: TimelineItem[] = this.mockData.loans()
      .filter(l => (l as any).actualRepaid > 0)
      .map(l => ({
        type: 'repayment' as const,
        data: l
      }));

    return [...expenses, ...repayments].sort((a, b) =>
      new Date(b.data.createdAt!).getTime() - new Date(a.data.createdAt!).getTime()
    );
  });

  readonly filteredTimeline = computed(() => {
    if (this.filterType === 'ALL') return this.allTimeline();
    if (this.filterType === 'EXPENSE') {
      return this.allTimeline().filter(i => i.type === 'expense');
    }
    return this.allTimeline().filter(i => i.type === 'repayment');
  });

  fmtThb = fmtThb;
  fmtDate = fmtDate;
  fmtDateTime = fmtDateTime;

  getUserName(userId: number): string {
    return this.mockData.getUserById(userId)?.name ?? 'Unknown';
  }
}
