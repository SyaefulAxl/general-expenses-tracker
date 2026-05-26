import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon">{{ icon }}</div>
      <div class="empty-title">{{ title }}</div>
      <div class="empty-sub" *ngIf="subtitle">{{ subtitle }}</div>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }
    .empty-icon { font-size: 2.5rem; margin-bottom: 12px; opacity: 0.4; }
    .empty-title { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px; }
    .empty-sub { font-size: 0.75rem; color: var(--text-subtle); }
  `]
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'No data';
  @Input() subtitle = '';
}
