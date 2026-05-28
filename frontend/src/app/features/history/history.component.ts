import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { MockDataService } from '@core/services/mock-data.service';
import { fmtThb, fmtUsd, fmtIdr, fmtDate, fmtDateTime } from '@core/utils/currency.utils';
import { Expense, Loan } from '@core/models';

// Narrow expense from timeline item
function asExpense(data: Expense | Loan): Expense { return data as Expense; }
function asLoan(data: Expense | Loan): Loan { return data as Loan; }

function fmtTime(d: string): string {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function dayKey(d: string): string {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
}
function fmtDayLabel(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

type TimelineItem =
  | { type: 'expense'; data: Expense; }
  | { type: 'repayment'; data: Loan; };

type FilterType = 'ALL' | 'EXPENSE' | 'REPAYMENT';

interface DateGroup {
  dateKey: string;
  dateLabel: string;
  items: TimelineItem[];
  totalAmount: number;
  count: number;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadgeComponent,
    AvatarComponent,
  ],
  template: `
    <div class="history-wrap">

      <!-- ── Page header ──────────────────────────────────────────────── -->
      <header class="page-header">
        <div>
          <h1 class="page-title">History</h1>
          <p class="page-sub">Activity log — all expenses and repayments</p>
        </div>
      </header>

      <!-- ── Summary banner ──────────────────────────────────────────── -->
      <div class="summary-banner">
        <div class="banner-item">
          <span class="banner-label">Total Entries</span>
          <span class="banner-value">{{ allTimeline().length }}</span>
        </div>
        <div class="banner-divider"></div>
        <div class="banner-item">
          <span class="banner-label">Expenses Total</span>
          <div class="banner-multi">
            <span class="banner-value expense-color">{{ fmtThb(totalExpenseAmount()) }}</span>
            <span class="banner-sub">{{ fmtUsd(totalExpenseAmount()) }} · {{ fmtIdr(totalExpenseAmount()) }}</span>
          </div>
        </div>
        <div class="banner-divider"></div>
        <div class="banner-item">
          <span class="banner-label">Repayments Total</span>
          <div class="banner-multi">
            <span class="banner-value repayment-color">{{ fmtThb(totalRepaymentAmount()) }}</span>
            <span class="banner-sub">{{ fmtUsd(totalRepaymentAmount()) }}</span>
          </div>
        </div>
      </div>

      <!-- ── Filter chips ─────────────────────────────────────────────── -->
      <div class="filter-bar">
        <div class="filter-chips">
          <button
            class="filter-chip"
            [class.active]="filterType() === 'ALL'"
            (click)="filterType.set('ALL')">
            ALL
            <span class="chip-count">{{ allTimeline().length }}</span>
          </button>
          <button
            class="filter-chip"
            [class.active]="filterType() === 'EXPENSE'"
            (click)="filterType.set('EXPENSE')">
            💰 Expenses
          </button>
          <button
            class="filter-chip"
            [class.active]="filterType() === 'REPAYMENT'"
            (click)="filterType.set('REPAYMENT')">
            ↩️ Repayments
          </button>
        </div>
        <span class="filter-count">{{ filteredTimeline().length }} entries</span>
      </div>

      <!-- ── Timeline ─────────────────────────────────────────────────── -->
      @if (groupedTimeline().length > 0) {
        <div class="timeline">
          @for (group of groupedTimeline(); track group.dateKey) {

            <!-- Day separator -->
            <div class="date-separator">
              <div class="date-line"></div>
              <div class="date-label-wrap">
                <span class="date-label">{{ group.dateLabel }}</span>
                <span class="date-meta">· {{ group.count }} {{ group.count === 1 ? 'entry' : 'entries' }} · {{ fmtThb(group.totalAmount) }} ({{ fmtUsd(group.totalAmount) }})</span>
              </div>
              <div class="date-line"></div>
            </div>

            @for (item of group.items; track item.data.id) {
              <div class="timeline-item" (click)="selectedItem.set(item)">

                <!-- Left icon + connector -->
                <div class="timeline-icon-col">
                  <div class="timeline-icon-ring"
                    [class.expense-ring]="item.type === 'expense'"
                    [class.repayment-ring]="item.type === 'repayment'">
                    <span>{{ item.type === 'expense' ? '💰' : '↩️' }}</span>
                  </div>
                  <div class="timeline-connector"></div>
                </div>

                <!-- Card -->
                <div class="timeline-card"
                  [class.expense-card]="item.type === 'expense'"
                  [class.repayment-card]="item.type === 'repayment'">

                  <!-- Header: type badge + status + time -->
                  <div class="card-header">
                    <div class="header-left">
                      <span class="type-badge"
                        [class.type-expense]="item.type === 'expense'"
                        [class.type-repayment]="item.type === 'repayment'">
                        {{ item.type === 'expense' ? '💰 EXPENSE' : '↩️ REPAYMENT' }}
                      </span>
                      <app-status-badge [status]="item.data.status"></app-status-badge>
                    </div>
                    <div class="header-right">
                      <span class="card-time">{{ fmtTime(item.data.createdAt!) }}</span>
                      <span class="card-chevron">›</span>
                    </div>
                  </div>

                  <!-- Body -->
                  @if (item.type === 'expense') {
                    <div class="card-body">
                      <div class="body-main">
                        <span class="store-name">{{ asExpense(item.data).toko }}</span>
                        <span class="item-desc">{{ asExpense(item.data).description }}</span>
                      </div>
                      <div class="amount-col">
                        <span class="amount expense-amount">{{ fmtThb(asExpense(item.data).amount) }}</span>
                        <span class="amount-sub">{{ fmtUsd(asExpense(item.data).amount) }}</span>
                      </div>
                    </div>
                    <!-- Footer tags -->
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
                      <span class="tag" [class.shared-yes]="asExpense(item.data).shared" [class.shared-no]="!asExpense(item.data).shared">
                        Shared: {{ asExpense(item.data).shared ? 'Yes' : 'No' }}
                      </span>
                    </div>
                  } @else {
                    <div class="card-body">
                      <div class="body-main">
                        <span class="store-name">Loan #{{ item.data.id }}</span>
                        <span class="item-desc">{{ getUserName(asLoan(item.data).borrowerId ?? 0) }} → {{ getUserName(asLoan(item.data).lenderId ?? 0) }}</span>
                      </div>
                      <div class="amount-col">
                        <span class="amount repayment-amount">{{ fmtThb(asLoan(item.data).actualRepaid ?? 0) }}</span>
                        <span class="amount-sub">{{ fmtUsd(asLoan(item.data).actualRepaid ?? 0) }}</span>
                      </div>
                    </div>
                    <div class="card-tags">
                      <span class="tag">Remaining after: {{ fmtThb(asLoan(item.data).remainingBalance ?? 0) }} ({{ fmtUsd(asLoan(item.data).remainingBalance ?? 0) }})</span>
                    </div>
                  }

                  <div class="card-footer">
                    <span class="view-link">View details →</span>
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
          <span class="empty-icon">📋</span>
          <span class="empty-title">No activity found</span>
          <span class="empty-sub">Try adjusting the filter above.</span>
        </div>
      }

      <!-- ── Detail panel backdrop ──────────────────────────────────── -->
      @if (selectedItem()) {
        <div class="panel-backdrop" (click)="selectedItem.set(null)"></div>
        <div class="detail-panel">
          <div class="panel-header">
            <button class="panel-close-btn" (click)="selectedItem.set(null)">
              <span>←</span>
              <span>Close</span>
            </button>
            <span class="panel-title">
              {{ selectedItem()!.type === 'expense' ? 'Expense Detail' : 'Repayment Detail' }}
            </span>
          </div>

          @if (selectedItem()!.type === 'expense') {
            <div class="panel-hero expense-hero">
              <div class="panel-hero-top">
                <span class="panel-hero-store">{{ asExpense(selectedItem()!.data).toko }}</span>
                <app-status-badge [status]="selectedItem()!.data.status"></app-status-badge>
              </div>
              <div class="panel-hero-amount">{{ fmtThb(asExpense(selectedItem()!.data).amount) }}</div>
              <div class="panel-hero-currencies">
                <span class="currency-pill">{{ fmtUsd(asExpense(selectedItem()!.data).amount) }}</span>
                <span class="currency-pill">{{ fmtIdr(asExpense(selectedItem()!.data).amount) }}</span>
              </div>
              <div class="panel-hero-desc">{{ asExpense(selectedItem()!.data).description }}</div>
            </div>
            <div class="panel-detail-grid">
              <span class="detail-key">Category</span>
              <span class="detail-val">{{ asExpense(selectedItem()!.data).category ?? '—' }}</span>

              <span class="detail-key">Date</span>
              <span class="detail-val">{{ asExpense(selectedItem()!.data).expenseDate }}</span>

              <span class="detail-key">Recorded by</span>
              <span class="detail-val">{{ getUserName(asExpense(selectedItem()!.data).recorderId ?? 0) }}</span>

              <span class="detail-key">Source</span>
              <span class="detail-val">{{ asExpense(selectedItem()!.data).source ?? '—' }}</span>

              <span class="detail-key">Shared</span>
              <span class="detail-val">{{ asExpense(selectedItem()!.data).shared ? 'Yes' : 'No' }}</span>

              <span class="detail-key">Status</span>
              <span class="detail-val"><app-status-badge [status]="selectedItem()!.data.status"></app-status-badge></span>

              <span class="detail-key">Created</span>
              <span class="detail-val">{{ fmtDateTime(selectedItem()!.data.createdAt!) }}</span>

              <span class="detail-key">THB</span>
              <span class="detail-val fw-bold">{{ fmtThb(asExpense(selectedItem()!.data).amount) }}</span>

              <span class="detail-key">USD</span>
              <span class="detail-val">{{ fmtUsd(asExpense(selectedItem()!.data).amount) }}</span>

              <span class="detail-key">IDR</span>
              <span class="detail-val">{{ fmtIdr(asExpense(selectedItem()!.data).amount) }}</span>
            </div>
          } @else {
            <div class="panel-hero repayment-hero">
              <div class="panel-hero-top">
                <span class="panel-hero-store">Loan #{{ selectedItem()!.data.id }}</span>
                <app-status-badge [status]="selectedItem()!.data.status"></app-status-badge>
              </div>
              <div class="panel-hero-amount repayment-amount">{{ fmtThb(asLoan(selectedItem()!.data).actualRepaid ?? 0) }}</div>
              <div class="panel-hero-currencies">
                <span class="currency-pill currency-green">{{ fmtUsd(asLoan(selectedItem()!.data).actualRepaid ?? 0) }}</span>
              </div>
              <div class="panel-hero-desc">
                {{ getUserName(asLoan(selectedItem()!.data).borrowerId ?? 0) }} → {{ getUserName(asLoan(selectedItem()!.data).lenderId ?? 0) }}
              </div>
            </div>
            <div class="panel-detail-grid">
              <span class="detail-key">Lender</span>
              <span class="detail-val">{{ getUserName(asLoan(selectedItem()!.data).lenderId ?? 0) }}</span>

              <span class="detail-key">Borrower</span>
              <span class="detail-val">{{ getUserName(asLoan(selectedItem()!.data).borrowerId ?? 0) }}</span>

              <span class="detail-key">Repaid</span>
              <span class="detail-val success-text">{{ fmtThb(asLoan(selectedItem()!.data).actualRepaid ?? 0) }}</span>

              <span class="detail-key">Repaid USD</span>
              <span class="detail-val success-text">{{ fmtUsd(asLoan(selectedItem()!.data).actualRepaid ?? 0) }}</span>

              <span class="detail-key">Remaining</span>
              <span class="detail-val danger-text">{{ fmtThb(asLoan(selectedItem()!.data).remainingBalance ?? 0) }}</span>

              <span class="detail-key">Status</span>
              <span class="detail-val"><app-status-badge [status]="selectedItem()!.data.status"></app-status-badge></span>

              <span class="detail-key">Created</span>
              <span class="detail-val">{{ fmtDateTime(selectedItem()!.data.createdAt!) }}</span>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .history-wrap {
      padding: 16px;
      max-width: 780px;
      margin: 0 auto;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* ── Header ── */
    .page-header { margin-bottom: 20px; }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 2px;
    }
    .page-sub { font-size: 0.78rem; color: #64748b; margin: 0; }

    /* ── Summary banner ── */
    .summary-banner {
      display: flex;
      align-items: stretch;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      margin-bottom: 16px;
      overflow: hidden;
    }
    .banner-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 14px 12px;
    }
    .banner-label {
      font-size: 0.62rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .banner-multi {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
    }
    .banner-value {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
    }
    .banner-sub {
      font-size: 0.65rem;
      color: #94a3b8;
      font-weight: 500;
    }
    .banner-divider { width: 1px; background: #e2e8f0; flex-shrink: 0; }
    .expense-color   { color: #1d4ed8; }
    .repayment-color { color: #059669; }

    /* ── Filter bar ── */
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 12px;
      flex-wrap: wrap;
    }
    .filter-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 7px 14px;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
      letter-spacing: 0.02em;
    }
    .filter-chip:hover { border-color: #94a3b8; color: #0f172a; }
    .filter-chip.active {
      background: #1d4ed8;
      border-color: #1d4ed8;
      color: #ffffff;
    }
    .chip-count {
      background: rgba(255,255,255,0.28);
      border-radius: 999px;
      font-size: 0.62rem;
      font-weight: 700;
      padding: 1px 7px;
    }
    .filter-chip:not(.active) .chip-count {
      background: #f1f5f9;
      color: #64748b;
    }
    .filter-count { font-size: 0.75rem; color: #94a3b8; white-space: nowrap; }

    /* ── Timeline ── */
    .timeline { display: flex; flex-direction: column; }

    /* Day separator */
    .date-separator {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 24px 0 12px;
    }
    .date-separator:first-child { margin-top: 0; }
    .date-line { flex: 1; height: 1px; background: #e2e8f0; }
    .date-label-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
      white-space: nowrap;
      flex-wrap: wrap;
      justify-content: center;
    }
    .date-label {
      font-size: 0.73rem;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
    }
    .date-meta { font-size: 0.67rem; color: #94a3b8; white-space: nowrap; }

    /* Timeline row */
    .timeline-item {
      display: flex;
      gap: 0;
      margin-bottom: 10px;
      cursor: pointer;
    }

    /* Left icon column */
    .timeline-icon-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 50px;
      flex-shrink: 0;
    }
    .timeline-icon-ring {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      flex-shrink: 0;
      border: 2px solid transparent;
    }
    .expense-ring   { background: #eff6ff; border-color: #bfdbfe; }
    .repayment-ring { background: #f0fdf4; border-color: #bbf7d0; }
    .timeline-connector {
      flex: 1;
      width: 2px;
      background: #f1f5f9;
      margin: 4px 0 0;
      min-height: 12px;
    }

    /* Card */
    .timeline-card {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      padding: 12px 14px;
      margin-left: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: box-shadow 0.15s, transform 0.1s;
    }
    .timeline-card:hover {
      box-shadow: 0 3px 14px rgba(0,0,0,0.09);
      transform: translateY(-1px);
    }
    .expense-card   { border-left: 3px solid #bfdbfe; }
    .repayment-card { border-left: 3px solid #bbf7d0; }

    /* Card header */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left { display: flex; align-items: center; gap: 8px; }
    .header-right { display: flex; align-items: center; gap: 6px; }
    .type-badge {
      font-size: 0.58rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      padding: 3px 9px;
      border-radius: 999px;
    }
    .type-expense   { background: #eff6ff; color: #1d4ed8; }
    .type-repayment { background: #f0fdf4; color: #059669; }
    .card-time  { font-size: 0.7rem; color: #94a3b8; }
    .card-chevron {
      font-size: 1.1rem;
      color: #cbd5e1;
      font-weight: 300;
      line-height: 1;
    }

    /* Card body */
    .card-body {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }
    .body-main {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      overflow: hidden;
    }
    .store-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-desc {
      font-size: 0.78rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .amount-col {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      flex-shrink: 0;
    }
    .amount {
      font-size: 1rem;
      font-weight: 800;
      white-space: nowrap;
    }
    .amount-sub {
      font-size: 0.68rem;
      color: #94a3b8;
      font-weight: 500;
    }
    .expense-amount   { color: #1d4ed8; }
    .repayment-amount { color: #059669; }

    /* Tags */
    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .tag {
      font-size: 0.65rem;
      font-weight: 500;
      color: #64748b;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      padding: 2px 8px;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .avatar-tag { gap: 5px; }
    .category-tag { background: #fefce8; border-color: #fde68a; color: #92400e; }
    .shared-yes { background: #f0fdf4; border-color: #bbf7d0; color: #059669; }
    .shared-no  { background: #f8fafc; border-color: #e2e8f0; color: #94a3b8; }

    /* Card footer */
    .card-footer { display: flex; justify-content: flex-end; }
    .view-link { font-size: 0.72rem; font-weight: 600; color: #2563eb; }

    /* Timeline end */
    .timeline-end {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 0 8px;
    }
    .end-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #e2e8f0;
    }
    .end-label {
      font-size: 0.7rem;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* ── Empty state ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 56px 24px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      gap: 8px;
      text-align: center;
    }
    .empty-icon  { font-size: 2.8rem; margin-bottom: 4px; }
    .empty-title { font-size: 1rem; font-weight: 700; color: #0f172a; }
    .empty-sub   { font-size: 0.85rem; color: #64748b; }

    /* ── Slide-out detail panel ── */
    .panel-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.35);
      z-index: 200;
      backdrop-filter: blur(1px);
    }
    .detail-panel {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: min(440px, 100vw);
      background: #ffffff;
      z-index: 201;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      box-shadow: -4px 0 28px rgba(0,0,0,0.13);
      animation: panelSlideIn 0.25s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes panelSlideIn {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      position: sticky;
      top: 0;
      background: #ffffff;
      z-index: 1;
    }
    .panel-close-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      cursor: pointer;
      color: #64748b;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 4px 0;
      transition: color 0.15s;
    }
    .panel-close-btn:hover { color: #0f172a; }
    .panel-title { font-size: 0.88rem; font-weight: 700; color: #0f172a; }

    .panel-hero {
      padding: 20px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .expense-hero   { background: linear-gradient(135deg,#eff6ff 0%,#f8fafc 100%); }
    .repayment-hero { background: linear-gradient(135deg,#f0fdf4 0%,#f8fafc 100%); }
    .panel-hero-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .panel-hero-store { font-size: 0.85rem; font-weight: 600; color: #64748b; }
    .panel-hero-amount {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
    }
    .panel-hero-currencies {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .currency-pill {
      font-size: 0.72rem;
      font-weight: 600;
      background: rgba(37,99,235,0.08);
      color: #1d4ed8;
      padding: 2px 10px;
      border-radius: 999px;
      border: 1px solid rgba(37,99,235,0.15);
    }
    .currency-green {
      background: rgba(5,150,105,0.08);
      color: #059669;
      border-color: rgba(5,150,105,0.15);
    }
    .panel-hero-desc { font-size: 0.82rem; color: #64748b; }

    .panel-detail-grid {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 0;
      padding: 16px 20px;
    }
    .detail-key {
      font-size: 0.72rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 9px 0;
      border-bottom: 1px solid #f8fafc;
      display: flex;
      align-items: center;
    }
    .detail-val {
      font-size: 0.85rem;
      font-weight: 600;
      color: #0f172a;
      padding: 9px 0;
      border-bottom: 1px solid #f8fafc;
      display: flex;
      align-items: center;
    }
    .fw-bold { font-weight: 800; }
    .success-text { color: #059669; }
    .danger-text  { color: #ef4444; }

    /* ── Responsive ── */
    @media (min-width: 560px) {
      .history-wrap { padding: 24px; }
    }
    @media (max-width: 400px) {
      .timeline-icon-col { width: 40px; }
      .timeline-icon-ring { width: 32px; height: 32px; font-size: 0.8rem; }
      .timeline-card { padding: 10px 11px; margin-left: 8px; }
      .date-meta { display: none; }
    }
  `]
})
export class HistoryComponent {
  private readonly mockData = inject(MockDataService);

