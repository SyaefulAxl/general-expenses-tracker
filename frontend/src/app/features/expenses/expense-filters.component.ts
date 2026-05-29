import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { EXPENSE_CATEGORIES } from '@core/models';
import { fmtThb, fmtUsd, fmtIdr } from '@core/utils/currency.utils';

export interface ExpenseFilters {
  search: string;
  category: string;
  status: string;
  type: string;
}

interface Opt { label: string; value: string; }

const CATEGORIES: Opt[] = [
  { label: 'Semua Kategori', value: 'ALL' },
  ...EXPENSE_CATEGORIES.map(c => ({ label: c, value: c })),
];
const STATUSES: Opt[] = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Draf',         value: 'DRAFT' },
  { label: 'Menunggu',     value: 'PENDING' },
  { label: 'Disetujui',    value: 'APPROVED' },
  { label: 'Ditolak',      value: 'REJECTED' },
];
const TYPES: Opt[] = [
  { label: 'Semua Tipe', value: 'ALL' },
  { label: 'Pribadi',    value: 'PERSONAL' },
  { label: 'Resmi',      value: 'OFFICIAL' },
];

@Component({
  selector: 'app-expense-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, IconFieldModule, InputIconModule, InputTextModule],
  template: `
    <!-- ── KPI stat tiles ──────────────────────────────────── -->
    <div class="kpi-grid">
      <div class="kpi-tile">
        <div class="kpi-top">
          <span class="kpi-label">Total Pengeluaran</span>
          <span class="kpi-badge tone-accent"><i class="pi pi-wallet"></i></span>
        </div>
        <div class="kpi-value num">{{ fmtThb(totalAmount) }}</div>
        <div class="kpi-fx num">{{ fmtUsd(totalAmount) }} · {{ fmtIdr(totalAmount) }}</div>
      </div>

      <div class="kpi-tile">
        <div class="kpi-top">
          <span class="kpi-label">Menunggu Persetujuan</span>
          <span class="kpi-badge tone-warning"><i class="pi pi-clock"></i></span>
        </div>
        <div class="kpi-value num text-warning">{{ pendingAmount > 0 ? fmtThb(pendingAmount) : '—' }}</div>
        <div class="kpi-fx num">{{ pendingAmount > 0 ? fmtUsd(pendingAmount) : '' }}</div>
      </div>

      <div class="kpi-tile">
        <div class="kpi-top">
          <span class="kpi-label">Disetujui / Lunas</span>
          <span class="kpi-badge tone-success"><i class="pi pi-check-circle"></i></span>
        </div>
        <div class="kpi-value num text-success">{{ fmtThb(approvedAmount) }}</div>
        <div class="kpi-fx num">{{ fmtUsd(approvedAmount) }}</div>
      </div>
    </div>

    <!-- ── Filter card ─────────────────────────────────────── -->
    <div class="filter-card">
      <div class="filter-search">
        <label class="field-label">Cari</label>
        <p-iconfield iconPosition="left">
          <p-inputicon styleClass="pi pi-search" />
          <input
            type="text"
            pInputText
            class="search-input"
            placeholder="Cari deskripsi, toko, kategori…"
            [(ngModel)]="search"
            (ngModelChange)="emitChange()" />
        </p-iconfield>
      </div>

      <div class="filter-field">
        <label class="field-label">Kategori</label>
        <p-select
          [options]="catOptions"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="category"
          (onChange)="emitChange()"
          appendTo="body"
          styleClass="filter-select" />
      </div>

      <div class="filter-field">
        <label class="field-label">Status</label>
        <p-select
          [options]="statusOptions"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="status"
          (onChange)="emitChange()"
          appendTo="body"
          styleClass="filter-select" />
      </div>

      <div class="filter-field">
        <label class="field-label">Tipe</label>
        <p-select
          [options]="typeOptions"
          optionLabel="label"
          optionValue="value"
          [(ngModel)]="type"
          (onChange)="emitChange()"
          appendTo="body"
          styleClass="filter-select" />
      </div>
    </div>
  `,
  styles: [`
    /* ── KPI stat tiles ──────────────────────────────────────── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }
    .kpi-tile {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .kpi-tile:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
    .kpi-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .kpi-label {
      font-size: 0.76rem; font-weight: 700; color: var(--text-muted);
      letter-spacing: 0.01em;
    }
    .kpi-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    }
    .kpi-badge i { font-size: 0.84rem; }
    .kpi-value {
      font-size: 1.5rem; font-weight: 800; color: var(--text);
      line-height: 1.1; letter-spacing: -0.02em;
      font-family: var(--font-mono); font-variant-numeric: tabular-nums;
    }
    .kpi-fx {
      font-size: 0.72rem; color: var(--text-faint); min-height: 1em;
      font-family: var(--font-mono); font-variant-numeric: tabular-nums;
    }

    /* ── Filter card ─────────────────────────────────────────── */
    .filter-card {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 16px;
      align-items: end;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      padding: 20px 24px;
      margin-bottom: 20px;
    }
    .filter-search,
    .filter-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
    .field-label {
      font-size: 0.76rem; font-weight: 700; color: var(--text-muted);
      letter-spacing: 0.01em;
    }

    /* Layout-only: make controls fill their grid cell. Skin comes from the global theme. */
    .search-input { width: 100%; }
    :host ::ng-deep .filter-select { width: 100%; }
    :host ::ng-deep .p-iconfield { width: 100%; display: block; }
    :host ::ng-deep .p-iconfield .p-inputtext { width: 100%; }

    /* ── Responsive ──────────────────────────────────────────── */
    @media (max-width: 1100px) {
      .filter-card { grid-template-columns: 1fr 1fr; }
      .filter-search { grid-column: 1 / -1; }
    }
    @media (max-width: 900px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .filter-card { grid-template-columns: 1fr; }
    }
  `]
})
export class ExpenseFiltersComponent {
  @Input() search = '';
  @Input() category = 'ALL';
  @Input() status = 'ALL';
  @Input() type = 'ALL';
  @Input() totalAmount = 0;
  @Input() pendingAmount = 0;
  @Input() approvedAmount = 0;

  @Output() filtersChange = new EventEmitter<ExpenseFilters>();

  protected catOptions    = CATEGORIES;
  protected statusOptions = STATUSES;
  protected typeOptions   = TYPES;
  protected fmtThb = fmtThb;
  protected fmtUsd = fmtUsd;
  protected fmtIdr = fmtIdr;

  emitChange(): void {
    this.filtersChange.emit({
      search: this.search,
      category: this.category,
      status: this.status,
      type: this.type,
    });
  }
}
