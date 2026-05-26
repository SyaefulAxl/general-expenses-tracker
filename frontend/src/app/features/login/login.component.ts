import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <!-- Brand -->
        <div class="login-brand">
          <div class="brand-mark">฿</div>
          <div class="brand-text">
            <span class="brand-title">Expenses Tracker</span>
            <span class="brand-subtitle">Thailand Trip</span>
          </div>
        </div>

        <!-- Heading -->
        <div class="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to access your dashboard</p>
        </div>

        <!-- Error Alert -->
        @if (errorMessage()) {
          <div class="error-alert">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-field">
            <label for="email">Email</label>
            <input
              pInputText
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="Enter your email"
              [disabled]="isLoading()"
              autocomplete="email"
              class="w-full">
          </div>

          <div class="form-field">
            <label for="password">Password</label>
            <input
              pInputText
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Enter your password"
              [disabled]="isLoading()"
              autocomplete="current-password"
              class="w-full">
          </div>

          <button
            pButton
            type="submit"
            [label]="isLoading() ? 'Signing in...' : 'Sign In'"
            [icon]="isLoading() ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'"
            [disabled]="isLoading() || !email || !password"
            class="p-button-primary w-full">
          </button>
        </form>

        <!-- Demo Credentials -->
        <div class="demo-box">
          <div class="demo-title">Demo Credentials</div>
          <div class="demo-row">
            <span class="demo-label">Email:</span>
            <code class="demo-value">syaeful&#64;texcoms.my.id</code>
          </div>
          <div class="demo-row">
            <span class="demo-label">Password:</span>
            <code class="demo-value">Texcoms&#64;2025!</code>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="login-footer">
        <span>Thailand Expenses Tracker &copy; 2026</span>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      padding: 20px;
    }

    .login-card {
      background: var(--surface-card);
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .login-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
    }

    .brand-mark {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: var(--accent-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      font-weight: 800;
      flex-shrink: 0;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .brand-subtitle {
      font-weight: 400;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .login-heading {
      margin-bottom: 24px;
    }

    .login-heading h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 6px;
    }

    .login-heading p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0;
    }

    .error-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--accent-danger-subtle);
      color: var(--accent-danger);
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 20px;
      border: 1px solid var(--accent-danger);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-field label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .w-full {
      width: 100%;
    }

    .demo-box {
      margin-top: 24px;
      padding: 16px;
      background: var(--bg-tertiary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .demo-title {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 10px;
    }

    .demo-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
    }

    .demo-label {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .demo-value {
      font-size: 0.8rem;
      color: var(--text-primary);
      background: var(--surface-card);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }

    .login-footer {
      margin-top: 24px;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 28px 20px;
      }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal('');

  onSubmit() {
    if (!this.email || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Invalid email or password. Please try again.');
      }
    });
  }
}
