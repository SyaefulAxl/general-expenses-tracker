import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import { User, UserRole } from '@core/models';
import { AdminFiltersComponent, RoleFilter } from './admin-filters.component';
import { AdminUserCardComponent } from './admin-user-card.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, AdminFiltersComponent, AdminUserCardComponent],
  template: `
    <div class="admin-wrap">

      @if (!isAdmin()) {
        <div class="access-denied">
          <div class="denied-card">
            <div class="denied-lock"><i class="pi pi-lock"></i></div>
            <h2 class="denied-title">Access denied</h2>
            <p class="denied-text">This page is restricted to administrators only.</p>
            <p class="denied-hint">Your current role does not have permission to view user management.</p>
          </div>
        </div>
      }

      @if (isAdmin()) {
        <header class="page-header">
          <div>
            <h1 class="page-title">Admin panel</h1>
            <p class="page-sub">User management &amp; access control</p>
          </div>
          <div class="header-badge">
            <span class="admin-badge">Admin</span>
            <span class="user-count"><span class="num">{{ nonSystemUsers().length }}</span> users</span>
          </div>
        </header>

        <app-admin-filters
          [search]="searchQuery()"
          [role]="roleFilter()"
          (searchChange)="searchQuery.set($event)"
          (roleChange)="roleFilter.set($event)" />

        @if (filteredUsers().length > 0) {
          <div class="user-grid">
            @for (user of filteredUsers(); track user.id) {
              <app-admin-user-card
                [user]="user"
                (toggleRole)="onToggleRole($event)"
                (toggleActive)="onToggleActive($event)" />
            }
          </div>
        } @else {
          <div class="empty-state">
            <i class="pi pi-users empty-icon"></i>
            <span class="empty-title">No users found</span>
            <span class="empty-sub">Try adjusting your search or filter.</span>
          </div>
        }
      }

    </div>
  `,
  styles: [`
    .admin-wrap {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .access-denied {
      display: flex; align-items: center; justify-content: center;
      min-height: 60vh;
    }
    .denied-card {
      max-width: 380px; text-align: center;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 32px 24px;
      box-shadow: var(--shadow);
    }
    .denied-lock {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: var(--danger-soft);
      color: var(--danger);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 16px;
    }
    .denied-title { font-size: 1.2rem; font-weight: 700; color: var(--text); margin: 0 0 8px; letter-spacing: -0.01em; }
    .denied-text  { font-size: 0.88rem; color: var(--text-muted); margin: 0 0 6px; }
    .denied-hint  { font-size: 0.78rem; color: var(--text-faint); margin: 0; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 12px; margin-bottom: 18px; flex-wrap: wrap;
    }
    .page-title { font-size: 1.5rem; font-weight: 800; color: var(--text); margin: 0; letter-spacing: -0.02em; }
    .page-sub   { font-size: 0.8rem; color: var(--text-subtle); margin: 4px 0 0; }
    .header-badge { display: inline-flex; align-items: center; gap: 8px; }
    .admin-badge {
      padding: 3px 10px; border-radius: 999px;
      background: var(--accent-soft); color: var(--accent);
      font-size: 0.65rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .user-count { font-size: 0.78rem; color: var(--text-subtle); }

    .user-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 60px 24px; gap: 8px; text-align: center;
    }
    .empty-icon  { font-size: 2.5rem; color: var(--text-faint); }
    .empty-title { font-size: 0.95rem; font-weight: 700; color: var(--text-muted); }
    .empty-sub   { font-size: 0.78rem; color: var(--text-faint); }
  `]
})
export class AdminComponent {
  private readonly mockData = inject(MockDataService);
  private readonly auth = inject(AuthService);

  protected readonly searchQuery = signal('');
  protected readonly roleFilter  = signal<RoleFilter>('ALL');

  protected readonly isAdmin = computed(() => this.auth.getCurrentUser()?.role === 'ADMIN');

  protected readonly nonSystemUsers = computed(() =>
    this.mockData.users().filter(u => !u.isSystem)
  );

  protected readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const role = this.roleFilter();
    return this.nonSystemUsers().filter(u => {
      const matchRole = role === 'ALL' || u.role === role;
      const matchSearch = !q
        || u.name.toLowerCase().includes(q)
        || (u.email ?? '').toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  });

  onToggleRole(user: User): void {
    const newRole: UserRole = user.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    this.mockData.updateUserRole(user.id, newRole);
  }

  onToggleActive(user: User): void {
    this.mockData.updateUserActive(user.id, !user.isActive);
  }
}
