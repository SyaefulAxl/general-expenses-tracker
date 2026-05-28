import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, LoadingComponent],
  template: `
    @if (isCheckingAuth()) {
      <app-loading></app-loading>
    } @else if (showShell()) {
      <div class="app-shell">

        <!-- Mobile backdrop -->
        @if (sidebarOpen()) {
          <div class="sidebar-backdrop" (click)="closeSidebar()"></div>
        }

        <!-- Sidebar -->
        <app-sidebar
          [currentPage]="currentPage()"
          [sidebarOpen]="sidebarOpen()"
          (pageChanged)="onNavigate($event)"
          (sidebarClosed)="closeSidebar()">
        </app-sidebar>

        <!-- Main area -->
        <div class="main-wrapper">

          <!-- Topbar -->
          <header class="topbar">
            <div class="topbar-left">
              <!-- Hamburger (mobile only) -->
              <button class="hamburger" (click)="toggleSidebar()" aria-label="Open menu">
                <i class="pi pi-bars"></i>
              </button>
              <div class="topbar-page-info">
                <h1 class="topbar-title">{{ getPageTitle() }}</h1>
              </div>
            </div>

            <div class="topbar-right">
              @if (currentUser()) {
                <div class="topbar-user">
                  <!-- Avatar initials -->
                  <div class="topbar-avatar" [attr.aria-label]="currentUser()!.name">
                    {{ getInitials(currentUser()!.name) }}
                  </div>
                  <div class="topbar-user-info">
                    <span class="topbar-user-name">{{ currentUser()!.name }}</span>
                    <span
                      class="badge"
                      [class.badge-blue]="currentUser()!.role === 'ADMIN'"
                      [class.badge-gray]="currentUser()!.role !== 'ADMIN'">
                      {{ currentUser()!.role }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </header>

          <!-- Page content -->
          <main class="page-content">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    /* ── App shell ─────────────────────────────────────────── */
    .app-shell {
      display: flex;
      min-height: 100vh;
      background: var(--surface-muted);
    }

    /* ── Main wrapper (right of sidebar) ───────────────────── */
    .main-wrapper {
      flex: 1;
      margin-left: var(--sidebar-width, 260px);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-width: 0;
    }

    /* ── Topbar ────────────────────────────────────────────── */
    .topbar {
      height: var(--topbar-height, 56px);
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      position: sticky;
      top: 0;
      z-index: 50;
      gap: 16px;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .topbar-page-info {
      min-width: 0;
    }

    .topbar-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    /* ── Hamburger (mobile only) ───────────────────────────── */
    .hamburger {
      display: none;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-muted);
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .hamburger:hover {
      background: var(--surface-muted);
      color: var(--text);
    }

    /* ── Topbar user chip ──────────────────────────────────── */
    .topbar-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 10px 5px 5px;
      border-radius: 100px;
      border: 1px solid var(--border);
      background: var(--surface);
    }

    .topbar-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0.02em;
    }

    .topbar-user-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .topbar-user-name {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
    }

    /* ── Page content ──────────────────────────────────────── */
    .page-content {
      flex: 1;
      padding: 24px;
    }

    /* ── Sidebar backdrop (mobile) ─────────────────────────── */
    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(2px);
      z-index: 90;
    }

    /* ── Mobile ────────────────────────────────────────────── */
    @media (max-width: 767px) {
      .hamburger {
        display: flex;
      }

      .main-wrapper {
        margin-left: 0;
      }

      .page-content {
        padding: 16px;
      }

      .topbar-user-info .badge {
        display: none;
      }
    }

    /* ── Tablet ────────────────────────────────────────────── */
    @media (min-width: 768px) {
      .hamburger {
        display: none !important;
      }
    }
  `]
})
export class App implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  currentPage = signal('dashboard');
  sidebarOpen = signal(false);
  isCheckingAuth = signal(true);
  showShell = signal(false);
  currentUser = signal<User | null>(null);

  private pageTitles: Record<string, string> = {
    'dashboard': 'Dashboard',
    'expenses':  'Expenses',
    'loans':     'Loans',
    'history':   'History',
    'admin':     'Admin Panel',
  };

  ngOnInit() {
    // Resolve initial auth state
    if (this.authService.isLoggedIn()) {
      this.showShell.set(true);
      this.currentUser.set(this.authService.getCurrentUser());
    }
    this.isCheckingAuth.set(false);

    // Track navigation
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const url = (e.urlAfterRedirects || '/').split('/').filter(Boolean).pop() || 'dashboard';
        this.currentPage.set(url);
        this.sidebarOpen.set(false);

        if (this.authService.isLoggedIn() && url !== 'login') {
          this.showShell.set(true);
          this.currentUser.set(this.authService.getCurrentUser());
        } else if (!this.authService.isLoggedIn()) {
          this.showShell.set(false);
          this.currentUser.set(null);
        }
      });
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  onNavigate(page: string) {
    this.currentPage.set(page);
    this.sidebarOpen.set(false);
    this.router.navigate(['/', page]);
  }

  getPageTitle(): string {
    return this.pageTitles[this.currentPage()] || 'Dashboard';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
}
