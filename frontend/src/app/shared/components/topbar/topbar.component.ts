import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AvatarComponent } from '../avatar/avatar.component';
import { User } from '@core/models';
import { AuthService } from '@core/services/auth.service';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">฿</div>
        <span>Expenses</span>
        <span class="subtitle">Thailand</span>
      </div>
      <nav>
        @for (item of navItems(); track item.id) {
          <a [class.active]="currentPage() === item.id" (click)="navigate(item.id)">
            <i class="pi" [class]="item.icon"></i>
            <span>{{ item.label }}</span>
            @if (item.badge && item.badge > 0) {
              <span class="badge-num">{{ item.badge }}</span>
            }
          </a>
        }
      </nav>
      <div class="user-section">
        <button class="user-switcher" (click)="toggleMenu()">
          <app-avatar [name]="currentUser()?.name || ''"></app-avatar>
          <div class="user-info">
            <div class="name">{{ currentUser()?.name || 'Guest' }}</div>
            <div class="role">{{ currentUser()?.role || '—' }}</div>
          </div>
          <i class="pi pi-chevron-down topbar-chev"></i>
        </button>
        @if (menuOpen()) {
          <div class="user-menu">
            <div class="menu-header">Switch user (demo)</div>
            @for (u of demoUsers; track u.id) {
              <div class="user-menu-item" [class.current]="u.id === currentUser()?.id" (click)="switchUser(u)">
                <app-avatar [name]="u.name"></app-avatar>
                <div>
                  <div class="semi">{{ u.name }}</div>
                  <div class="text-xs muted">{{ u.email }}</div>
                </div>
                <span class="role-tag">{{ u.role }}</span>
              </div>
            }
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      display: flex;
      align-items: center;
      height: 60px;
      padding: 0 24px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      gap: 32px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 1rem;
      color: var(--text);
    }
    .brand-mark {
      width: 32px; height: 32px;
      border-radius: var(--radius-sm);
      background: var(--accent);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 800;
    }
    .brand .subtitle { font-weight: 400; color: var(--text-subtle); font-size: 0.875rem; }
    .topbar nav { display: flex; gap: 4px; flex: 1; }
    .topbar nav a {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem; font-weight: 500;
      color: var(--text-subtle);
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s, color 0.15s;
    }
    .topbar nav a i { font-size: 0.85rem; }
    .topbar nav a:hover { background: var(--surface-sunken); color: var(--text); }
    .topbar nav a.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
    .badge-num {
      background: var(--danger); color: #fff;
      border-radius: 9999px;
      font-size: 0.65rem; font-weight: 700;
      padding: 1px 6px; min-width: 18px;
      text-align: center;
    }
    .user-section { position: relative; }
    .user-switcher {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      background: transparent;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
    }
    .user-switcher:hover { background: var(--surface-muted); }
    .user-info .name { font-size: 0.8rem; font-weight: 600; color: var(--text); text-align: left; }
    .user-info .role { font-size: 0.65rem; color: var(--text-subtle); text-align: left; }
    .topbar-chev { color: var(--text-subtle); font-size: 0.65rem; }

    .user-menu {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      min-width: 240px;
      z-index: 200;
      overflow: hidden;
    }
    .menu-header {
      padding: 10px 12px 6px;
      font-size: 0.65rem; font-weight: 700;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .user-menu-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      cursor: pointer;
      transition: background 0.1s;
    }
    .user-menu-item:hover { background: var(--surface-muted); }
    .user-menu-item.current { background: var(--accent-soft); }
    .user-menu-item .semi { font-size: 0.8rem; font-weight: 600; color: var(--text); }
    .user-menu-item .muted { color: var(--text-subtle); }
    .user-menu-item .text-xs { font-size: 0.7rem; }
    .role-tag {
      margin-left: auto;
      font-size: 0.6rem; font-weight: 600;
      color: var(--text-subtle);
      background: var(--surface-sunken);
      padding: 2px 6px;
      border-radius: 4px;
    }
  `]
})
export class TopbarComponent implements OnInit {
  @Input() currentPage = signal<string>('dashboard');
  @Output() pageChanged = new EventEmitter<string>();

  private authService = inject(AuthService);
  private router = inject(Router);

  protected currentUser = signal<User | null>(null);
  protected menuOpen = signal(false);
  protected navItems = signal<NavItem[]>([
    { id: 'dashboard', label: 'Dashboard',    icon: 'pi-chart-bar' },
    { id: 'expenses',  label: 'Expenses',     icon: 'pi-list' },
    { id: 'loans',     label: 'Loans',        icon: 'pi-money-bill' },
    { id: 'history',   label: 'History',      icon: 'pi-clock' },
  ]);
  private pendingCount = signal(0);
  private openLoanCount = signal(0);

  protected demoUsers: User[] = [
    { id: 1, name: 'Syaeful', username: 'syaeful', email: 'syaeful@texcoms.my.id', role: 'ADMIN',  isActive: true, isSystem: false },
    { id: 2, name: 'Winda',   username: 'winda',   email: 'winda@texcoms.my.id',   role: 'MEMBER', isActive: true, isSystem: false },
    { id: 3, name: 'Dina',    username: 'dina',    email: 'dina@texcoms.my.id',    role: 'MEMBER', isActive: true, isSystem: false },
  ];

  ngOnInit(): void {
    const stored = this.authService.getCurrentUser();
    this.currentUser.set(stored || this.demoUsers[0]);
    this.updateNav();
  }

  navigate(id: string): void {
    this.currentPage.set(id);
    this.pageChanged.emit(id);
    this.menuOpen.set(false);
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  switchUser(user: User): void {
    this.currentUser.set(user);
    this.authService.setCurrentUser(user);
    this.menuOpen.set(false);
  }

  setPending(count: number): void {
    this.pendingCount.set(count);
    this.updateNav();
  }

  setOpenLoans(count: number): void {
    this.openLoanCount.set(count);
    this.updateNav();
  }

  private updateNav(): void {
    const isAdmin = this.currentUser()?.role === 'ADMIN';
    this.navItems.set([
      { id: 'dashboard', label: 'Dashboard', icon: 'pi-chart-bar' },
      { id: 'expenses',  label: 'Expenses',  icon: 'pi-list',       badge: this.pendingCount() },
      { id: 'loans',     label: 'Loans',     icon: 'pi-money-bill', badge: this.openLoanCount() },
      { id: 'history',   label: 'History',   icon: 'pi-clock' },
      ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: 'pi-cog' }] : []),
    ]);
  }
}
