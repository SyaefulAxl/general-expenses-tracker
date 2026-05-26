import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
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
            <span>{{ item.icon }}</span>
            {{ item.label }}
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
          <span style="color:#64748B;font-size:0.7rem">▼</span>
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
      background: white;
      border-bottom: 1px solid #E2E8F0;
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
      color: #0F172A;
    }
    .brand-mark {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: #2563EB;
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 800;
    }
    .brand .subtitle { font-weight: 400; color: #64748B; font-size: 0.875rem; }
    .topbar nav { display: flex; gap: 4px; flex: 1; }
    .topbar nav a {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem; font-weight: 500;
      color: #64748B;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
    }
    .topbar nav a:hover { background: #F1F5F9; color: #0F172A; }
    .topbar nav a.active { background: #EFF6FF; color: #2563EB; font-weight: 600; }
    .badge-num {
      background: #EF4444; color: white;
      border-radius: 9999px;
      font-size: 0.65rem; font-weight: 700;
      padding: 1px 6px; min-width: 18px;
      text-align: center;
    }
    .user-section { position: relative; }
    .user-switcher {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 10px;
      border-radius: 8px;
      background: transparent;
      border: 1px solid #E2E8F0;
      cursor: pointer;
      transition: all 0.15s;
    }
    .user-switcher:hover { background: #F1F5F9; }
    .user-info .name { font-size: 0.8rem; font-weight: 600; color: #0F172A; }
    .user-info .role { font-size: 0.65rem; color: #64748B; }
    .user-menu {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      min-width: 240px;
      z-index: 200;
      overflow: hidden;
    }
    .menu-header {
      padding: 8px 12px 4px;
      font-size: 0.65rem; font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .user-menu-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      cursor: pointer;
      transition: background 0.1s;
    }
    .user-menu-item:hover { background: #F8FAFC; }
    .user-menu-item.current { background: #EFF6FF; }
    .user-menu-item .semi { font-size: 0.8rem; font-weight: 600; color: #0F172A; }
    .user-menu-item .muted { color: #64748B; }
    .user-menu-item .text-xs { font-size: 0.7rem; }
    .role-tag {
      margin-left: auto;
      font-size: 0.6rem; font-weight: 600;
      color: #64748B;
      background: #F1F5F9;
      padding: 2px 6px;
      border-radius: 4px;
    }
  `]
})
export class TopbarComponent {
  @Input() currentPage = signal<string>('dashboard');
  @Output() pageChanged = new EventEmitter<string>();

  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  menuOpen = signal(false);
  navItems = signal<NavItem[]>([
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'expenses', label: 'List of Data', icon: '📋' },
    { id: 'loans', label: 'Loan Data', icon: '💸' },
    { id: 'history', label: 'History', icon: '📜' },
  ]);
  pendingCount = signal(0);
  openLoanCount = signal(0);

  demoUsers: User[] = [
    { id: 1, name: 'Syaeful', username: 'syaeful', email: 'syaeful@texcoms.my.id', role: 'ADMIN', isActive: true, isSystem: false },
    { id: 2, name: 'Winda', username: 'winda', email: 'winda@texcoms.my.id', role: 'MEMBER', isActive: true, isSystem: false },
    { id: 3, name: 'Dina', username: 'dina', email: 'dina@texcoms.my.id', role: 'MEMBER', isActive: true, isSystem: false },
  ];

  ngOnInit() {
    const stored = this.authService.getCurrentUser();
    this.currentUser.set(stored || this.demoUsers[0]);
    this.updateNav();
  }

  navigate(id: string) {
    this.currentPage.set(id);
    this.pageChanged.emit(id);
    this.menuOpen.set(false);
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  switchUser(user: User) {
    this.currentUser.set(user);
    this.authService.setCurrentUser(user);
    this.menuOpen.set(false);
  }

  setPending(count: number) {
    this.pendingCount.set(count);
    this.updateNav();
  }

  setOpenLoans(count: number) {
    this.openLoanCount.set(count);
    this.updateNav();
  }

  private updateNav() {
    const isAdmin = this.currentUser()?.role === 'ADMIN';
    this.navItems.set([
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'expenses', label: 'List of Data', icon: '📋', badge: this.pendingCount() },
      { id: 'loans', label: 'Loan Data', icon: '💸', badge: this.openLoanCount() },
      { id: 'history', label: 'History', icon: '📜' },
      ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: '⚙️' }] : []),
    ]);
  }
}
