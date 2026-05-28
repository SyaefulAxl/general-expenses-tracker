import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import { Expense, User, Loan } from '@core/models';
import { fmtThb, fmtUsd, fmtIdr, fmtDate, THB_TO_USD, THB_TO_IDR } from '@core/utils/currency.utils';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';

const CATEGORY_ICONS: Record<string, string> = {
  'Transport':     '🚗',
  'Food':          '🍜',
  'Accommodation': '🏨',
  'Entertainment': '🎭',
  'Other':         '📦',
};

const CATEGORY_COLORS: Record<string, { bg: string; fg: string; bar: string }> = {
  'Transport':     { bg: '#eff6ff', fg: '#2563eb', bar: '#3b82f6' },
  'Food':          { bg: '#fff7ed', fg: '#c2410c', bar: '#f97316' },
  'Accommodation': { bg: '#f5f3ff', fg: '#6d28d9', bar: '#8b5cf6' },
  'Entertainment': { bg: '#fdf2f8', fg: '#be185d', bar: '#ec4899' },
  'Other':         { bg: '#f8fafc', fg: '#475569', bar: '#94a3b8' },
};

interface CategoryStat {
  name: string;
  total: number;
  count: number;
  pct: number;
  icon: string;
  bg: string;
  fg: string;
  bar: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, AvatarComponent],
  template: `
    <div class="dash">

      <!-- ── Page Header ─────────────────────────────────────── -->
      <div class="dash-header">
        <div class="dash-header-left">
          <div class="trip-badge">🇹🇭 Thailand Trip · May 7–16, 2026</div>
          <h1 class="dash-title">Dashboard</h1>
          <p class="dash-subtitle">Welcome back, <strong>{{ currentUser()?.name || 'User' }}</strong> — here's your financial overview.</p>
        </div>
        <div class="dash-header-right">
          <div class="rate-bar">
            <span class="rate-label">💱 Live Rates</span>
            <span class="rate-pill rate-thb">฿1 THB</span>
            <span class="rate-eq">=</span>
            <span class="rate-pill rate-usd">\${{ rateUsd }} USD</span>
            <span class="rate-eq">=</span>
            <span class="rate-pill rate-idr">Rp {{ rateIdrFmt }} IDR</span>
          </div>
        </div>
      </div>

      <!-- ── KPI Cards ────────────────────────────────────────── -->
      <div class="kpi-grid">
        <!-- My Total -->
        <div class="kpi-card kpi-blue">
          <div class="kpi-icon-wrap" style="background:#eff6ff">💰</div>
          <div class="kpi-info">
            <div class="kpi-label">My Total Spend</div>
            <div class="kpi-val">{{ fmtThb(myTotal()) }}</div>
            <div class="kpi-subs">
              <span>{{ fmtUsd(myTotal()) }}</span>
              <span class="kpi-dot">·</span>
              <span>{{ fmtIdr(myTotal()) }}</span>
            </div>
          </div>
        </div>
        <!-- Team Total -->
        <div class="kpi-card kpi-green">
          <div class="kpi-icon-wrap" style="background:#f0fdf4">👥</div>
          <div class="kpi-info">
            <div class="kpi-label">Team Total</div>
            <div class="kpi-val" style="color:#059669">{{ fmtThb(teamTotal()) }}</div>
            <div class="kpi-subs">
              <span>{{ fmtUsd(teamTotal()) }}</span>
              <span class="kpi-dot">·</span>
              <span>{{ fmtIdr(teamTotal()) }}</span>
            </div>
          </div>
        </div>
        <!-- My Expenses count -->
        <div class="kpi-card kpi-purple">
          <div class="kpi-icon-wrap" style="background:#f5f3ff">📋</div>
          <div class="kpi-info">
            <div class="kpi-label">My Expenses</div>
            <div class="kpi-val" style="color:#7c3aed">{{ myExpenses().length }}</div>
            <div class="kpi-subs"><span>transactions</span></div>
          </div>
        </div>
        <!-- Pending -->
        <div class="kpi-card" [style.border-left-color]="pendingCount() > 0 ? '#d97706' : '#e2e8f0'">
          <div class="kpi-icon-wrap" style="background:#fffbeb">⏳</div>
          <div class="kpi-info">
            <div class="kpi-label">Pending Review</div>
            <div class="kpi-val" [style.color]="pendingCount() > 0 ? '#d97706' : '#0f172a'">{{ pendingCount() }}</div>
            <div class="kpi-subs"><span>awaiting approval</span></div>
          </div>
        </div>
      </div>

      <!-- ── Main Content Grid ─────────────────────────────────── -->
      <div class="dash-grid">

        <!-- ── Category Breakdown ───────────────────────────── -->
        <div class="dash-card">
          <div class="dash-card-header">
            <span class="dash-card-title">My Spending by Category</span>
          </div>
          <div class="dash-card-body">
            @if (categoryStats().length === 0) {
              <div class="empty-msg">No expenses yet</div>
            }
            @for (cat of categoryStats(); track cat.name) {
              <div class="cat-row">
                <div class="cat-left">
                  <div class="cat-icon-chip" [style.background]="cat.bg" [style.color]="cat.fg">
                    {{ cat.icon }}
                  </div>
                  <div class="cat-info">
                    <div class="cat-name">{{ cat.name }}</div>
                    <div class="cat-sub">{{ fmtUsd(cat.total) }} · {{ fmtIdr(cat.total) }}</div>
                  </div>
                </div>
                <div class="cat-right">
                  <div class="cat-amount">{{ fmtThb(cat.total) }}</div>
                  <div class="cat-bar-wrap">
                    <div class="cat-bar" [style.width.%]="cat.pct" [style.background]="cat.bar"></div>
                  </div>
                  <div class="cat-pct">{{ cat.pct | number:'1.0-0' }}%</div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- ── Recent Expenses ──────────────────────────────── -->
        <div class="dash-card">
          <div class="dash-card-header">
            <span class="dash-card-title">Recent Expenses</span>
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
                      <div class="mini-amount">{{ fmtThb(exp.amount) }}</div>
                      <div class="mini-fx">{{ fmtUsd(exp.amount) }}</div>
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

        <!-- ── Team Comparison ──────────────────────────────── -->
        <div class="dash-card">
          <div class="dash-card-header">
            <span class="dash-card-title">Team Spending</span>
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
                      <span class="team-thb">{{ fmtThb(member.total) }}</span>
                      <span class="team-fx">{{ fmtUsd(member.total) }} · {{ fmtIdr(member.total) }}</span>
                    </div>
                  </div>
                  <div class="team-count">{{ member.count }}<span> exp</span></div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- ── Loans Summary ────────────────────────────────── -->
        <div class="dash-card">
          <div class="dash-card-header">
            <span class="dash-card-title">Loan Summary</span>
          </div>
          <div class="dash-card-body">
            <div class="loan-halves">
              <!-- Owed to me -->
              <div class="loan-half loan-half-green">
                <div class="loan-half-label">Owed to Me</div>
                <div class="loan-half-val">{{ fmtThb(owedToMe()) }}</div>
                <div class="loan-half-fx">{{ fmtUsd(owedToMe()) }}</div>
                <div class="loan-half-fx">{{ fmtIdr(owedToMe()) }}</div>
              </div>
              <!-- I owe -->
              <div class="loan-half loan-half-red">
                <div class="loan-half-label">I Owe</div>
                <div class="loan-half-val">{{ fmtThb(iOwe()) }}</div>
                <div class="loan-half-fx">{{ fmtUsd(iOwe()) }}</div>
                <div class="loan-half-fx">{{ fmtIdr(iOwe()) }}</div>
              </div>
            </div>
            <!-- Net -->
            <div class="loan-net" [style.background]="netPosition() >= 0 ? '#f0fdf4' : '#fee2e2'">
              <span class="loan-net-label">Net Position</span>
              <span class="loan-net-val" [style.color]="netPosition() >= 0 ? '#059669' : '#dc2626'">
                {{ netPosition() >= 0 ? '+' : '' }}{{ fmtThb(netPosition()) }}
              </span>
              <span class="loan-net-fx" [style.color]="netPosition() >= 0 ? '#059669' : '#dc2626'">
                {{ netPosition() >= 0 ? '+' : '' }}{{ fmtUsd(netPosition()) }} ·
                {{ netPosition() >= 0 ? '+' : '' }}{{ fmtIdr(netPosition()) }}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dash { padding: 24px; max-width: 1400px; margin: 0 auto; }

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
      background: #fff7ed;
      color: #92400e;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      margin-bottom: 8px;
      border: 1px solid #fed7aa;
    }
    .dash-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px;
      letter-spacing: -0.02em;
    }
    .dash-subtitle { font-size: 0.85rem; color: #64748b; margin: 0; }

    .rate-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      flex-wrap: wrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .rate-label { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .rate-pill { padding: 4px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
    .rate-thb  { background: #fff7ed; color: #c2410c; }
    .rate-usd  { background: #f0fdf4; color: #15803d; }
    .rate-idr  { background: #eff6ff; color: #1d4ed8; }
    .rate-eq   { color: #94a3b8; font-size: 0.85rem; }

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
      background: #ffffff;
      border-radius: 14px;
      border: 1.5px solid #e2e8f0;
      border-left-width: 3px;
      padding: 18px 20px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .kpi-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09); transform: translateY(-2px); }
    .kpi-blue   { border-left-color: #2563eb; }
    .kpi-green  { border-left-color: #059669; }
    .kpi-purple { border-left-color: #7c3aed; }

    .kpi-icon-wrap {
      width: 40px; height: 40px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }
    .kpi-info { flex: 1; min-width: 0; }
    .kpi-label { font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
    .kpi-val   { font-size: 1.35rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; line-height: 1; }
    .kpi-subs  { display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #94a3b8; margin-top: 5px; flex-wrap: wrap; }
    .kpi-dot   { color: #cbd5e1; }

    /* ── Main grid ───────────────────────────────────────────── */
    .dash-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 900px) { .dash-grid { grid-template-columns: 1fr; } }

    /* ── Card ────────────────────────────────────────────────── */
    .dash-card {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .dash-card-header {
      padding: 14px 18px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .dash-card-title { font-size: 0.82rem; font-weight: 700; color: #0f172a; }
    .dash-card-badge {
      padding: 2px 8px; border-radius: 999px;
      background: #f1f5f9; color: #64748b;
      font-size: 0.65rem; font-weight: 700;
    }
    .dash-card-body { padding: 18px; }
    .dash-card-body.flush { padding: 0; }

    /* ── Category rows ───────────────────────────────────────── */
    .cat-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .cat-row:last-child { border-bottom: none; }
    .cat-left  { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
    .cat-icon-chip {
      width: 34px; height: 34px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
    .cat-info { min-width: 0; }
    .cat-name  { font-size: 0.82rem; font-weight: 600; color: #0f172a; }
    .cat-sub   { font-size: 0.68rem; color: #94a3b8; margin-top: 1px; }
    .cat-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; min-width: 100px; }
    .cat-amount { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
    .cat-bar-wrap { width: 80px; height: 4px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
    .cat-bar      { height: 100%; border-radius: 999px; transition: width 0.5s; }
    .cat-pct      { font-size: 0.65rem; color: #94a3b8; font-weight: 600; }

    /* ── Mini table ──────────────────────────────────────────── */
    .mini-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .mini-table thead th {
      background: #f8fafc; padding: 9px 14px;
      text-align: left; font-size: 0.65rem; font-weight: 700;
      color: #64748b; text-transform: uppercase; letter-spacing: 0.06em;
      border-bottom: 1px solid #e2e8f0;
    }
    .mini-table tbody td {
      padding: 10px 14px; border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .mini-table tbody tr:last-child td { border-bottom: none; }
    .mini-table tbody tr:hover td      { background: #f8fafc; }
    .mini-date   { font-size: 0.72rem; color: #64748b; white-space: nowrap; }
    .mini-desc   { font-size: 0.82rem; font-weight: 600; color: #0f172a; }
    .mini-store  { font-size: 0.7rem; color: #94a3b8; margin-top: 1px; }
    .mini-amount { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
    .mini-fx     { font-size: 0.68rem; color: #94a3b8; margin-top: 1px; }
    .empty-cell  { text-align: center; color: #94a3b8; font-size: 0.82rem; padding: 24px; }
    .empty-msg   { text-align: center; color: #94a3b8; font-size: 0.82rem; padding: 16px 0; }

    /* ── Team ────────────────────────────────────────────────── */
    .team-list { display: flex; flex-direction: column; gap: 14px; }
    .team-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; border-radius: 10px;
      border: 1px solid #f1f5f9; background: #f8fafc;
    }
    .team-row-me { background: #eff6ff; border-color: #bfdbfe; }
    .team-info { flex: 1; min-width: 0; }
    .team-name { font-size: 0.85rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
    .you-chip { padding: 1px 6px; background: #2563eb; color: #fff; border-radius: 999px; font-size: 0.6rem; font-weight: 700; }
    .team-bar-wrap { height: 4px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 4px; }
    .team-bar { height: 100%; background: linear-gradient(90deg, #2563eb, #7c3aed); border-radius: 999px; transition: width 0.5s; }
    .team-amounts  { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .team-thb { font-size: 0.8rem; font-weight: 700; color: #0f172a; }
    .team-fx  { font-size: 0.68rem; color: #94a3b8; }
    .team-count { font-size: 0.85rem; font-weight: 700; color: #64748b; text-align: right; white-space: nowrap; }
    .team-count span { font-size: 0.65rem; font-weight: 400; }

    /* ── Loans ───────────────────────────────────────────────── */
    .loan-halves { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .loan-half {
      border-radius: 10px; padding: 14px;
      display: flex; flex-direction: column; gap: 2px;
    }
    .loan-half-green { background: #f0fdf4; border: 1px solid #a7f3d0; }
    .loan-half-red   { background: #fef2f2; border: 1px solid #fecaca; }
    .loan-half-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 6px; }
    .loan-half-val   { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
    .loan-half-fx    { font-size: 0.7rem; color: #94a3b8; }
    .loan-net {
      border-radius: 10px; padding: 12px 14px;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 6px;
    }
    .loan-net-label { font-size: 0.72rem; font-weight: 700; color: #64748b; }
    .loan-net-val   { font-size: 1rem; font-weight: 800; }
    .loan-net-fx    { font-size: 0.72rem; font-weight: 600; }
  `]
})
export class DashboardComponent implements OnInit {
  private svc  = inject(MockDataService);
  private auth = inject(AuthService);

