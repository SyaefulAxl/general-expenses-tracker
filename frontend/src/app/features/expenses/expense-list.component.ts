import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { Expense } from '@core/models';
import { fmtThb, fmtUsd, fmtDate } from '@core/utils/currency.utils';
import { categoryStyle } from '@core/utils/category-style';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, TableModule, TooltipModule, StatusBadgeComponent, EmptyStateComponent],
  template: `
    <div class="list-card">
      @if (expenses.length === 0) {
        <div class="list-empty">
          <app-empty-state
            icon="📭"
            title="Tidak ada pengeluaran"
            subtitle="Ubah filter atau tambah pengeluaran baru" />
        </div>
      } @else {
        <p-table
          [value]="expenses"
          [paginator]="false"
          [scrollable]="true"
          dataKey="id"
          styleClass="exp-table"
          responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th class="th-cat">Kategori</th>
              <th class="th-desc">Deskripsi</th>
              <th class="th-type">Tipe</th>
              <th class="th-amount">Jumlah</th>
              <th class="th-date">Tanggal</th>
              <th class="th-status">Status</th>
              <th class="th-actions" pFrozenColumn alignFrozen="right">Aksi</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-exp>
            <tr class="exp-row" (click)="select.emit(exp)">
              <td>
                <div class="cat-cell">
                  <span class="cat-icon" [class]="'tone-' + catStyle(exp.category).tone">
                    <i class="pi" [class]="catStyle(exp.category).icon"></i>
                  </span>
                  <span class="cat-name">{{ exp.category }}</span>
                </div>
              </td>

              <td>
                <div class="desc-cell">
                  <span class="desc-main">{{ exp.description }}</span>
                  <span class="desc-sub">
                    @if (exp.toko) { <span class="desc-toko">{{ exp.toko }}</span> }
                    @if (exp.shared) { <span class="shared-chip">Shared</span> }
                  </span>
                </div>
              </td>

              <td>
                <span class="type-pill" [class.type-official]="(exp.type ?? 'PERSONAL') === 'OFFICIAL'">
                  {{ (exp.type ?? 'PERSONAL') === 'OFFICIAL' ? 'Resmi' : 'Pribadi' }}
                </span>
              </td>

              <td class="td-amount">
                <span class="amt-main num">{{ fmtThb(exp.amount) }}</span>
                <span class="amt-sub num">{{ fmtUsd(exp.amount) }}</span>
              </td>

              <td>
                <span class="date-cell">{{ fmtDate(exp.expenseDate) }}</span>
              </td>

              <td>
                <app-status-badge [status]="exp.status"></app-status-badge>
              </td>

              <td class="td-actions" pFrozenColumn alignFrozen="right" (click)="$event.stopPropagation()">
                <div class="action-row">
                  @if (exp.status === 'DRAFT' || exp.status === 'REJECTED') {
                    <button type="button" class="act-btn act-submit" (click)="submit.emit(exp)"
                            pTooltip="Ajukan untuk persetujuan" tooltipPosition="top">
                      <i class="pi pi-send"></i>
                    </button>
                  }
                  @if (isAdmin && exp.status === 'PENDING') {
                    <button type="button" class="act-btn act-ok" (click)="approve.emit(exp)"
                            pTooltip="Setujui / Lunas" tooltipPosition="top">
                      <i class="pi pi-check"></i>
                    </button>
                    <button type="button" class="act-btn act-rej" (click)="reject.emit(exp)"
                            pTooltip="Tolak" tooltipPosition="top">
                      <i class="pi pi-times"></i>
                    </button>
                  }
                  <button type="button" class="act-btn act-edit" (click)="edit.emit(exp)"
                          pTooltip="Edit" tooltipPosition="top">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button type="button" class="act-btn act-del" (click)="del.emit(exp)"
                          pTooltip="Hapus" tooltipPosition="top">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>

        <div class="list-footer">
          <span class="page-info">
            Halaman <span class="num">{{ page + 1 }}</span> / <span class="num">{{ totalPages }}</span>
          </span>
          <div class="page-nav">
            <button type="button" class="page-btn" [disabled]="page === 0" (click)="prev.emit()">
              <i class="pi pi-chevron-left"></i>
              <span>Sebelumnya</span>
            </button>
            <button type="button" class="page-btn" [disabled]="page >= totalPages - 1" (click)="next.emit()">
              <span>Berikutnya</span>
              <i class="pi pi-chevron-right"></i>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* ── Card shell (Sakai surface) ──────────────────────────── */
    .list-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .list-empty { padding: 24px; }

    /* ── Cell: Kategori (icon tone + name) ───────────────────── */
    .cat-cell { display: inline-flex; align-items: center; gap: 10px; }
    .cat-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    }
    .cat-icon i { font-size: 0.84rem; }
    .cat-name { font-size: 0.84rem; font-weight: 600; color: var(--text); white-space: nowrap; }

    /* ── Cell: Deskripsi (+ toko sub-text / shared) ──────────── */
    .desc-cell { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .desc-main { font-size: 0.86rem; font-weight: 600; color: var(--text); line-height: 1.3; }
    .desc-sub { display: inline-flex; align-items: center; gap: 8px; min-height: 0; }
    .desc-toko { font-size: 0.72rem; color: var(--text-subtle); }
    .shared-chip {
      display: inline-block; padding: 1px 8px; border-radius: 999px;
      background: var(--accent-soft); color: var(--accent);
      font-size: 0.62rem; font-weight: 700; letter-spacing: 0.02em;
    }

    /* ── Cell: Tipe pill ─────────────────────────────────────── */
    .type-pill {
      display: inline-block; padding: 3px 11px; border-radius: 999px;
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.02em;
      background: var(--surface-sunken); color: var(--text-subtle);
    }
    .type-pill.type-official { background: var(--accent-soft); color: var(--accent); }

    /* ── Cell: Jumlah (THB primary, ≈USD sub) ────────────────── */
    .td-amount { text-align: right; white-space: nowrap; }
    .amt-main {
      display: block; font-size: 0.9rem; font-weight: 700; color: var(--text);
      font-family: var(--font-mono); font-variant-numeric: tabular-nums;
    }
    .amt-sub {
      display: block; font-size: 0.68rem; color: var(--text-faint); margin-top: 2px;
      font-family: var(--font-mono); font-variant-numeric: tabular-nums;
    }

    /* ── Cell: Tanggal ───────────────────────────────────────── */
    .date-cell { font-size: 0.8rem; color: var(--text-subtle); white-space: nowrap; }

    /* ── Cell: Actions ───────────────────────────────────────── */
    .td-actions { background: var(--surface); }
    .action-row { display: flex; gap: 4px; justify-content: flex-end; }
    /* Subtle ghost icon buttons; soft-tinted fill on hover (no boxed/placeholder look). */
    .act-btn {
      width: 32px; height: 32px; border-radius: var(--radius-sm);
      border: none; background: transparent;
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; font-family: inherit; font-size: 0.82rem; color: var(--text-faint);
      transition: background 0.15s, color 0.15s;
    }
    .act-btn:hover { background: var(--surface-sunken); color: var(--text-muted); }
    .act-edit:hover,
    .act-submit:hover { background: var(--accent-soft);  color: var(--accent); }
    .act-ok:hover     { background: var(--success-soft); color: var(--success); }
    .act-rej:hover,
    .act-del:hover    { background: var(--danger-soft);  color: var(--danger); }

    /* ── Rows ────────────────────────────────────────────────── */
    .exp-row { cursor: pointer; }
    /* Keep the frozen actions cell in sync with the row hover tint. */
    .exp-row:hover .td-actions { background: var(--surface-muted); }

    /* ── Footer pagination (parent-driven) ───────────────────── */
    .list-footer {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; flex-wrap: wrap;
      padding: 12px 16px;
      border-top: 1px solid var(--border);
      background: var(--surface-muted);
    }
    .page-info { font-size: 0.78rem; color: var(--text-subtle); }
    .page-nav { display: flex; gap: 8px; }
    .page-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 13px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--surface);
      font-size: 0.78rem; font-weight: 600; color: var(--text-muted);
      cursor: pointer; font-family: inherit;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .page-btn:hover:not(:disabled) { background: var(--surface-muted); color: var(--accent); border-color: var(--accent); }
    .page-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    /* ── Column widths / header layout (layout only) ─────────── */
    :host ::ng-deep .exp-table table { min-width: 760px; }
    :host ::ng-deep .exp-table .th-amount,
    :host ::ng-deep .exp-table .td-amount { text-align: right; }
    :host ::ng-deep .exp-table .th-actions,
    :host ::ng-deep .exp-table .td-actions { text-align: right; width: 1%; white-space: nowrap; }
    :host ::ng-deep .exp-table .th-actions { background: var(--surface-muted); }
    :host ::ng-deep .exp-table .th-type,
    :host ::ng-deep .exp-table .th-date,
    :host ::ng-deep .exp-table .th-status { width: 1%; white-space: nowrap; }

    @media (max-width: 640px) {
      .list-footer { justify-content: center; }
      .page-info { order: 2; width: 100%; text-align: center; }
    }
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
  @Output() submit  = new EventEmitter<Expense>();
  @Output() prev    = new EventEmitter<void>();
  @Output() next    = new EventEmitter<void>();

  protected fmtThb = fmtThb;
  protected fmtUsd = fmtUsd;
  protected fmtDate = fmtDate;
  protected catStyle = categoryStyle;
}
