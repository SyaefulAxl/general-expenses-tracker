import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { MockDataService } from '@core/services/mock-data.service';
import { User, UserRole } from '@core/models';

interface CurrentUser {
  id: number;
  name: string;
  username: string;
  role: UserRole;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AvatarComponent,
  ],
  template: `
    <div class="admin-wrap">

      <!-- ── Access denied ──────────────────────────────────────────── -->
      @if (!isAdmin()) {
        <div class="access-denied">
          <div class="denied-card">
            <div class="denied-lock">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="lock-svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 class="denied-title">Access Denied</h2>
            <p class="denied-text">This page is restricted to administrators only.</p>
            <p class="denied-hint">Your current role does not have permission to view user management.</p>
          </div>
        </div>
      }

      <!-- ── Admin panel ─────────────────────────────────────────────── -->
      @if (isAdmin()) {

        <!-- Page header -->
        <header class="page-header">
          <div>
            <h1 class="page-title">Admin Panel</h1>
            <p class="page-sub">User management &amp; access control</p>
          </div>
          <div class="header-badge">
            <span class="admin-badge">Admin</span>
            <span class="user-count">{{ nonSystemUsers().length }} users</span>
          </div>
        </header>

        <!-- Search / filter row -->
        <div class="search-row">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
            <input
              type="text"
              class="search-input"
              placeholder="Search users..."
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearch($event)" />
          </div>
          <div class="role-filter-chips">
            <button class="chip" [class.active]="roleFilter() === 'ALL'" (click)="roleFilter.set('ALL')">All</button>
            <button class="chip" [class.active]="roleFilter() === 'ADMIN'" (click)="roleFilter.set('ADMIN')">Admin</button>
            <button class="chip" [class.active]="roleFilter() === 'MEMBER'" (click)="roleFilter.set('MEMBER')">Member</button>
          </div>
        </div>

        <!-- User cards grid -->
        @if (filteredUsers().length > 0) {
          <div class="user-grid">
            @for (user of filteredUsers(); track user.id) {
              <div class="user-card" [class.inactive-card]="!user.isActive">

                <!-- Card top: avatar + info + role badge -->
                <div class="user-card-top">
                  <div class="user-avatar-wrap">
                    <app-avatar [name]="user.name"></app-avatar>
                    <span class="user-status-dot" [class.dot-active]="user.isActive" [class.dot-inactive]="!user.isActive"></span>
                  </div>
                  <div class="user-info">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-email">{{ user.email }}</span>
                  </div>
                  <span class="role-badge" [class.role-admin]="user.role === 'ADMIN'" [class.role-member]="user.role !== 'ADMIN'">
                    {{ user.role }}
                  </span>
                </div>

                <!-- Status row -->
                <div class="user-card-status">
                  <div class="status-pill" [class.status-active]="user.isActive" [class.status-inactive]="!user.isActive">
                    <span class="status-dot-inner"></span>
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </div>
                </div>

                <!-- Divider -->
                <div class="card-divider"></div>

                <!-- Actions -->
                <div class="user-card-actions">
                  <button
                    class="action-btn role-btn"
                    (click)="toggleRole(user)"
                    [title]="user.role === 'ADMIN' ? 'Downgrade to Member' : 'Promote to Admin'">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="action-icon">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                    </svg>
                    {{ user.role === 'ADMIN' ? 'Make Member' : 'Make Admin' }}
                  </button>
                  <button
                    class="action-btn"
                    [class.deactivate-btn]="user.isActive"
                    [class.activate-btn]="!user.isActive"
                    (click)="toggleActive(user)"
                    [title]="user.isActive ? 'Deactivate user' : 'Activate user'">
                    @if (user.isActive) {
                      <svg viewBox="0 0 20 20" fill="currentColor" class="action-icon">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                      </svg>
                      Deactivate
                    } @else {
                      <svg viewBox="0 0 20 20" fill="currentColor" class="action-icon">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      Activate
                    }
                  </button>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <span class="empty-icon">👥</span>
            <span class="empty-title">No users found</span>
            <span class="empty-sub">Try adjusting your search or filter.</span>
          </div>
        }

      }

    </div>
  `,
  styles: [`
    /* ── Wrap ── */
    .admin-wrap {
      padding: 24px;
      max-width: 1100px;
      margin: 0 auto;
    }

    /* ── Access Denied ── */
    .access-denied {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 480px;
      padding: 24px;
    }
    .denied-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 48px 40px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .denied-lock {
      width: 72px;
      height: 72px;
      background: #fef2f2;
      border: 2px solid #fecaca;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }
    .lock-svg {
      width: 36px;
      height: 36px;
      color: #ef4444;
    }
    .denied-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .denied-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }
    .denied-hint {
      font-size: 0.82rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 2px;
    }
    .page-sub {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
    }
    .header-badge {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .admin-badge {
      background: #ede9fe;
      color: #7c3aed;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 12px;
      border-radius: 999px;
    }
    .user-count {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    /* ── Search row ── */
    .search-row {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 200px;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      width: 16px;
      height: 16px;
      color: #94a3b8;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 9px 14px 9px 36px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #0f172a;
      background: #ffffff;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .search-input::placeholder { color: #94a3b8; }
    .search-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }
    .role-filter-chips {
      display: flex;
      gap: 6px;
    }
    .chip {
      padding: 7px 14px;
      border-radius: 999px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      font-size: 0.78rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip:hover { border-color: #94a3b8; color: #0f172a; }
    .chip.active { background: #0f172a; border-color: #0f172a; color: #ffffff; }

    /* ── User grid ── */
    .user-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    /* ── User card ── */
    .user-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: box-shadow 0.15s;
    }
    .user-card:hover {
      box-shadow: 0 4px 14px rgba(0,0,0,0.1);
    }
    .user-card.inactive-card {
      opacity: 0.65;
    }

    /* Card top */
    .user-card-top {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .user-avatar-wrap {
      position: relative;
      flex-shrink: 0;
    }
    .user-status-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid #ffffff;
    }
    .dot-active  { background: #059669; }
    .dot-inactive { background: #ef4444; }

    .user-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .user-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .user-email {
      font-size: 0.75rem;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Role badge */
    .role-badge {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      font-size: 0.62rem;
      font-weight: 700;
      padding: 3px 9px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .role-admin {
      background: #ede9fe;
      color: #7c3aed;
    }
    .role-member {
      background: #eff6ff;
      color: #2563eb;
    }

    /* Status */
    .user-card-status {}
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-pill.status-active {
      background: #f0fdf4;
      color: #059669;
    }
    .status-pill.status-inactive {
      background: #fef2f2;
      color: #ef4444;
    }
    .status-dot-inner {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    /* Divider */
    .card-divider {
      height: 1px;
      background: #f1f5f9;
      margin: 0 -4px;
    }

    /* Actions */
    .user-card-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .action-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .action-icon {
      width: 13px;
      height: 13px;
      flex-shrink: 0;
    }
    .role-btn {
      background: #f8fafc;
      border-color: #e2e8f0;
      color: #374151;
    }
    .role-btn:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .deactivate-btn {
      background: #fef2f2;
      border-color: #fecaca;
      color: #ef4444;
    }
    .deactivate-btn:hover {
      background: #fee2e2;
    }
    .activate-btn {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #059669;
    }
    .activate-btn:hover {
      background: #dcfce7;
    }

    /* ── Empty state ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 56px 24px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
      gap: 8px;
      text-align: center;
    }
    .empty-icon {
      font-size: 2.8rem;
      margin-bottom: 4px;
    }
    .empty-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }
    .empty-sub {
      font-size: 0.85rem;
      color: #64748b;
    }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .user-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .admin-wrap { padding: 16px; }
      .user-grid { grid-template-columns: 1fr; }
      .search-row { flex-direction: column; align-items: stretch; }
      .search-box { min-width: unset; }
      .denied-card { padding: 32px 24px; }
    }
  `]
})
export class AdminComponent {
  private readonly mockData = inject(MockDataService);

