import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar" [ngClass]="avatarClass" [title]="name">
      {{ initials }}
    </div>
  `,
  styles: [`
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }
    .avatar-syaeful { background: #7C3AED; }
    .avatar-winda { background: #DB2777; }
    .avatar-dina { background: #0891B2; }
    .avatar-system { background: #64748B; }
  `]
})
export class AvatarComponent {
  @Input() name = '';

  get initials(): string {
    if (!this.name) return '?';
    return this.name.charAt(0).toUpperCase();
  }

  get avatarClass(): string {
    const nameMap: Record<string, string> = {
      'Syaeful': 'avatar-syaeful',
      'Winda': 'avatar-winda',
      'Dina': 'avatar-dina',
      'System': 'avatar-system',
    };
    return nameMap[this.name] || 'avatar-system';
  }
}
