import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { Expense } from '@core/models';
import { fmtThb, fmtUsd, fmtIdr, fmtDate } from '@core/utils/currency.utils';
import { categoryStyle } from '@core/utils/category-style';

@Component({
  selector: 'app-expense-detail-panel',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, AvatarComponent],
  template: `
    @if (expense; as exp) {
      <div class="dp-backdrop" (click)="close.emit()"></div>
      <aside class="dp-panel" role="dialog" aria-label="Detail Pengeluaran">

        <!-- ── Header band ─────────────────────────────────────── -->
        <header class="dp-head">
          <span class="dp-head-icon" [class]="'tone-' + catStyle(exp.category).tone">
            <i class="pi" [class]="catStyle(exp.category).icon"></i>
          </span>
          <div class="dp-head-text">
            <h3 class="dp-head-title">{{ exp.description }}</h3>
            <p class="dp-head-sub">
              @if (exp.toko) {
                <i class="pi pi-shop"></i><span>{{ exp.toko }}</span>
              } @else {
                <span class="dp-head-id">Pengeluaran #{{ exp.id }}</span>
              }
            </p>
          </div>
          <button type="button" class="dp-close" (click)="close.emit()" aria-label="Tutup">
            <i class="pi pi-times"></i>
          </button>
        </header>

        <!-- ── Body ────────────────────────────────────────────── -->
        <div class="dp-body">

          <!-- Amount hero -->
          <section class="dp-amount">
            <span class="dp-amount-label">Jumlah <span class="dp-cur-tag">THB</span></span>
            <span class="dp-amount-thb num">{{ fmtThb(exp.amount) }}</span>
            <div class="dp-amount-fx">
              <span class="dp-fx-pill tone-success num">≈ {{ fmtUsd(exp.amount) }}</span>
              <span class="dp-fx-pill tone-accent num">≈ {{ fmtIdr(exp.amount) }}</span>
            </div>
          </section>

          <!-- Status + Type chips -->
          <section class="dp-chips">
            <div class="dp-chip-cell">
              <span class="dp-chip-label">Status</span>
              <app-status-badge [status]="exp.status"></app-status-badge>
            </div>
            <div class="dp-chip-cell">
              <span class="dp-chip-label">Tipe</span>
              <span class="dp-type-pill" [class.is-official]="(exp.type ?? 'PERSONAL') === 'OFFICIAL'">
                {{ (exp.type ?? 'PERSONAL') === 'OFFICIAL' ? 'Resmi' : 'Pribadi' }}
              </span>
            </div>
          </section>

          <!-- Detail rows -->
          <section class="dp-rows">
            <div class="dp-row">
              <span class="dp-row-lbl"><i class="pi pi-calendar"></i> Tanggal</span>
              <span class="dp-row-val">{{ fmtDate(exp.expenseDate) }}</span>
            </div>
            <div class="dp-row">
              <span class="dp-row-lbl"><i class="pi pi-tag"></i> Kategori</span>
              <span class="dp-cat-chip" [class]="'tone-' + catStyle(exp.category).tone">
                <i class="pi" [class]="catStyle(exp.category).icon"></i>
                <span>{{ exp.category }}</span>
              </span>
            </div>
            <div class="dp-row">
              <span class="dp-row-lbl"><i class="pi pi-wallet"></i> Sumber Dana</span>
              <span class="dp-row-val">{{ exp.source || '—' }}</span>
            </div>
            <div class="dp-row">
              <span class="dp-row-lbl"><i class="pi pi-users"></i> Dibagi tim</span>
              @if (exp.shared) {
                <span class="dp-flag is-on"><i class="pi pi-check-circle"></i> Ya</span>
              } @else {
                <span class="dp-flag">Tidak</span>
              }
            </div>
            @if (exp.userName) {
              <div class="dp-row">
                <span class="dp-row-lbl"><i class="pi pi-user"></i> Pemilik</span>
                <span class="dp-user">
                  <app-avatar [name]="exp.userName" size="sm" />
                  <span class="dp-user-name">{{ exp.userName }}</span>
                </span>
              </div>
            }
            @if (exp.approvedByName) {
              <div class="dp-row">
                <span class="dp-row-lbl"><i class="pi pi-verified"></i> Disetujui oleh</span>
                <span class="dp-user">
                  <app-avatar [name]="exp.approvedByName" size="sm" />
                  <span class="dp-user-name">{{ exp.approvedByName }}</span>
                </span>
              </div>
            }
          </section>

          <!-- Notes -->
          @if (exp.notes) {
            <section class="dp-notes">
              <span class="dp-notes-label"><i class="pi pi-align-left"></i> Catatan</span>
              <p class="dp-notes-text">{{ exp.notes }}</p>
            </section>
          }
        </div>

        <!-- ── Footer ──────────────────────────────────────────── -->
        <footer class="dp-foot">
          <button type="button" class="dp-btn dp-btn-ghost" (click)="close.emit()">
            <i class="pi pi-times"></i> Tutup
          </button>
          <button type="button" class="dp-btn dp-btn-del" (click)="del.emit(exp)">
            <i class="pi pi-trash"></i> Hapus
          </button>
          <button type="button" class="dp-btn dp-btn-edit" (click)="edit.emit(exp)">
            <i class="pi pi-pencil"></i> Edit
          </button>
        </footer>
      </aside>
    }
  `,
  styles: [`
    /* ── Backdrop + panel shell (slide-over) ─────────────────── */
    .dp-backdrop {
      position: fixed; inset: 0; z-index: 150;
      background: rgba(15,23,42,0.45);
      backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
      animation: dp-fade 0.18s ease both;
    }
    .dp-panel {
      position: fixed; top: 0; right: 0; bottom: 0; z-index: 151;
      width: 460px; max-width: 100vw;
      display: flex; flex-direction: column; overflow: hidden;
      background: var(--surface);
      border-left: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
      animation: dp-slide 0.26s cubic-bezier(0.32,0.72,0,1) both;
    }
    @keyframes dp-fade  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes dp-slide { from { transform: translateX(100%); } to { transform: translateX(0); } }

    /* ── Header band ─────────────────────────────────────────── */
    .dp-head {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 22px; flex-shrink: 0;
      background: linear-gradient(180deg, var(--surface-muted) 0%, var(--surface) 100%);
      border-bottom: 1px solid var(--border);
    }
    .dp-head-icon {
      flex-shrink: 0; width: 46px; height: 46px;
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: var(--radius); font-size: 1.2rem;
    }
    .dp-head-text  { flex: 1; min-width: 0; }
    .dp-head-title {
      margin: 0; font-size: 1.05rem; font-weight: 800; color: var(--text);
      letter-spacing: -0.02em; line-height: 1.3;
      overflow: hidden; text-overflow: ellipsis;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    }
    .dp-head-sub {
      margin: 4px 0 0; font-size: 0.76rem; color: var(--text-subtle);
      display: inline-flex; align-items: center; gap: 6px; line-height: 1.3;
    }
    .dp-head-sub .pi { font-size: 0.72rem; }
    .dp-head-id { font-family: var(--font-mono); }
    .dp-close {
      flex-shrink: 0; width: 32px; height: 32px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--surface);
      color: var(--text-faint); cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .dp-close:hover { background: var(--danger-soft); color: var(--danger); border-color: transparent; }

    /* ── Body ────────────────────────────────────────────────── */
    .dp-body {
      flex: 1; overflow-y: auto;
      display: flex; flex-direction: column; gap: 20px;
      padding: 22px;
    }

    /* Amount hero */
    .dp-amount {
      display: flex; flex-direction: column; gap: 8px;
      padding: 18px 20px;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .dp-amount-label {
      display: inline-flex; align-items: center; gap: 7px;
      font-size: 0.72rem; font-weight: 700; color: var(--text-muted);
      letter-spacing: 0.01em; text-transform: uppercase;
    }
    .dp-cur-tag {
      font-size: 0.58rem; font-weight: 800; letter-spacing: 0.05em;
      padding: 1px 6px; border-radius: 999px;
      background: var(--accent-soft); color: var(--accent);
    }
    .dp-amount-thb {
      font-size: 1.9rem; font-weight: 800; color: var(--text);
      letter-spacing: -0.02em; line-height: 1;
    }
    .dp-amount-fx { display: flex; gap: 8px; flex-wrap: wrap; }
    .dp-fx-pill {
      padding: 4px 11px; border-radius: 999px;
      font-size: 0.74rem; font-weight: 700;
    }

    /* Status + type chips row */
    .dp-chips { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .dp-chip-cell {
      display: flex; flex-direction: column; gap: 7px; align-items: flex-start;
      padding: 14px 16px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .dp-chip-label {
      font-size: 0.7rem; font-weight: 700; color: var(--text-faint);
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .dp-type-pill {
      display: inline-block; padding: 3px 11px; border-radius: 999px;
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.02em;
      background: var(--surface-sunken); color: var(--text-subtle);
    }
    .dp-type-pill.is-official { background: var(--accent-soft); color: var(--accent); }

    /* Detail rows */
    .dp-rows {
      display: flex; flex-direction: column;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); overflow: hidden;
    }
    .dp-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 12px 16px;
      border-bottom: 1px solid var(--surface-sunken);
    }
    .dp-row:last-child { border-bottom: none; }
    .dp-row-lbl {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 0.78rem; font-weight: 600; color: var(--text-subtle);
      flex-shrink: 0;
    }
    .dp-row-lbl .pi { font-size: 0.78rem; color: var(--text-faint); }
    .dp-row-val {
      font-size: 0.84rem; font-weight: 600; color: var(--text);
      text-align: right; min-width: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .dp-cat-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 11px; border-radius: 999px;
      font-size: 0.72rem; font-weight: 700;
    }
    .dp-cat-chip .pi { font-size: 0.7rem; }

    .dp-flag { font-size: 0.84rem; font-weight: 600; color: var(--text-subtle); }
    .dp-flag.is-on {
      display: inline-flex; align-items: center; gap: 6px;
      color: var(--success); font-weight: 700;
    }
    .dp-flag.is-on .pi { font-size: 0.8rem; }

    .dp-user { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
    .dp-user-name {
      font-size: 0.84rem; font-weight: 600; color: var(--text);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    /* Notes */
    .dp-notes {
      display: flex; flex-direction: column; gap: 8px;
      padding: 16px;
      background: var(--surface-muted); border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .dp-notes-label {
      display: inline-flex; align-items: center; gap: 7px;
      font-size: 0.72rem; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .dp-notes-label .pi { font-size: 0.72rem; color: var(--text-faint); }
    .dp-notes-text {
      margin: 0; font-size: 0.84rem; color: var(--text-muted);
      line-height: 1.5; white-space: pre-wrap; word-break: break-word;
    }

    /* ── Footer ──────────────────────────────────────────────── */
    .dp-foot {
      display: flex; align-items: center; gap: 10px;
      padding: 16px 22px; flex-shrink: 0;
      background: var(--surface-muted);
      border-top: 1px solid var(--border);
    }
    .dp-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      padding: 10px 16px; border-radius: var(--radius);
      font-size: 0.85rem; font-weight: 600; font-family: inherit;
      cursor: pointer; border: 1px solid transparent;
      transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
    }
    .dp-btn .pi { font-size: 0.82rem; }
    .dp-btn-ghost {
      background: transparent; color: var(--text-muted); border-color: var(--border);
    }
    .dp-btn-ghost:hover { background: var(--surface-sunken); color: var(--text); border-color: var(--border-strong); }
    .dp-btn-del {
      background: var(--danger-soft); color: var(--danger); border-color: transparent;
    }
    .dp-btn-del:hover { background: var(--danger); color: #fff; }
    .dp-btn-edit {
      margin-left: auto;
      background: var(--accent); color: #fff; border-color: var(--accent);
      box-shadow: 0 4px 12px var(--accent-soft);
    }
    .dp-btn-edit:hover { background: var(--accent-hover); border-color: var(--accent-hover); box-shadow: var(--shadow-md); }

    @media (max-width: 520px) {
      .dp-chips { grid-template-columns: 1fr; }
      .dp-foot { flex-wrap: wrap; }
      .dp-btn { flex: 1; }
      .dp-btn-edit { margin-left: 0; }
    }
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