  // Current user from localStorage or default
  private readonly _currentUser = signal<CurrentUser>(this.loadCurrentUser());

  // Search / filter state
  searchQuery = '';
  readonly roleFilter = signal<'ALL' | 'ADMIN' | 'MEMBER'>('ALL');
  private readonly _searchQuery = signal<string>('');

  private loadCurrentUser(): CurrentUser {
    try {
      const stored = localStorage.getItem('gen_expenses_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore parse errors
    }
    return { id: 1, name: 'Syaeful', username: 'syaeful', role: 'ADMIN' };
  }

  readonly isAdmin = computed(() => this._currentUser().role === 'ADMIN');

  // Non-system users only
  readonly nonSystemUsers = computed(() =>
    this.mockData.users().filter(u => !u.isSystem)
  );

  // Filtered by search + role
  readonly filteredUsers = computed(() => {
    const q = this._searchQuery().toLowerCase().trim();
    const role = this.roleFilter();
    return this.nonSystemUsers().filter(u => {
      const matchRole = role === 'ALL' || u.role === role;
      const matchSearch = !q ||
        u.name.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  });

  onSearch(value: string): void {
    this._searchQuery.set(value);
  }

  toggleRole(user: User): void {
    const newRole: UserRole = user.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    this.mockData.updateUserRole(user.id, newRole);
  }

  toggleActive(user: User): void {
    this.mockData.updateUserActive(user.id, !user.isActive);
  }
}
