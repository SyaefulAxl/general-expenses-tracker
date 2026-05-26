import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { AuthService } from '@core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, LoadingComponent],
  template: `
    @if (isCheckingAuth()) {
      <app-loading></app-loading>
    } @else if (showShell()) {
      <div class="app-shell" [class.dark]="isDarkMode()">
        @if (sidebarOpen()) {
          <div class="sidebar-backdrop" (click)="closeSidebar()"></div>
        }

        <app-sidebar
          [currentPage]="currentPage"
          [sidebarOpen]="sidebarOpen()"
          (pageChanged)="onNavigate($event)"
          (sidebarClosed)="closeSidebar()">
        </app-sidebar>

        <div class="main-wrapper">
          <header class="topbar">
            <div class="topbar-left">
              <button class="hamburger topbar-btn" (click)="toggleSidebar()" aria-label="Toggle menu">
                <i class="pi pi-bars"></i>
              </button>
              <h1 class="topbar-title">{{ getPageTitle() }}</h1>
            </div>
            <div class="topbar-right">
              <button class="topbar-btn" (click)="toggleTheme()" [title]="isDarkMode() ? 'Light mode' : 'Dark mode'">
                <i [class]="isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'"></i>
              </button>
            </div>
          </header>
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
    .app-shell {
      display: flex;
      min-height: 100vh;
    }
    .main-wrapper {
      flex: 1;
      margin-left: var(--sidebar-width);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      transition: margin-left 0.3s ease;
    }
    .topbar {
      height: var(--topbar-height);
      background: var(--topbar-bg);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .topbar-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .topbar-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
      font-size: 1rem;
    }
    .topbar-btn:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }
    .hamburger {
      display: none;
    }
    .page-content {
      flex: 1;
      padding: 24px;
    }
    .sidebar-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 90;
      backdrop-filter: blur(2px);
    }

    /* Mobile styles */
    @media (max-width: 767px) {
      .hamburger {
        display: flex !important;
      }
      .main-wrapper {
        margin-left: 0;
      }
      .page-content {
        padding: 16px;
      }
      .sidebar-backdrop {
        display: block;
      }
    }
  `]
})
export class App implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  currentPage = signal('dashboard');
  isDarkMode = signal(false);
  sidebarOpen = signal(false);
  isCheckingAuth = signal(true);
  showShell = signal(false);

  private pageTitles: Record<string, string> = {
    'dashboard': 'Dashboard',
    'expenses': 'List of Data',
    'loans': 'Loan Data',
    'history': 'History',
    'admin': 'Admin Panel'
  };

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode.set(true);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.isDarkMode.set(true);
    }

    // Initial auth check
    if (this.authService.isLoggedIn()) {
      this.showShell.set(true);
      this.isCheckingAuth.set(false);
    } else {
      this.showShell.set(false);
      this.isCheckingAuth.set(false);
    }

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = (e.urlAfterRedirects || '/').split('/').pop() || 'dashboard';
        this.currentPage.set(url);
        this.sidebarOpen.set(false);

        // Check auth after navigation
        if (!this.authService.isLoggedIn() && url !== 'login') {
          this.showShell.set(false);
        } else if (this.authService.isLoggedIn()) {
          this.showShell.set(true);
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

  toggleTheme() {
    this.isDarkMode.update(v => !v);
    localStorage.setItem('theme', this.isDarkMode() ? 'dark' : 'light');
  }
}
