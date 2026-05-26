import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-card" [class.accent]="accent">
      <div class="kpi-label">{{ label }}</div>
      <div class="kpi-value">
        <ng-content select="[slot=value]"></ng-content>
      </div>
      <div class="kpi-extra" *ngIf="fx"><ng-content select="[slot=fx]"></ng-content></div>
      <div class="kpi-delta" *ngIf="delta"><ng-content select="[slot=delta]"></ng-content></div>
    </div>
  `,
  styles: [`
    .kpi-card {
      background: var(--surface-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      padding: 20px;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
    }
    .kpi-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
    .kpi-card.accent { border-left: 3px solid var(--accent-primary); }
    .kpi-label {
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1;
    }
    .kpi-extra {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .kpi-delta {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  `]
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() accent = false;
  @Input() fx?: string;
  @Input() delta?: string;
}
