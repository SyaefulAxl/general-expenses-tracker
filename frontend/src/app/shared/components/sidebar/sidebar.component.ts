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
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <aside class="sidebar" [class.sidebar--open]="sidebarOpen">

      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="sidebar-brand-mark">฿</div>
        <div class="sidebar-brand-text">
          <span class="sidebar-brand-title">Expenses</span>
          <span class="sidebar-brand-subtitle">Thailand Trip</span>
        </div>
        <button class="sidebar-close" (click)="close()" aria-label="Close menu">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav" role="navigation">
        <div class="sidebar-nav-section">
          <div class="sidebar-nav-label">Menu</div>
          @for (item of navItems(); track item.id) {
            <a
              class="sidebar-nav-item"
              [class.active]="currentPage === item.id"
              (click)="navigate(item.id)"
              role="menuitem"
              [attr.aria-current]="currentPage === item.id ? 'page' : null">
              <i [class]="'pi ' + item.icon" class="nav-icon"></i>
              <span class="nav-label">{{ item.label }}</span>
              @if (item.badge && item.badge > 0) {
                <span class="nav-badge">{{ item.badge }}</span>
              }
            </a>
          }
        </div>
      </nav>

      <!-- User / Footer -->
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <app-avatar [name]="currentUser()?.name || ''"></app-avatar>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">{{ currentUser()?.name || 'Guest' }}</div>
            <span
              class="badge"
              [class.badge-blue]="currentUser()?.role === 'ADMIN'"
              [class.badge-gray]="currentUser()?.role !== 'ADMIN'">
              {{ currentUser()?.role || 'MEMBER' }}
            </span>
          </div>
        </div>
        <button class="logout-btn" (click)="onLogout()">
          <i class="pi pi-sign-out"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    /* ── Sidebar shell ─────────────────────────────────────── */
    .sidebar {
      width: var(--sidebar-width, 260px);
      background: var(--sidebar-bg);
      border-right: 1px solid var(--sidebar-border);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 100;
      transform: translateX(-100%);
      transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
    }

    .sidebar--open {
      transform: translateX(0);
    }

    /* ── Brand row ─────────────────────────────────────────── */
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 20px;
      border-bottom: 1px solid var(--sidebar-border);
      min-height: var(--topbar-height, 56px);
      box-sizing: border-box;
    }

    .sidebar-brand-mark {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      font-weight: 800;
      flex-shrink: 0;
      letter-spacing: -0.02em;
    }

    .sidebar-brand-text {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .sidebar-brand-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .sidebar-brand-subtitle {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 1px;
    }

    .sidebar-close {
      display: none;
      width: 30px;
      height: 30px;
      border-radius: 6px;
      border: 1px solid var(--sidebar-border);
      background: var(--sidebar-hover-bg);
      color: var(--sidebar-text);
      font-size: 0.8rem;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-left: auto;
      transition: background 0.15s;
    }

    .sidebar-close:hover {
      background: var(--bg-tertiary);
    }

    /* ── Navigation ────────────────────────────────────────── */
    .sidebar-nav {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
    }

    .sidebar-nav-section {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sidebar-nav-label {
      font-size: 0.62rem;
      font-weight: 600;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.09em;
      padding: 8px 12px 6px;
    }

    .sidebar-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      color: var(--sidebar-text);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      border-left: 3px solid transparent;
      text-decoration: none;
      user-select: none;
    }

    .sidebar-nav-item:hover {
      background: var(--sidebar-hover-bg);
      color: var(--sidebar-text-hover);
    }

    .sidebar-nav-item.active {
      background: var(--sidebar-active-bg);
      color: var(--sidebar-text-active);
      border-left-color: #2563eb;
      font-weight: 600;
    }

    .nav-icon {
      font-size: 0.95rem;
      width: 18px;
      text-align: center;
      flex-shrink: 0;
    }

    .nav-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-badge {
      background: var(--accent-danger);
      color: #ffffff;
      border-radius: 9999px;
      font-size: 0.6rem;
      font-weight: 700;
      padding: 1px 6px;
      min-width: 18px;
      text-align: center;
      flex-shrink: 0;
    }

    /* ── Footer / User section ─────────────────────────────── */
    .sidebar-footer {
      padding: 14px;
      border-top: 1px solid var(--sidebar-border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sidebar-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 8px;
      border-radius: 8px;
      background: var(--bg-tertiary);
    }

    .sidebar-user-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .sidebar-user-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 9px 12px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--sidebar-text);
      font-family: inherit;
      font-size: 0.825rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      text-align: left;
    }

    .logout-btn:hover {
      background: #fef2f2;
      color: #ef4444;
    }

    /* ── Desktop: always visible ───────────────────────────── */
    @media (min-width: 768px) {
      .sidebar {
        transform: translateX(0) !important;
      }
      .sidebar-close {
        display: none !important;
      }
    }

    /* ── Mobile: slide-in + show close btn ────────────────── */
    @media (max-width: 767px) {
      .sidebar-close {
        display: flex;
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() currentPage: string = 'dashboard';
  @Input() sidebarOpen = false;
  @Output() pageChanged = new EventEmitter<string>();
  @Output() sidebarClosed = new EventEmitter<void>();

  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  navItems = signal<NavItem[]>([]);
  pendingCount = signal(0);
  openLoanCount = signal(0);

  ngOnInit() {
    const stored = this.authService.getCurrentUser();
    this.currentUser.set(stored);
    this.updateNav();
  }

  navigate(id: string) {
    this.pageChanged.emit(id);
    this.router.navigate(['/', id]);
  }

  close() {
    this.sidebarClosed.emit();
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
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
      { id: 'dashboard', label: 'Dashboard',  icon: 'pi-home'        },
      { id: 'expenses',  label: 'Expenses',   icon: 'pi-wallet',     badge: this.pendingCount()   },
      { id: 'loans',     label: 'Loans',      icon: 'pi-credit-card', badge: this.openLoanCount() },
      { id: 'history',   label: 'History',    icon: 'pi-clock'       },
      ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: 'pi-users' }] : []),
    ]);
  }
}
