import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseStatus, LoanStatus } from '@core/models';

type Status = ExpenseStatus | LoanStatus | string;

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngStyle]="badgeStyle">{{ label }}</span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 3px 9px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: Status = 'DRAFT';

  get badgeStyle(): Record<string, string> {
    const styles: Record<string, Record<string, string>> = {
      'APPROVED':      { background: '#dcfce7', color: '#16a34a' },
      'FULLY_SETTLED': { background: '#dcfce7', color: '#16a34a' },
      'PENDING':       { background: '#fef9c3', color: '#ca8a04' },
      'PARTIAL':       { background: '#fdf4ff', color: '#9333ea' },
      'DRAFT':         { background: '#f1f5f9', color: '#64748b' },
      'REJECTED':      { background: '#fee2e2', color: '#dc2626' },
      'UNSETTLED':     { background: '#fee2e2', color: '#dc2626' },
      'OVERPAID':      { background: '#fff7ed', color: '#ea580c' },
    };
    return styles[this.status] || { background: '#f1f5f9', color: '#64748b' };
  }

  get label(): string {
    const labels: Record<string, string> = {
      'DRAFT':         'Draf',
      'PENDING':       'Menunggu',
      'APPROVED':      'Disetujui',
      'REJECTED':      'Ditolak',
      'UNSETTLED':     'Belum Lunas',
      'PARTIAL':       'Sebagian',
      'FULLY_SETTLED': 'Lunas',
      'OVERPAID':      'Lebih Bayar',
    };
    return labels[this.status] ?? this.status.replace(/_/g, ' ');
  }
}
