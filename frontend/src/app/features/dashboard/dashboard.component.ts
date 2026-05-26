import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { KpiCardComponent } from '@shared/components/kpi-card/kpi-card.component';
import { ProgressBarComponent } from '@shared/components/progress-bar/progress-bar.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import { Expense, User, Loan } from '@core/models';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AvatarComponent,
    StatusBadgeComponent,
    KpiCardComponent,
    ProgressBarComponent,
    EmptyStateComponent,
    ChartModule,
  ],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-left">
          <h1 class="page-title">Thailand Trip Dashboard</h1>
          <p class="page-subtitle">May 7 – May 16, 2026 · All amounts in THB</p>
        </div>
        <div class="header-right">
          <span class="badge badge-blue">Team</span>
          <span class="badge badge-gray">{{ currentUser()?.name }}</span>
        </div>
      </div>

      <!-- KPI Row -->
      <div class="kpi-grid">
        <app-kpi-card label="Trip Spend (Team)" [accent]="true">
          <span slot="value" class="kpi-value">
            <span class="kpi-currency">฿</span>
            {{ fmtThb(totalTeamSpend()) }}
          </span>
          <span slot="fx">≈ Rp {{ fmtIdr(totalTeamSpend()) }} · {{ expenses().length }} records</span>
          <span slot="delta"><i class="pi pi-chart-bar"></i> {{ ((totalTeamSpend() / teamBudget) * 100).toFixed(1) }}% of ฿{{ teamBudget.toLocaleString() }} budget</span>
        </app-kpi-card>

        <app-kpi-card label="My Logged Expenses">
          <span slot="value" class="kpi-value">
            <span class="kpi-currency">฿</span>
            {{ fmtThb(myTotal()) }}
          </span>
          <span slot="fx">{{ myCount() }} records · {{ pendingCount() }} pending</span>
        </app-kpi-card>

        <app-kpi-card label="Owed TO Me">
          <span slot="value" class="kpi-value text-success">
            <span class="kpi-currency">฿</span>
            {{ fmtThb(owedToMe()) }}
          </span>
          <span slot="fx">{{ owedToMeLoans().length }} open · across team</span>
        </app-kpi-card>

        <app-kpi-card label="I Owe">
          <span slot="value" class="kpi-value text-danger">
            <span class="kpi-currency">฿</span>
            {{ fmtThb(iOwe()) }}
          </span>
          <span slot="fx">Net: {{ netPosition() >= 0 ? '+' : '' }}฿{{ fmtThb(abs(netPosition())) }} position</span>
        </app-kpi-card>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Budget Utilisation -->
        <div class="card">
          <div class="card-hd">
            <h3><i class="pi pi-users"></i> Project / Member Budget</h3>
            <span class="muted tx-xs">Budget ฿5,000 per person</span>
          </div>
          <div class="card-bd flush">
            @for (member of teamMembers(); track member.id) {
              @if (!member.isSystem) {
                <div class="member-row">
                  <div class="member-info">
                    <div class="member-left">
                      <app-avatar [name]="member.name"></app-avatar>
                      <div>
                        <div class="member-name">{{ member.name }}</div>
                        <div class="muted tx-xs">{{ member.role }}</div>
                      </div>
                    </div>
                    <div class="member-right">
                      <div class="member-amount">
                        ฿{{ fmtThb(memberSpend(member.id)) }}
                        <span class="muted">/ ฿5,000</span>
                      </div>
                      <div class="muted tx-xs">{{ ((memberSpend(member.id) / 5000) * 100).toFixed(1) }}% used</div>
                    </div>
                  </div>
                  <app-progress-bar [value]="memberSpend(member.id)" [max]="5000"></app-progress-bar>
                </div>
              }
            }
            <div class="row-total">
              <span class="muted tx-sm">Total team spend</span>
              <span>
                ฿{{ fmtThb(totalTeamSpend()) }} / ฿{{ (teamBudget).toLocaleString() }}
                · {{ ((totalTeamSpend() / teamBudget) * 100).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Outstanding with team -->
        <div class="card">
          <div class="card-hd">
            <h3><i class="pi pi-wallet"></i> Outstanding with Team</h3>
          </div>
          <div class="card-bd flush">
            <div class="section">
              <div class="section-label">I owe ↑</div>
              @if (iOweGrouped().length === 0) {
                <div class="muted tx-sm empty-msg">You're square with everyone <i class="pi pi-check-circle"></i></div>
              }
              @for (item of iOweGrouped(); track item.user.id) {
                <div class="person-row">
                  <app-avatar [name]="item.user.name"></app-avatar>
                  <div class="person-info">
                    <div class="person-name">{{ item.user.name }}</div>
                    <div class="muted tx-xs">{{ item.count }} loan{{ item.count !== 1 ? 's' : '' }}</div>
                  </div>
                  <div class="person-amount text-danger">
                    ฿{{ fmtThb(item.total) }}
                    <div class="muted tx-xs">≈ Rp {{ fmtIdr(item.total) }}</div>
                  </div>
                </div>
              }
            </div>
            <div class="section">
              <div class="section-label">Owed to me ↓</div>
              @if (owedToMeGrouped().length === 0) {
                <div class="muted tx-sm empty-msg">No outstanding loans.</div>
              }
              @for (item of owedToMeGrouped(); track item.user.id) {
                <div class="person-row">
                  <app-avatar [name]="item.user.name"></app-avatar>
                  <div class="person-info">
                    <div class="person-name">{{ item.user.name }}</div>
                    <div class="muted tx-xs">{{ item.count }} loan{{ item.count !== 1 ? 's' : '' }}</div>
                  </div>
                  <div class="person-amount text-success">
                    ฿{{ fmtThb(item.total) }}
                    <div class="muted tx-xs">≈ Rp {{ fmtIdr(item.total) }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Category Chart + Recent Expenses -->
      <div class="bottom-grid">
        <!-- Category Breakdown -->
        <div class="card">
          <div class="card-hd">
            <h3><i class="pi pi-chart-pie"></i> Spend by Category</h3>
            <span class="muted tx-xs">฿{{ fmtThb(totalTeamSpend()) }} total</span>
          </div>
          <div class="card-bd">
            @if (chartData()) {
              <p-chart type="doughnut" [data]="chartData()!" [options]="chartOptions" style="max-height: 220px;"></p-chart>
            } @else {
              <app-empty-state icon="pi-chart-pie" title="No data" subtitle="Start logging expenses to see the breakdown"></app-empty-state>
            }
          </div>
        </div>

        <!-- Recent Expenses -->
        <div class="card">
          <div class="card-hd">
            <h3><i class="pi pi-list"></i> Recent Expenses</h3>
            <button class="btn btn-ghost btn-sm"><i class="pi pi-arrow-right"></i> View all</button>
          </div>
          <div class="card-bd flush">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Toko</th>
                    <th>Category</th>
                    <th style="text-align:right;">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (exp of recentExpenses(); track exp.id) {
                    <tr>
                      <td class="muted tx-xs">{{ fmtDate(exp.expenseDate) }}</td>
                      <td class="font-medium">{{ exp.toko }}</td>
                      <td>
                        <span class="badge" [ngClass]="categoryBadge(exp.category)">{{ exp.category }}</span>
                      </td>
                      <td class="amount text-right">฿{{ fmtThb(exp.amount) }}</td>
                      <td><app-status-badge [status]="exp.status"></app-status-badge></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .header-right {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }
    .kpi-value {
      display: flex;
      align-items: baseline;
      gap: 2px;
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .kpi-currency {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .content-grid {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1.4fr;
      gap: 20px;
    }
    .card-hd h3 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-hd h3 i {
      color: var(--text-muted);
    }
    .member-row {
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .member-row:last-of-type {
      border-bottom: none;
    }
    .member-info {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 10px;
    }
    .member-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .member-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .member-right {
      text-align: right;
    }
    .member-amount {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .row-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      background: var(--bg-tertiary);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .section {
      padding: 14px 20px;
    }
    .section:first-child {
      border-bottom: 1px solid var(--border-subtle);
    }
    .section-label {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 10px;
    }
    .empty-msg {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .person-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
    }
    .person-info {
      flex: 1;
    }
    .person-name {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-primary);
    }
    .person-amount {
      text-align: right;
      font-size: 0.875rem;
      font-weight: 700;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .font-medium {
      font-weight: 500;
    }
    .text-right {
      text-align: right;
    }

    @media (max-width: 1023px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .content-grid, .bottom-grid {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 640px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private mockData = inject(MockDataService);
  private authService = inject(AuthService);

  Math = Math;
  teamBudget = 5000;

  currentUser = signal<User | null>(null);
  expenses = signal<Expense[]>([]);
  loans = signal<Loan[]>([]);
  users = signal<User[]>([]);

  totalTeamSpend = computed(() =>
    this.expenses().filter(e => e.status !== 'REJECTED').reduce((s, e) => s + e.amount, 0)
  );

  myTotal = computed(() =>
    this.expenses()
      .filter(e => e.recorderId === (this.currentUser()?.id ?? 0) && e.status !== 'REJECTED')
      .reduce((s, e) => s + e.amount, 0)
  );

  myCount = computed(() =>
    this.expenses().filter(e => e.recorderId === (this.currentUser()?.id ?? 0)).length
  );

  pendingCount = computed(() => this.expenses().filter(e => e.status === 'PENDING').length);

  owedToMe = computed(() =>
    this.loans()
      .filter(l => l.lenderId === (this.currentUser()?.id ?? 0) && l.status !== 'FULLY_SETTLED')
      .reduce((s, l) => s + (l.remainingBalance ?? (l.amount ?? 0) - (l.actualRepaid ?? 0)), 0)
  );

  iOwe = computed(() =>
    this.loans()
      .filter(l => l.borrowerId === (this.currentUser()?.id ?? 0) && l.status !== 'FULLY_SETTLED')
      .reduce((s, l) => s + (l.remainingBalance ?? (l.amount ?? 0) - (l.actualRepaid ?? 0)), 0)
  );

  netPosition = computed(() => this.owedToMe() - this.iOwe());

  teamMembers = computed(() => this.users().filter(u => !u.isSystem));

  owedToMeLoans = computed(() =>
    this.loans().filter(l => l.lenderId === (this.currentUser()?.id ?? 0) && l.status !== 'FULLY_SETTLED')
  );

  owedToMeGrouped = computed(() => {
    const uid = this.currentUser()?.id ?? 0;
    const others = this.users().filter(u => u.id !== uid && !u.isSystem);
    return others.map(user => {
      const ls = this.loans().filter(l => l.lenderId === uid && l.borrowerId === user.id && l.status !== 'FULLY_SETTLED');
      const total = ls.reduce((s, l) => s + (l.remainingBalance ?? (l.amount ?? 0) - (l.actualRepaid ?? 0)), 0);
      return { user, total, count: ls.length };
    }).filter(x => x.total > 0);
  });

  iOweGrouped = computed(() => {
    const uid = this.currentUser()?.id ?? 0;
    const others = this.users().filter(u => u.id !== uid && !u.isSystem);
    return others.map(user => {
      const ls = this.loans().filter(l => l.borrowerId === uid && l.lenderId === user.id && l.status !== 'FULLY_SETTLED');
      const total = ls.reduce((s, l) => s + (l.remainingBalance ?? (l.amount ?? 0) - (l.actualRepaid ?? 0)), 0);
      return { user, total, count: ls.length };
    }).filter(x => x.total > 0);
  });

  recentExpenses = computed(() =>
    [...this.expenses()]
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
      .slice(0, 6)
  );

  chartData = computed(() => {
    const cats = this.groupByCategory();
    if (cats.length === 0) return null;
    return {
      labels: cats.map(c => c.name),
      datasets: [{
        data: cats.map(c => c.value),
        backgroundColor: ['#3B82F6', '#F97316', '#8B5CF6', '#EC4899', '#14B8A6', '#6B7280'],
      }]
    };
  });

  chartOptions = {
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } }
    }
  };

  ngOnInit() {
    const stored = this.authService.getCurrentUser();
    this.currentUser.set(stored || { id: 1, name: 'Syaeful', username: 'syaeful', role: 'ADMIN', email: 'syaeful@texcoms.my.id', isActive: true, isSystem: false } as User);
    this.expenses.set(this.mockData.expenses());
    this.loans.set(this.mockData.loans());
    this.users.set(this.mockData.users());
  }

  memberSpend(userId: number): number {
    return this.expenses()
      .filter(e => e.recorderId === userId && e.status !== 'REJECTED')
      .reduce((s, e) => s + e.amount, 0);
  }

  groupByCategory(): { name: string; value: number }[] {
    const map = new Map<string, number>();
    this.expenses().filter(e => e.status !== 'REJECTED').forEach(e => {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }

  categoryBadge(cat: string): string {
    const map: Record<string, string> = {
      'Transport': 'badge-blue',
      'Food': 'badge-yellow',
      'Accommodation': 'badge-purple',
      'Entertainment': 'badge-red',
    };
    return 'badge ' + (map[cat] || 'badge-gray');
  }

  fmtThb(v: number): string {
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtIdr(v: number): string {
    return (v * 180).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  fmtDate(d: string): string {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }

  abs(v: number): number {
    return Math.abs(v);
  }
}