  readonly rateUsd    = THB_TO_USD.toFixed(4);
  readonly rateIdrFmt = THB_TO_IDR.toLocaleString();

  fmtThb = fmtThb;
  fmtUsd = fmtUsd;
  fmtIdr = fmtIdr;
  fmtDate = fmtDate;

  currentUser = signal<User | null>(null);

  // Live data — direct read from store
  private allExpenses = this.svc.expenses;
  private allLoans    = this.svc.loans;
  private allUsers    = this.svc.users;

  myExpenses = computed(() => {
    const uid = this.currentUser()?.id;
    return this.allExpenses().filter(e => e.recorderId === uid || e.userId === uid);
  });

  myTotal = computed(() => this.myExpenses().reduce((s, e) => s + (e.amount ?? 0), 0));

  teamTotal = computed(() => this.allExpenses().reduce((s, e) => s + (e.amount ?? 0), 0));

  pendingCount = computed(() => this.myExpenses().filter(e => e.status === 'PENDING').length);

  recentExpenses = computed(() =>
    [...this.allExpenses()]
      .sort((a, b) => new Date(b.createdAt ?? b.expenseDate).getTime() - new Date(a.createdAt ?? a.expenseDate).getTime())
      .slice(0, 5)
  );

  categoryStats = computed((): CategoryStat[] => {
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
        icon: CATEGORY_ICONS[name] ?? '📦',
        ...( CATEGORY_COLORS[name] ?? { bg: '#f8fafc', fg: '#475569', bar: '#94a3b8' }),
      }))
      .sort((a, b) => b.total - a.total);
  });

  teamStats = computed(() => {
    return this.allUsers().map(user => {
      const exps = this.allExpenses().filter(e => e.recorderId === user.id || e.userId === user.id);
      const total = exps.reduce((s, e) => s + (e.amount ?? 0), 0);
      return { user, total, count: exps.length };
    }).map(item => {
      const teamTot = this.teamTotal();
      return { ...item, pct: teamTot > 0 ? Math.min((item.total / teamTot) * 100, 100) : 0 };
    }).sort((a, b) => b.total - a.total);
  });

  owedToMe = computed(() => {
    const uid = this.currentUser()?.id;
    return this.allLoans()
      .filter(l => l.lenderId === uid && l.status !== 'FULLY_SETTLED')
      .reduce((s, l) => s + (l.remainingBalance ?? l.amount ?? 0), 0);
  });

  iOwe = computed(() => {
    const uid = this.currentUser()?.id;
    return this.allLoans()
      .filter(l => l.borrowerId === uid && l.status !== 'FULLY_SETTLED')
      .reduce((s, l) => s + (l.remainingBalance ?? l.amount ?? 0), 0);
  });

  netPosition = computed(() => this.owedToMe() - this.iOwe());

  ngOnInit() {
    this.currentUser.set(this.auth.getCurrentUser());
  }
}
