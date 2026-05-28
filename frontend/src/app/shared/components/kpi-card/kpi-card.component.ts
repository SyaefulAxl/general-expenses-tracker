import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-card" [class.kpi-accent]="accent">
      <div class="kpi-icon" *ngIf="icon">{{ icon }}</div>
      <div class="kpi-label">{{ label }}</div>
      <div class="kpi-value">
        <ng-content select="[slot=value]"></ng-content>
      </div>
      <div class="kpi-extra" *ngIf="fx">
        <ng-content select="[slot=fx]"></ng-content>
      </div>
      <div class="kpi-delta" *ngIf="delta">
        <ng-content select="[slot=delta]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      padding: 20px 22px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    .kpi-card:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.09);
      transform: translateY(-2px);
    }
    .kpi-card.kpi-accent {
      border-left: 3px solid #2563eb;
    }
    .kpi-icon {
      font-size: 1.5rem;
      margin-bottom: 8px;
    }
    .kpi-label {
      font-size: 0.68rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .kpi-extra {
      font-size: 0.72rem;
      color: #94a3b8;
      margin-top: 5px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .kpi-delta {
      font-size: 0.72rem;
      color: #64748b;
      margin-top: 6px;
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
  @Input() icon?: string;
}
