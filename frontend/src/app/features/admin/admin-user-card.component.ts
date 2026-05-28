import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { User } from '@core/models';

@Component({
  selector: 'app-admin-user-card',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <div class="user-card" [class.inactive-card]="!user.isActive">
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

      <div class="user-card-status">
        <div class="status-pill" [class.status-active]="user.isActive" [class.status-inactive]="!user.isActive">
          <span class="status-dot-inner"></span>
          <span>{{ user.isActive ? 'Active' : 'Inactive' }}</span>
        </div>
      </div>

      <div class="card-divider"></div>

      <div class="user-card-actions">
        <button
          type="button"
          class="action-btn role-btn"
          (click)="toggleRole.emit(user)"
          [title]="user.role === 'ADMIN' ? 'Downgrade to Member' : 'Promote to Admin'">
          <i class="pi pi-user-edit action-icon"></i>
          <span>{{ user.role === 'ADMIN' ? 'Make Member' : 'Make Admin' }}</span>
        </button>
        <button
          type="button"
          class="action-btn"
          [class.deactivate-btn]="user.isActive"
          [class.activate-btn]="!user.isActive"
          (click)="toggleActive.emit(user)"
          [title]="user.isActive ? 'Deactivate user' : 'Activate user'">
          @if (user.isActive) {
            <i class="pi pi-times action-icon"></i>
            <span>Deactivate</span>
          } @else {
            <i class="pi pi-check action-icon"></i>
            <span>Activate</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .user-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 16px;
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.18s, transform 0.18s, opacity 0.2s;
      display: flex; flex-direction: column; gap: 12px;
    }
    .user-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
    .inactive-card { opacity: 0.65; }

    .user-card-top {
      display: flex; align-items: flex-start; gap: 12px;
    }
    .user-avatar-wrap { position: relative; flex-shrink: 0; }
    .user-status-dot {
      position: absolute; bottom: -2px; right: -2px;
      width: 12px; height: 12px; border-radius: 50%;
      border: 2px solid var(--surface);
    }
    .dot-active   { background: var(--success); }
    .dot-inactive { background: var(--text-faint); }

    .user-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .user-name  { font-size: 0.9rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
    .user-email { font-size: 0.72rem; color: var(--text-subtle); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .role-badge {
      flex-shrink: 0;
      font-size: 0.62rem; font-weight: 700;
      padding: 3px 8px; border-radius: 999px;
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .role-admin  { background: var(--accent-soft);  color: var(--accent); }
    .role-member { background: var(--surface-sunken); color: var(--text-subtle); }

    .status-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: 999px;
      font-size: 0.7rem; font-weight: 600;
    }
    .status-active   { background: var(--success-soft); color: var(--success); }
    .status-inactive { background: var(--surface-sunken); color: var(--text-subtle); }
    .status-dot-inner {
      width: 6px; height: 6px; border-radius: 50%; background: currentColor;
    }

    .card-divider { height: 1px; background: var(--surface-sunken); }

    .user-card-actions { display: flex; gap: 8px; }
    .action-btn {
      flex: 1;
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 7px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-muted);
      font-size: 0.74rem; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .action-icon { font-size: 0.78rem; }
    .action-btn:hover { background: var(--surface-muted); color: var(--text); }
    .role-btn:hover { color: var(--accent); border-color: var(--accent); }
    .deactivate-btn:hover { color: var(--danger);  border-color: var(--danger);  background: var(--danger-soft); }
    .activate-btn:hover   { color: var(--success); border-color: var(--success); background: var(--success-soft); }
  `]
})
export class AdminUserCardComponent {
  @Input({ required: true }) user!: User;

  @Output() toggleRole   = new EventEmitter<User>();
  @Output() toggleActive = new EventEmitter<User>();
}
