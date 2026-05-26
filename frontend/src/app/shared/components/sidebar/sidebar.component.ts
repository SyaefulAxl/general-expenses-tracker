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
          <span class="sidebar-brand-subtitle">General</span>
        </div>
        <button class="sidebar-close" (click)="close()" aria-label="Close menu">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="sidebar-nav-section">
          <div class="sidebar-nav-section-title">Menu</div>
          @for (item of navItems(); track item.id) {
            <a
              class="sidebar-nav-item"
              [class.active]="currentPage() === item.id"
              (click)="navigate(item.id)">
              <i [class]="'pi ' + item.icon" class="nav-icon"></i>
              <span class="nav-label">{{ item.label }}</span>
              @if (item.badge && item.badge > 0) {
                <span class="nav-badge">{{ item.badge }}</span>
              }
            </a>
          }
        </div>
      </nav>

      <!-- User section -->
      <div class="sidebar-footer">
        <div class="sidebar-user-info">
          <app-avatar [name]="currentUser()?.name || ''"></app-avatar>
          <div class="sidebar-user-details">
            <div class="sidebar-user-name">{{ currentUser()?.name || 'Guest' }}</div>
            <div class="sidebar-user-role">{{ currentUser()?.role || '—' }}</div>
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
    .sidebar {
      width: var(--sidebar-width);
      background: var(--sidebar-bg);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 100;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    .sidebar--open {
      transform: translateX(0);
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .sidebar-brand-mark {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--accent-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 800;
      flex-shrink: 0;
    }
    .sidebar-brand-text {
      display: flex;
      flex-direction: column;
    }
    .sidebar-brand-title {
      font-weight: 700;
      font-size: 1rem;
      color: #1e293b;
      line-height: 1.2;
    }
    .sidebar-brand-subtitle {
      font-weight: 400;
      font-size: 0.75rem;
      color: #64748b;
    }
    .sidebar-close {
      display: none;
      margin-left: auto;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: none;
      background: rgba(255,255,255,0.1);
      color: var(--sidebar-text);
      font-size: 0.9rem;
      cursor: pointer;
      align-items: center;
      justify-content: center;
    }
    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }
    .sidebar-nav-section {
      margin-bottom: 16px;
    }
    .sidebar-nav-section-title {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--sidebar-text);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 8px 12px 4px;
      opacity: 0.7;
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
      transition: all 0.15s ease;
    }
    .sidebar-nav-item:hover {
      background: var(--sidebar-hover-bg);
      color: #1e293b;
    }
    .sidebar-nav-item.active {
      background: var(--sidebar-active-bg);
      color: #2563eb;
    }
    .nav-icon {
      font-size: 1rem;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }
    .nav-label {
      flex: 1;
    }
    .nav-badge {
      background: var(--accent-danger);
      color: white;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 6px;
      min-width: 18px;
      text-align: center;
    }
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .sidebar-user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
    }
    .sidebar-user-details {
      flex: 1;
      min-width: 0;
    }
    .sidebar-user-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-user-role {
      font-size: 0.65rem;
      color: #64748b;
    }
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 10px 12px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--sidebar-text);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .logout-btn:hover {
      background: rgba(220, 38, 38, 0.15);
      color: #f87171;
    }

    /* Desktop: always visible */
    @media (min-width: 768px) {
      .sidebar {
        transform: translateX(0) !important;
      }
      .sidebar-close {
        display: none !important;
      }
    }

    /* Mobile: hamburger shows close button */
    @media (max-width: 767px) {
      .sidebar-close {
        display: flex;
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() currentPage = signal<string>('dashboard');
  @Input() sidebarOpen = false;
  @Output() pageChanged = new EventEmitter<string>();
  @Output() sidebarClosed = new EventEmitter<void>();

  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  navItems = signal<NavItem[]>([
    { id: 'dashboard', label: 'Dashboard', icon: 'pi-home' },
    { id: 'expenses', label: 'List of Data', icon: 'pi-wallet' },
    { id: 'loans', label: 'Loan Data', icon: 'pi-history' },
    { id: 'history', label: 'History', icon: 'pi-clock' },
  ]);
  pendingCount = signal(0);
  openLoanCount = signal(0);

  ngOnInit() {
    const stored = this.authService.getCurrentUser();
    this.currentUser.set(stored);
    this.updateNav();
  }

  navigate(id: string) {
    this.currentPage.set(id);
    this.pageChanged.emit(id);
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
      { id: 'dashboard', label: 'Dashboard', icon: 'pi-home' },
      { id: 'expenses', label: 'List of Data', icon: 'pi-wallet', badge: this.pendingCount() },
      { id: 'loans', label: 'Loan Data', icon: 'pi-history', badge: this.openLoanCount() },
      { id: 'history', label: 'History', icon: 'pi-clock' },
      ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: 'pi-chart-bar' }] : []),
    ]);
  }
}
