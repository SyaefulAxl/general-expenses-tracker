import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '@core/services/mock-data.service';
import { HistorySummaryComponent } from './history-summary.component';
import { HistoryFiltersComponent, HistoryFilter } from './history-filters.component';
import { HistoryTimelineComponent } from './history-timeline.component';
import { HistoryDetailPanelComponent } from './history-detail-panel.component';
import { TimelineItem, DateGroup, asExpense, asLoan, dayKey, fmtDayLabel } from './history-types';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    HistorySummaryComponent,
    HistoryFiltersComponent,
    HistoryTimelineComponent,
    HistoryDetailPanelComponent,
  ],
  template: `
    <div class="history-wrap">
      <header class="page-header">
        <div>
          <h1 class="page-title">History</h1>
          <p class="page-sub">Activity log — all expenses and repayments</p>
        </div>
      </header>

      <app-history-summary
        [totalCount]="allTimeline().length"
        [totalExpense]="totalExpenseAmount()"
        [totalRepayment]="totalRepaymentAmount()" />

      <app-history-filters
        [filter]="filterType()"
        [totalCount]="allTimeline().length"
        [filteredCount]="filteredTimeline().length"
        (filterChange)="filterType.set($event)" />

      <app-history-timeline
        [groups]="groupedTimeline()"
        [getUserName]="getUserName"
        (select)="selectedItem.set($event)" />
    </div>

    <app-history-detail-panel
      [item]="selectedItem()"
      [getUserName]="getUserName"
      (close)="selectedItem.set(null)" />
  `,
  styles: [`
    .history-wrap {
      padding: 16px;
      max-width: 780px;
      margin: 0 auto;
      min-height: 100vh;
    }
    .page-header { margin-bottom: 20px; }
    .page-title  { font-size: 1.5rem; font-weight: 800; color: var(--text); margin: 0 0 2px; letter-spacing: -0.02em; }
    .page-sub    { font-size: 0.78rem; color: var(--text-subtle); margin: 0; }
    @media (min-width: 560px) {
      .history-wrap { padding: 24px; }
    }
  `]
})
export class HistoryComponent {
  private readonly mockData = inject(MockDataService);

  protected filterType   = signal<HistoryFilter>('ALL');
  protected selectedItem = signal<TimelineItem | null>(null);

  protected readonly allTimeline = computed<TimelineItem[]>(() => {
    const expenses: TimelineItem[] = this.mockData.expenses().map(e => ({ type: 'expense' as const, data: e }));
    const repayments: TimelineItem[] = this.mockData.loans()
      .filter(l => (l.actualRepaid ?? 0) > 0)
      .map(l => ({ type: 'repayment' as const, data: l }));
    return [...expenses, ...repayments].sort((a, b) =>
      new Date(b.data.createdAt!).getTime() - new Date(a.data.createdAt!).getTime()
    );
  });

  protected readonly filteredTimeline = computed(() => {
    const ft = this.filterType();
    if (ft === 'ALL') return this.allTimeline();
    if (ft === 'EXPENSE') return this.allTimeline().filter(i => i.type === 'expense');
    return this.allTimeline().filter(i => i.type === 'repayment');
  });

  protected readonly groupedTimeline = computed<DateGroup[]>(() => {
    const items = this.filteredTimeline();
    const groups = new Map<string, DateGroup>();
    for (const item of items) {
      const key = dayKey(item.data.createdAt!);
      if (!groups.has(key)) {
        groups.set(key, {
          dateKey: key,
          dateLabel: fmtDayLabel(item.data.createdAt!),
          items: [],
          totalAmount: 0,
          count: 0,
        });
      }
      const group = groups.get(key)!;
      group.items.push(item);
      group.count += 1;
      if (item.type === 'expense') {
        group.totalAmount += asExpense(item.data).amount;
      }
    }
    return Array.from(groups.values());
  });

  protected readonly totalExpenseAmount = computed(() =>
    this.allTimeline().filter(i => i.type === 'expense').reduce((s, i) => s + asExpense(i.data).amount, 0)
  );

  protected readonly totalRepaymentAmount = computed(() =>
    this.allTimeline().filter(i => i.type === 'repayment').reduce((s, i) => s + (asLoan(i.data).actualRepaid ?? 0), 0)
  );

  protected readonly getUserName = (userId: number): string => {
    return this.mockData.getUserById(userId)?.name ?? 'Unknown';
  };
}
