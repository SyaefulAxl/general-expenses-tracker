import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-track">
      <div class="progress-fill" [ngClass]="fillClass" [style.width.%]="percent"></div>
    </div>
  `,
  styles: [`
    .progress-track {
      height: 6px;
      background: #F1F5F9;
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 9999px;
      background: #2563EB;
      transition: width 0.4s ease;
    }
    .progress-fill.danger { background: #EF4444; }
    .progress-fill.warning { background: #F59E0B; }
    .progress-fill.green { background: #10B981; }
  `]
})
export class ProgressBarComponent {
  @Input() value = 0;
  @Input() max = 100;
  @Input() variant?: 'default' | 'danger' | 'warning' | 'green';

  get percent(): number {
    if (this.max === 0) return 0;
    return Math.min(100, (this.value / this.max) * 100);
  }

  get fillClass(): string {
    if (this.percent >= 90) return 'danger';
    if (this.percent >= 70) return 'warning';
    if (this.variant) return this.variant;
    return '';
  }
}
