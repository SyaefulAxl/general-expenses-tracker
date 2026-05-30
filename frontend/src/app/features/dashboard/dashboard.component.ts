import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models';
import { fmtThb, fmtUsd, fmtIdr, fmtDate, THB_TO_USD, THB_TO_IDR } from '@core/utils/currency.utils';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { ChartModule } from 'primeng/chart';

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const CATEGORY_ICONS: Record<string, string> = {
  'Travelling':    'pi-car',
  'Makan':         'pi-shopping-bag',
  'Grosir':        'pi-shopping-cart',
  'Belanja':       'pi-tags',
  'Entertainment': 'pi-ticket',
  'Lainnya':       'pi-box',
};

const CATEGORY_TONES: Record<string, Tone> = {
  'Travelling':    'accent',
  'Makan':         'warning',
  'Grosir':        'info',
  'Belanja':       'success',
  'Entertainment': 'danger',
  'Lainnya':       'neutral',
};

const TONE_HEX: Record<Tone, string> = {
  accent:  '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
  info:    '#06b6d4',
  neutral: '#94a3b8',
};

interface CategoryStat {
  name: string;
  total: number;
  count: number;
  pct: number;
  icon: string;
  tone: Tone;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, AvatarComponent, ChartModule],
  template: `
    <div class="dash">

      <!-- ── Page header ─────────────────────────────────────── -->
      <div class="dash-header">
        <div class="dash-header-left">
          <div class="trip-badge">🇹🇭 Thailand Trip · May 7–16, 2026</div>
          <h1 class="dash-title">Dashboard</h1>
          <p class="dash-subtitle">Selamat datang, <strong>{{ currentUser()?.name || 'User' }}</strong> — ringkasan keuangan Anda.</p>
        </div>
        <div class="dash-header-right">
          <div class="rate-bar">
            <span class="rate-label">Kurs hari ini</span>
            <span class="rate-pill tone-warning num">฿1</span>
            <span class="rate-eq">=</span>
            <span class="rate-pill tone-success num">\${{ rateUsd }}</span>
            <span class="rate-eq">=</span>
            <span class="rate-pill tone-accent num">Rp {{ rateIdrFmt }}</span>
          </div>
        </div>
      </div>

      <!-- ── KPI cards ────────────────────────────────────────── -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-accent">
          <div class="kpi-icon-wrap tone-accent"><i class="pi pi-wallet"></i></div>
          <div class="kpi-info">
            <div class="kpi-label">Total pengeluaran saya</div>
            <div class="kpi-val num">{{ fmtThb(myTotal()) }}</div>
            <div class="kpi-subs num">
              <span>{{ fmtUsd(myTotal()) }}</span>
              <span class="kpi-dot">·</span>
              <span>{{ fmtIdr(myTotal()) }}</span>
            </div>
          </div>
        </div>
        <div class="kpi-card kpi-success">
          <div class="kpi-icon-wrap tone-success"><i class="pi pi-users"></i></div>
          <div class="kpi-info">
            <div class="kpi-label">Total tim</div>
            <div class="kpi-val num text-success">{{ fmtThb(teamTotal()) }}</div>
            <div class="kpi-subs num">
              <span>{{ fmtUsd(teamTotal()) }}</span>
              <span class="kpi-dot">·</span>
              <span>{{ fmtIdr(teamTotal()) }}</span>
            </div>
          </div>
        </div>
        <div class="kpi-card kpi-info">
          <div class="kpi-icon-wrap tone-info"><i class="pi pi-list"></i></div>
          <div class="kpi-info">
            <div class="kpi-label">Pengeluaran saya</div>
            <div class="kpi-val num text-info">{{ myExpenses().length }}</div>
            <div class="kpi-subs"><span>transaksi</span></div>
          </div>
        </div>
        <div class="kpi-card" [class.kpi-warning]="pendingCount() > 0">
          <div class="kpi-icon-wrap" [class.tone-warning]="pendingCount() > 0" [class.tone-neutral]="pendingCount() === 0">
            <i class="pi pi-clock"></i>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Menunggu review</div>
            <div class="kpi-val num" [class.text-warning]="pendingCount() > 0">{{ pendingCount() }}</div>
            <div class="kpi-subs"><span>menunggu persetujuan</span></div>
          </div>
        </div>
      </div>

      <!-- ── Net Position Strip ─────────────────────────────────── -->
      <div class="net-strip" [class.net-positive]="netPosition() >= 0" [class.net-negative]="netPosition() < 0">
        <div class="net-strip-left">
          <div class="net-strip-label">Posisi bersih</div>
          <div class="net-strip-sub">Piutang dikurangi utang Anda</div>
        </div>
        <div class="net-strip-right">
          <div class="net-strip-val num" [class.num-pos]="netPosition() >= 0" [class.num-neg]="netPosition() < 0">
            {{ netPosition() >= 0 ? '+' : '' }}{{ fmtThb(netPosition()) }}
          </div>
          <div class="net-strip-fx num">
            {{ fmtUsd(netPosition()) }} · {{ fmtIdr(netPosition()) }}
          </div>
        </div>
      </div>

      <!-- ── Main content grid ──────────────────────────────────── -->
      <div class="dash-grid">

        <!-- Category Breakdown -->
        <div class="dash-card">
          <div class="dash-card-header">
            <span class="dash-card-title">Pengeluaran per kategori</span>
          </div>
          <div class="dash-card-body">
            @if (categoryStats().length === 0) {
              <div class="empty-msg">Belum ada pengeluaran</div>
            } @else {
              <div class="cat-chart">
                <p-chart type="doughnut" [data]="categoryChartData()" [options]="categoryChartOptions" [style]="{ height: '220px' }"></p-chart>
              </div>
            }
            @for (cat of categoryStats(); track cat.name) {
              <div class="cat-row">
                <div class="cat-left">
                  <div class="cat-icon-chip" [class]="'tone-' + cat.tone">
                    <i class="pi" [class]="cat.icon"></i>
                  </div>
                  <div class="cat-info">
                    <div class="cat-name">{{ cat.name }}</div>
                    <div class="cat-sub num">{{ fmtUsd(cat.total) }} · {{ fmtIdr(cat.total) }}</div>
                  </div>
                </div>
                <div class="cat-right">
                  <div class="cat-amount num">{{ fmtThb(cat.total) }}</div>
                  <div class="cat-bar-wrap">
                    <div class="cat-bar" [class]="'bg-' + cat.tone" [style.width.%]="cat.pct"></div>
                  </div>
                  <div class="cat-pct num">{{ cat.pct | number:'1.0-0' }}%</div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Recent Expenses -->
        <div class="dash-card">
          <div class="dash-card-header">
            <span class="dash-card-title">Pengeluaran terbaru</span>
            <span class="dash-card-badge">Last 5</span>
          </div>
          <div class="dash-card-body flush">
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (exp of recentExpenses(); track exp.id) {
                  <tr>
                    <td class="mini-date">{{ fmtDate(exp.expenseDate) }}</td>
                    <td>
                      <div class="mini-desc">{{ exp.description }}</div>
                      @if (exp.toko) {
                        <div class="mini-store">{{ exp.toko }}</div>
                      }
                    </td>
                    <td>
                      <div class="mini-amount num">{{ fmtThb(exp.amount) }}</div>
                      <div class="mini-fx num">{{ fmtUsd(exp.amount) }}</div>
                    </td>
                    <td><app-status-badge [status]="exp.status"></app-status-badge></td>
                  </tr>
                }
                @if (recentExpenses().length === 0) {
                  <tr><td colspan="4" class="empty-cell">No expenses recorded yet</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Team Comparison -->
        <div class="dash-card">
          <div class="dash-card-header">
            <span class="dash-card-title">Pengeluaran tim</span>
          </div>
          <div class="dash-card-body">
            <div class="team-list">
              @for (member of teamStats(); track member.user.id) {
                <div class="team-row" [class.team-row-me]="member.user.id === currentUser()?.id">
                  <app-avatar [name]="member.user.name"></app-avatar>
                  <div class="team-info">
                    <div class="team-name">
                      {{ member.user.name }}
                      @if (member.user.id === currentUser()?.id) {
                        <span class="you-chip">You</span>
                      }
                    </div>
                    <div class="team-bar-wrap">
                      <div class="team-bar" [style.width.%]="member.pct"></div>
                    </div>
                    <div class="team-amounts">
                      <span class="team-thb num">{{ fmtThb(member.total) }}</span>
                      <span class="team-fx num">{{ fmtUsd(member.total) }} · {{ fmtIdr(member.total) }}</span>
                    </div>
                  </div>
                  <div class="team-count"><span class="num">{{ member.count }}</span><small> exp</small></div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Loans Summary -->
        <div class="dash-card">
          <div class="dash-card-header">
            <span class="dash-card-title">Ringkasan pinjaman</span>
          </div>
          <div class="dash-card-body">
            <div class="loan-halves">
              <div class="loan-half loan-half-success">
                <div class="loan-half-label">Owed to me</div>
                <div class="loan-half-val num text-success">{{ fmtThb(owedToMe()) }}</div>
                <div class="loan-half-fx num">{{ fmtUsd(owedToMe()) }}</div>
                <div class="loan-half-fx num">{{ fmtIdr(owedToMe()) }}</div>
              </div>
              <div class="loan-half loan-half-danger">
                <div class="loan-half-label">I owe</div>
                <div class="loan-half-val num text-danger">{{ fmtThb(iOwe()) }}</div>
                <div class="loan-half-fx num">{{ fmtUsd(iOwe()) }}</div>
                <div class="loan-half-fx num">{{ fmtIdr(iOwe()) }}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* Page gutter (6rem top / 2rem sides) comes from the Sakai layout container;
       the page only centers its content. */
    .dash { max-width: 1400px; margin: 0 auto; }

    /* ── Header ──────────────────────────────────────────────── */
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .trip-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: var(--warning-soft);
      color: #92400e;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      margin-bottom: 8px;
      border: 1px solid var(--warning-soft);
    }
    .dash-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text);
      margin: 0 0 4px;
      letter-spacing: -0.02em;
    }
    .dash-subtitle { font-size: 0.85rem; color: var(--text-subtle); margin: 0; }

    .rate-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      flex-wrap: wrap;
      box-shadow: var(--shadow-sm);
    }
    .rate-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-right: 4px; }
    .rate-pill { padding: 3px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 600; }
    .rate-eq   { color: var(--text-faint); font-size: 0.85rem; }

    /* ── KPI Grid ────────────────────────────────────────────── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .kpi-grid { grid-template-columns: 1fr; } }

    .kpi-card {
      background: var(--surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      border-left: 3px solid var(--border);
      padding: 18px 20px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.18s, transform 0.18s;
    }
    .kpi-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
    .kpi-accent  { border-left-color: var(--accent); }
    .kpi-success { border-left-color: var(--success); }
    .kpi-info    { border-left-color: var(--info); }
    .kpi-warning { border-left-color: var(--warning); }

    .kpi-icon-wrap {
      width: 40px; height: 40px;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.05rem;
      flex-shrink: 0;
    }
    .kpi-info-block { flex: 1; min-width: 0; }
    .kpi-label { font-size: 0.68rem; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
    .kpi-val   { font-size: 1.5rem; font-weight: 700; color: var(--text); letter-spacing: -0.02em; line-height: 1; }
    .kpi-subs  { display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: var(--text-faint); margin-top: 6px; flex-wrap: wrap; }
    .kpi-dot   { color: var(--text-faint); }

    .kpi-info-block,
    .kpi-card .kpi-info { flex: 1; min-width: 0; }

    /* ── Net position strip ──────────────────────────────────── */
    .net-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-radius: var(--radius-lg);
      margin-bottom: 24px;
      border: 1px solid var(--border);
      border-left-width: 4px;
      background: var(--surface);
      box-shadow: var(--shadow-sm);
      flex-wrap: wrap;
      gap: 12px;
    }
    .net-positive { border-left-color: var(--success); }
    .net-negative { border-left-color: var(--danger); }
    .net-strip-left  { min-width: 0; }
    .net-strip-label { font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.07em; }
    .net-strip-sub   { font-size: 0.8rem; color: var(--text-subtle); margin-top: 4px; }
    .net-strip-right { text-align: right; min-width: 0; }
    .net-strip-val   { font-size: 1.8rem; font-weight: 700; letter-spacing: -0.02em; }
    .net-strip-fx    { font-size: 0.8rem; color: var(--text-subtle); margin-top: 2px; }
    @media (max-width: 640px) {
      .net-strip { align-items: stretch; }
      .net-strip-right { text-align: left; }
    }

    /* ── Main grid ───────────────────────────────────────────── */
    .dash-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 900px) { .dash-grid { grid-template-columns: 1fr; } }

    /* ── Card ────────────────────────────────────────────────── */
    .dash-card {
      background: var(--surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .dash-card-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--surface-sunken);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .dash-card-title { font-size: 0.82rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
    .dash-card-badge {
      padding: 2px 8px; border-radius: 999px;
      background: var(--surface-sunken); color: var(--text-subtle);
      font-size: 0.65rem; font-weight: 700;
    }
    .dash-card-body { padding: 18px; }
    /* Flush body holds the recent-expenses table; let it scroll horizontally
       on narrow screens instead of forcing the card to overflow. */
    .dash-card-body.flush { padding: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .mini-table { min-width: 360px; }

    /* ── Category rows ───────────────────────────────────────── */
    .cat-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--surface-sunken);
    }
    .cat-row:last-child { border-bottom: none; }
    .cat-left  { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
    .cat-icon-chip {
      width: 34px; height: 34px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.95rem; flex-shrink: 0;
    }
    .cat-info { min-width: 0; }
    .cat-name  { font-size: 0.85rem; font-weight: 600; color: var(--text); }
    .cat-sub   { font-size: 0.68rem; color: var(--text-faint); margin-top: 1px; }
    .cat-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; min-width: 100px; }
    .cat-amount { font-size: 0.88rem; font-weight: 700; color: var(--text); }
    .cat-bar-wrap { width: 80px; height: 4px; background: var(--surface-sunken); border-radius: 999px; overflow: hidden; }
    .cat-bar      { height: 100%; border-radius: 999px; transition: width 0.45s ease; }
    .bg-accent   { background: var(--accent); }
    .bg-success  { background: var(--success); }
    .bg-warning  { background: var(--warning); }
    .bg-danger   { background: var(--danger); }
    .bg-info     { background: var(--info); }
    .bg-neutral  { background: var(--text-faint); }
    .cat-pct      { font-size: 0.65rem; color: var(--text-faint); font-weight: 600; }

    /* ── Mini table ──────────────────────────────────────────── */
    .mini-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .mini-table thead th {
      background: var(--surface-muted); padding: 9px 14px;
      text-align: left; font-size: 0.65rem; font-weight: 700;
      color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.06em;
      border-bottom: 1px solid var(--border);
    }
    .mini-table tbody td {
      padding: 10px 14px; border-bottom: 1px solid var(--surface-sunken);
      vertical-align: middle;
    }
    .mini-table tbody tr:last-child td { border-bottom: none; }
    .mini-table tbody tr:hover td      { background: var(--surface-muted); }
    .mini-date   { font-size: 0.72rem; color: var(--text-subtle); white-space: nowrap; }
    .mini-desc   { font-size: 0.82rem; font-weight: 600; color: var(--text); }
    .mini-store  { font-size: 0.7rem; color: var(--text-faint); margin-top: 1px; }
    .mini-amount { font-size: 0.85rem; font-weight: 700; color: var(--text); }
    .mini-fx     { font-size: 0.68rem; color: var(--text-faint); margin-top: 1px; }
    .empty-cell  { text-align: center; color: var(--text-faint); font-size: 0.82rem; padding: 24px; }
    .empty-msg   { text-align: center; color: var(--text-faint); font-size: 0.82rem; padding: 16px 0; }

    /* ── Team ────────────────────────────────────────────────── */
    .team-list { display: flex; flex-direction: column; gap: 14px; }
    .team-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; border-radius: var(--radius);
      border: 1px solid var(--surface-sunken); background: var(--surface-muted);
    }
    .team-row-me { background: var(--accent-soft); border-color: var(--accent); }
    .team-info { flex: 1; min-width: 0; }
    .team-name { font-size: 0.85rem; font-weight: 700; color: var(--text); margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
    .you-chip { padding: 1px 6px; background: var(--accent); color: #fff; border-radius: 999px; font-size: 0.6rem; font-weight: 700; }
    .team-bar-wrap { height: 4px; background: var(--border); border-radius: 999px; overflow: hidden; margin-bottom: 4px; }
    .team-bar { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.45s ease; }
    .team-amounts  { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .team-thb { font-size: 0.8rem; font-weight: 700; color: var(--text); }
    .team-fx  { font-size: 0.68rem; color: var(--text-faint); }
    .team-count { font-size: 0.85rem; font-weight: 700; color: var(--text-subtle); text-align: right; white-space: nowrap; }
    .team-count small { font-size: 0.65rem; font-weight: 400; }

    /* ── Loans ───────────────────────────────────────────────── */
    .loan-halves { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .loan-half {
      border-radius: var(--radius); padding: 14px;
      display: flex; flex-direction: column; gap: 2px;
    }
    .loan-half-success { background: var(--success-soft); border: 1px solid var(--success-soft); }
    .loan-half-danger  { background: var(--danger-soft);  border: 1px solid var(--danger-soft); }
    .loan-half-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 6px; }
    .loan-half-val   { font-size: 1.1rem; font-weight: 700; }
    .loan-half-fx    { font-size: 0.7rem; color: var(--text-subtle); }

    /* ── Mobile polish ───────────────────────────────────────── */
    @media (max-width: 640px) {
      /* Header stacks; the rate bar becomes full-width and wraps cleanly. */
      .dash-header { margin-bottom: 20px; }
      .dash-header-right { width: 100%; }
      .rate-bar { width: 100%; }
      /* Net strip stacks; right column aligns left for readability. */
      .net-strip { flex-direction: column; align-items: stretch; }
      .net-strip-right { text-align: left; }
      /* Keep the loan summary readable; halves stack only on very small screens. */
      .dash-card-body { padding: 14px; }
    }
    @media (max-width: 420px) {
      .loan-halves { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private svc  = inject(MockDataService);
  private auth = inject(AuthService);

  protected readonly rateUsd    = THB_TO_USD.toFixed(4);
  protected readonly rateIdrFmt = THB_TO_IDR.toLocaleString();

  protected fmtThb = fmtThb;
  protected fmtUsd = fmtUsd;
  protected fmtIdr = fmtIdr;
  protected fmtDate = fmtDate;

  protected currentUser = this.auth.currentUser;

  // Live data — direct read from store
  private allExpenses = this.svc.expenses;
  private allLoans    = this.svc.loans;
  private allUsers    = this.svc.users;

  protected myExpenses = computed(() => {
    const uid = this.currentUser()?.id;
    return this.allExpenses().filter(e => e.recorderId === uid || e.userId === uid);
  });

  protected myTotal = computed(() => this.myExpenses().reduce((s, e) => s + (e.amount ?? 0), 0));

  protected teamTotal = computed(() => this.allExpenses().reduce((s, e) => s + (e.amount ?? 0), 0));

  protected pendingCount = computed(() => this.myExpenses().filter(e => e.status === 'PENDING').length);

  protected recentExpenses = computed(() =>
    [...this.allExpenses()]
      .sort((a, b) => new Date(b.createdAt ?? b.expenseDate).getTime() - new Date(a.createdAt ?? a.expenseDate).getTime())
      .slice(0, 5)
  );

  protected categoryStats = computed((): CategoryStat[] => {
    const map = new Map<string, { total: number; count: number }>();
    for (const e of this.myExpenses()) {
      const cat = e.category || 'Other';
      const cur = map.get(cat) ?? { total: 0, count: 0 };
      map.set(cat, { total: cur.total + (e.amount ?? 0), count: cur.count + 1 });
    }
    const total = this.myTotal();
    return [...map.entries()]
      .map(([name, { total: t, count }]) => ({
        name, count,
        total: t,
        pct: total > 0 ? (t / total) * 100 : 0,
        icon: CATEGORY_ICONS[name] ?? 'pi-box',
        tone: CATEGORY_TONES[name] ?? 'neutral',
      }))
      .sort((a, b) => b.total - a.total);
  });

  protected teamStats = computed(() => {
    return this.allUsers().map(user => {
      const exps = this.allExpenses().filter(e => e.recorderId === user.id || e.userId === user.id);
      const total = exps.reduce((s, e) => s + (e.amount ?? 0), 0);
      return { user, total, count: exps.length };
    }).map(item => {
      const teamTot = this.teamTotal();
      return { ...item, pct: teamTot > 0 ? Math.min((item.total / teamTot) * 100, 100) : 0 };
    }).sort((a, b) => b.total - a.total);
  });

  protected owedToMe = computed(() => {
    const uid = this.currentUser()?.id;
    return this.allLoans()
      .filter(l => l.lenderId === uid && l.status !== 'FULLY_SETTLED')
      .reduce((s, l) => s + (l.remainingBalance ?? l.amount ?? 0), 0);
  });

  protected iOwe = computed(() => {
    const uid = this.currentUser()?.id;
    return this.allLoans()
      .filter(l => l.borrowerId === uid && l.status !== 'FULLY_SETTLED')
      .reduce((s, l) => s + (l.remainingBalance ?? l.amount ?? 0), 0);
  });

  protected netPosition = computed(() => this.owedToMe() - this.iOwe());

  // Doughnut chart data for "spending by category" (chart.js via p-chart).
  protected categoryChartData = computed(() => {
    const stats = this.categoryStats();
    return {
      labels: stats.map(s => s.name),
      datasets: [{
        data: stats.map(s => Math.round(s.total)),
        backgroundColor: stats.map(s => TONE_HEX[s.tone]),
        borderWidth: 0,
        hoverOffset: 6,
      }],
    };
  });

  protected categoryChartOptions = {
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 14, font: { size: 11 } },
      },
    },
    maintainAspectRatio: false,
  };

  ngOnInit(): void {}
}
