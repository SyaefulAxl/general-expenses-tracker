import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
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
    TableModule,
    ButtonModule,
    Tooltip,
    AvatarComponent,
  ],
  template: `
    <div class="admin-wrap">

      <!-- ── Access denied ──────────────────────────────────────────── -->
      @if (!isAdmin()) {
        <div class="access-denied">
          <div class="denied-icon">🔒</div>
          <h2 class="denied-title">Access Denied</h2>
          <p class="denied-text">You need ADMIN role to access this page.</p>
        </div>
      }

      <!-- ── Admin panel ─────────────────────────────────────────────── -->
      @if (isAdmin()) {

        <!-- Page header -->
        <header class="page-header">
          <div>
            <h1 class="page-title">Admin Panel</h1>
            <p class="page-sub">User management</p>
          </div>
        </header>

        <!-- User list -->
        <div class="table-card">
          <p-table
            [value]="nonSystemUsers()"
            [paginator]="true"
            [rows]="10"
            styleClass="p-datatable-sm p-datatable-striped">

            <ng-template pTemplate="header">
              <tr>
                <th style="width: 250px;">User</th>
                <th>Email</th>
                <th style="width: 120px;">Role</th>
                <th style="width: 100px;">Status</th>
                <th style="width: 180px; text-align: center;">Actions</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-user>
              <tr>
                <!-- Avatar + Name -->
                <td class="cell-user">
                  <app-avatar [name]="user.name"></app-avatar>
                  <span class="user-name">{{ user.name }}</span>
                </td>

                <!-- Email -->
                <td class="cell-email">
                  {{ user.email }}
                </td>

                <!-- Role badge -->
                <td class="cell-role">
                  <span class="role-badge" [ngClass]="user.role === 'ADMIN' ? 'role-admin' : 'role-member'">
                    {{ user.role }}
                  </span>
                </td>

                <!-- Active status dot -->
                <td class="cell-status">
                  <div class="status-indicator">
                    <span class="status-dot" [ngClass]="user.isActive ? 'dot-active' : 'dot-inactive'"></span>
                    <span class="status-text">{{ user.isActive ? 'Active' : 'Inactive' }}</span>
                  </div>
                </td>

                <!-- Actions -->
                <td class="cell-actions">
                  <div class="action-buttons">
                    <!-- Toggle role -->
                    <button
                      pButton
                      type="button"
                      [label]="user.role === 'ADMIN' ? 'Make Member' : 'Make Admin'"
                      class="p-button-outlined p-button-sm p-button-secondary"
                      (click)="toggleRole(user)">
                    </button>

                    <!-- Toggle active -->
                    <button
                      pButton
                      type="button"
                      [icon]="user.isActive ? 'pi pi-times' : 'pi pi-check'"
                      [class]="user.isActive ? 'p-button-outlined p-button-sm p-button-danger' : 'p-button-outlined p-button-sm p-button-success'"
                      pTooltip="{{ user.isActive ? 'Deactivate' : 'Activate' }}"
                      tooltipPosition="top"
                      (click)="toggleActive(user)">
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="empty-cell">
                  <div class="empty-state">
                    <span class="empty-icon">👥</span>
                    <span class="empty-text">No users found</span>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

      }

    </div>
  `,
  styles: [`
    .admin-wrap {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ── Access denied ── */
    .access-denied {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 16px;
      text-align: center;
    }
    .denied-icon {
      font-size: 3rem;
    }
    .denied-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .denied-text {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin: 0;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 4px;
    }
    .page-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin: 0;
    }

    /* ── Table card ── */
    .table-card {
      background: var(--surface-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      background: var(--bg-tertiary);
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 16px;
      border-color: var(--border-color);
    }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      padding: 12px 16px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      border-color: var(--border-subtle);
      vertical-align: middle;
    }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
      background: var(--bg-tertiary);
    }
    :host ::ng-deep .p-paginator {
      padding: 12px 16px;
      font-size: 0.8rem;
    }

    /* ── Cells ── */
    .cell-user {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .user-name {
      font-weight: 600;
      color: var(--text-primary);
    }
    .cell-email {
      color: var(--text-muted);
      font-size: 0.8rem;
    }
    .cell-role {
      text-align: left;
    }
    .role-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 3px 10px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .role-admin {
      background: var(--accent-purple-subtle);
      color: var(--accent-purple);
    }
    .role-member {
      background: var(--accent-primary-subtle);
      color: var(--accent-primary);
    }
    .cell-status {
      text-align: left;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot-active {
      background: var(--accent-success);
    }
    .dot-inactive {
      background: var(--accent-danger);
    }
    .status-text {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .cell-actions {
      text-align: center;
    }
    .action-buttons {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    /* ── Empty state ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      gap: 12px;
    }
    .empty-icon {
      font-size: 2.5rem;
    }
    .empty-text {
      font-size: 0.9rem;
      color: var(--text-muted);
    }
  `]
})
export class AdminComponent {
  private readonly mockData = inject(MockDataService);

  // Current user from localStorage or default
  private readonly _currentUser = signal<CurrentUser>(this.loadCurrentUser());

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

  toggleRole(user: User): void {
    const newRole: UserRole = user.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    this.mockData.updateUserRole(user.id, newRole);
  }

  toggleActive(user: User): void {
    this.mockData.updateUserActive(user.id, !user.isActive);
  }
}
