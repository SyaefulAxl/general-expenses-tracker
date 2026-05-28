import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type RoleFilter = 'ALL' | 'ADMIN' | 'MEMBER';

@Component({
  selector: 'app-admin-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-row">
      <div class="search-box">
        <i class="pi pi-search search-icon"></i>
        <input
          type="text"
          class="search-input"
          placeholder="Search users…"
          [(ngModel)]="search"
          (ngModelChange)="searchChange.emit($event)" />
      </div>
      <div class="role-filter-chips">
        <button type="button" class="chip" [class.active]="role === 'ALL'"    (click)="roleChange.emit('ALL')">All</button>
        <button type="button" class="chip" [class.active]="role === 'ADMIN'"  (click)="roleChange.emit('ADMIN')">Admin</button>
        <button type="button" class="chip" [class.active]="role === 'MEMBER'" (click)="roleChange.emit('MEMBER')">Member</button>
      </div>
    </div>
  `,
  styles: [`
    .search-row {
      display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
      margin-bottom: 18px;
    }
    .search-box {
      position: relative; flex: 1; min-width: 220px;
    }
    .search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: var(--text-faint); font-size: 0.85rem;
    }
    .search-input {
      width: 100%; padding: 9px 12px 9px 36px;
      border: 1px solid var(--border); border-radius: var(--radius-sm);
      font-size: 0.85rem; outline: none; font-family: inherit;
      background: var(--surface); color: var(--text);
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
    .search-input::placeholder { color: var(--text-faint); }

    .role-filter-chips { display: flex; gap: 4px; }
    .chip {
      padding: 6px 14px; border-radius: 999px; font-size: 0.75rem; font-weight: 600;
      border: 1px solid var(--border); background: var(--surface); color: var(--text-subtle);
      cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
      font-family: inherit;
    }
    .chip:hover { background: var(--surface-muted); color: var(--text); }
    .chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }
  `]
})
export class AdminFiltersComponent {
  @Input() search = '';
  @Input() role: RoleFilter = 'ALL';

  @Output() searchChange = new EventEmitter<string>();
  @Output() roleChange   = new EventEmitter<RoleFilter>();
}
