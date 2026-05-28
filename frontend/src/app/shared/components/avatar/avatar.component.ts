import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

const COLORS: Record<string, string> = {
  Syaeful: '#7c3aed',
  Winda:   '#db2777',
  Dina:    '#0891b2',
  System:  '#64748b',
};

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar"
      [style.width.px]="sizePx"
      [style.height.px]="sizePx"
      [style.font-size.px]="sizePx * 0.4"
      [style.background]="color"
      [title]="name">
      {{ initials }}
    </div>
  `,
  styles: [`
    .avatar {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #ffffff;
      flex-shrink: 0;
      letter-spacing: 0.01em;
    }
  `]
})
export class AvatarComponent {
  @Input() name = '';
  /** Size: 'xs' = 20px, 'sm' = 26px, 'md' = 32px (default), 'lg' = 40px, or pass number in px */
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | number = 'md';

  get sizePx(): number {
    if (typeof this.size === 'number') return this.size;
    const map: Record<string, number> = { xs: 20, sm: 26, md: 32, lg: 40 };
    return map[this.size] ?? 32;
  }

  get initials(): string {
    if (!this.name) return '?';
    const parts = this.name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }

  get color(): string {
    const first = this.name.trim().split(' ')[0];
    return COLORS[first] ?? '#64748b';
  }
}
