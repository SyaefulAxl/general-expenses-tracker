import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-screen">
      <div class="loading-content">
        <div class="brand-mark">฿</div>
        <div class="brand-text">Expenses Tracker</div>
        <div class="spinner-wrapper">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-screen {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-muted);
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .brand-mark {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: var(--accent);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      font-weight: 800;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
    }

    .brand-text {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text);
    }

    .spinner-wrapper {
      margin-top: 8px;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoadingComponent {}
