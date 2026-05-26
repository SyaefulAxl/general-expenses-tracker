import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseStatus, LoanStatus } from '@core/models';

type Status = ExpenseStatus | LoanStatus | string;

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="badgeClass">{{ label }}</span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 2px 8px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .badge-green { background: var(--accent-success-subtle); color: var(--accent-success); }
    .badge-red { background: var(--accent-danger-subtle); color: var(--accent-danger); }
    .badge-yellow { background: var(--accent-warning-subtle); color: var(--accent-warning); }
    .badge-blue { background: var(--accent-primary-subtle); color: var(--accent-primary); }
    .badge-gray { background: var(--bg-tertiary); color: var(--text-muted); }
  `]
})
export class StatusBadgeComponent {
  @Input() status: Status = 'DRAFT';

  get badgeClass(): string {
    const map: Record<string, string> = {
      'APPROVED': 'badge-green',
      'FULLY_SETTLED': 'badge-green',
      'PENDING': 'badge-yellow',
      'PARTIAL': 'badge-yellow',
      'REJECTED': 'badge-red',
      'DRAFT': 'badge-gray',
      'UNSETTLED': 'badge-blue',
      'OVERPAID': 'badge-red',
    };
    return map[this.status] || 'badge-gray';
  }

  get label(): string {
    return this.status.replace(/_/g, ' ');
  }
}
