import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type HistoryFilter = 'ALL' | 'EXPENSE' | 'REPAYMENT';

@Component({
  selector: 'app-history-filters',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="filter-bar">
      <div class="filter-chips">
        <button
          type="button"
          class="filter-chip"
          [class.active]="filter === 'ALL'"
          (click)="filterChange.emit('ALL')">
          <span>All</span>
          <span class="chip-count num">{{ totalCount }}</span>
        </button>
        <button
          type="button"
          class="filter-chip"
          [class.active]="filter === 'EXPENSE'"
          (click)="filterChange.emit('EXPENSE')">
          <i class="pi pi-wallet"></i>
          <span>Expenses</span>
        </button>
        <button
          type="button"
          class="filter-chip"
          [class.active]="filter === 'REPAYMENT'"
          (click)="filterChange.emit('REPAYMENT')">
          <i class="pi pi-replay"></i>
          <span>Repayments</span>
        </button>
      </div>
      <span class="filter-count"><span class="num">{{ filteredCount }}</span> entries</span>
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
    }
    .filter-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 999px;
      font-size: 0.75rem; font-weight: 600;
      color: var(--text-subtle);
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
      font-family: inherit;
    }
    .filter-chip:hover { background: var(--surface-muted); color: var(--text); }
    .filter-chip.active {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
    .chip-count {
      background: rgba(255,255,255,0.28);
      border-radius: 999px;
      font-size: 0.62rem; font-weight: 700;
      padding: 1px 7px;
    }
    .filter-chip:not(.active) .chip-count {
      background: var(--surface-sunken);
      color: var(--text-subtle);
    }
    .filter-count { font-size: 0.75rem; color: var(--text-faint); white-space: nowrap; }
  `]
})
export class HistoryFiltersComponent {
  @Input() filter: HistoryFilter = 'ALL';
  @Input() totalCount = 0;
  @Input() filteredCount = 0;

  @Output() filterChange = new EventEmitter<HistoryFilter>();
}
