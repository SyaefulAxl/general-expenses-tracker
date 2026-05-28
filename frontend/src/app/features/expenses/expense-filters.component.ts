import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { fmtThb, fmtUsd, fmtIdr } from '@core/utils/currency.utils';

export interface ExpenseFilters {
  search: string;
  category: string;
  status: string;
}

const CATEGORIES = ['Transport', 'Food', 'Accommodation', 'Entertainment', 'Other'];
const STATUSES   = ['PENDING', 'APPROVED', 'REJECTED', 'DRAFT'];

@Component({
  selector: 'app-expense-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filters-bar">
      <div class="search-wrap">
        <i class="pi pi-search search-icon"></i>
        <input
          class="search-input"
          type="text"
          placeholder="Search description, store…"
          [(ngModel)]="search"
          (ngModelChange)="emitChange()" />
      </div>
      <div class="filter-pills">
        @for (cat of catOptions; track cat) {
          <button
            type="button"
            class="filter-pill"
            [class.active]="category === cat"
            (click)="setCategory(cat)">
            {{ cat }}
          </button>
        }
      </div>
      <div class="filter-pills">
        @for (st of statusOptions; track st) {
          <button
            type="button"
            class="filter-pill"
            [class.active]="status === st"
            (click)="setStatus(st)">
            {{ st }}
          </button>
        }
      </div>
    </div>

    <div class="summary-strip">
      <div class="summary-chip">
        <span class="summary-label">Total</span>
        <span class="summary-val num">{{ fmtThb(totalAmount) }}</span>
        <span class="summary-sub num">{{ fmtUsd(totalAmount) }} · {{ fmtIdr(totalAmount) }}</span>
      </div>
      <div class="summary-chip chip-amber">
        <span class="summary-label">Pending</span>
        <span class="summary-val num text-warning">{{ pendingAmount > 0 ? fmtThb(pendingAmount) : '—' }}</span>
      </div>
      <div class="summary-chip chip-green">
        <span class="summary-label">Approved</span>
        <span class="summary-val num text-success">{{ fmtThb(approvedAmount) }}</span>
      </div>
    </div>
  `,
  styles: [`
    .filters-bar {
      display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
      margin-bottom: 16px; padding: 12px 16px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); box-shadow: var(--shadow-sm);
    }
    .search-wrap { position: relative; flex: 1; min-width: 220px; }
    .search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: var(--text-faint); font-size: 0.85rem;
    }
    .search-input {
      width: 100%; padding: 9px 12px 9px 36px;
      border: 1px solid var(--border); border-radius: var(--radius-sm);
      font-size: 0.85rem; outline: none; font-family: inherit;
      background: var(--surface-muted); color: var(--text);
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .search-input::placeholder { color: var(--text-faint); }
    .search-input:focus { border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }

    .filter-pills { display: flex; gap: 4px; flex-wrap: wrap; }
    .filter-pill {
      padding: 5px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 600;
      border: 1px solid var(--border); background: var(--surface); color: var(--text-subtle);
      cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
      font-family: inherit;
    }
    .filter-pill:hover { color: var(--text); background: var(--surface-muted); }
    .filter-pill.active {
      background: var(--accent); color: #fff; border-color: var(--accent);
    }

    .summary-strip {
      display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
    }
    .summary-chip {
      flex: 1; min-width: 180px;
      padding: 12px 16px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); box-shadow: var(--shadow-sm);
      display: flex; flex-direction: column; gap: 2px;
    }
    .summary-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-subtle); }
    .summary-val   { font-size: 1.15rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
    .summary-sub   { font-size: 0.7rem; color: var(--text-faint); }
    .chip-amber { border-left: 3px solid var(--warning); }
    .chip-green { border-left: 3px solid var(--success); }
  `]
})
export class ExpenseFiltersComponent {
  @Input() search = '';
  @Input() category = 'ALL';
  @Input() status = 'ALL';
  @Input() totalAmount = 0;
  @Input() pendingAmount = 0;
  @Input() approvedAmount = 0;

  @Output() filtersChange = new EventEmitter<ExpenseFilters>();

  protected catOptions    = ['ALL', ...CATEGORIES];
  protected statusOptions = ['ALL', ...STATUSES];
  protected fmtThb = fmtThb;
  protected fmtUsd = fmtUsd;
  protected fmtIdr = fmtIdr;

  setCategory(v: string): void {
    this.category = v;
    this.emitChange();
  }

  setStatus(v: string): void {
    this.status = v;
    this.emitChange();
  }

  emitChange(): void {
    this.filtersChange.emit({
      search: this.search,
      category: this.category,
      status: this.status,
    });
  }
}