  filterType = signal<FilterType>('ALL');
  selectedItem = signal<TimelineItem | null>(null);

  readonly asExpense = asExpense;
  readonly asLoan = asLoan;

  // Expose utility functions to template
  fmtThb = fmtThb;
  fmtUsd = fmtUsd;
  fmtIdr = fmtIdr;
  fmtDate = fmtDate;
  fmtDateTime = fmtDateTime;
  fmtTime = fmtTime;

  readonly allTimeline = computed<TimelineItem[]>(() => {
    const expenses: TimelineItem[] = this.mockData.expenses().map(e => ({
      type: 'expense' as const,
      data: e
    }));
    const repayments: TimelineItem[] = this.mockData.loans()
      .filter(l => (l.actualRepaid ?? 0) > 0)
      .map(l => ({
        type: 'repayment' as const,
        data: l
      }));
    return [...expenses, ...repayments].sort((a, b) =>
      new Date(b.data.createdAt!).getTime() - new Date(a.data.createdAt!).getTime()
    );
  });

  readonly filteredTimeline = computed(() => {
    const ft = this.filterType();
    if (ft === 'ALL') return this.allTimeline();
    if (ft === 'EXPENSE') return this.allTimeline().filter(i => i.type === 'expense');
    return this.allTimeline().filter(i => i.type === 'repayment');
  });

  readonly groupedTimeline = computed<DateGroup[]>(() => {
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
          count: 0
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

  readonly totalExpenseAmount = computed(() =>
    this.allTimeline()
      .filter(i => i.type === 'expense')
      .reduce((sum, i) => sum + asExpense(i.data).amount, 0)
  );

  readonly totalRepaymentAmount = computed(() =>
    this.allTimeline()
      .filter(i => i.type === 'repayment')
      .reduce((sum, i) => sum + (asLoan(i.data).actualRepaid ?? 0), 0)
  );

  getUserName(userId: number): string {
    return this.mockData.getUserById(userId)?.name ?? 'Unknown';
  }
}
