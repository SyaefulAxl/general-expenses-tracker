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
          <div class="brand-icon">💰</div>
          <div class="brand-text">
            <span class="brand-title">Expenses Tracker</span>
            <span class="brand-subtitle">General Expenses</span>
          </div>
        </div>

        <!-- Heading -->
        <div class="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to your account</p>
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
            <label for="username">Username</label>
            <input
              pInputText
              id="username"
              type="text"
              [(ngModel)]="username"
              name="username"
              placeholder="Enter your username"
              [disabled]="isLoading()"
              autocomplete="username"
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
            [disabled]="isLoading() || !username || !password"
            class="p-button-primary w-full">
          </button>
        </form>

        <!-- Accounts Info -->
        <div class="accounts-box">
          <div class="accounts-title">Available Accounts</div>
          <div class="account-row">
            <span class="account-name">👤 Syaeful</span>
            <code>syaeful</code>
          </div>
          <div class="account-row">
            <span class="account-name">👤 Winda</span>
            <code>winda</code>
          </div>
          <div class="account-row">
            <span class="account-name">👤 Dina</span>
            <code>dina</code>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="login-footer">
        <span>General Expenses Tracker &copy; 2026</span>
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
      background: #f1f5f9;
      padding: 20px;
    }

    .login-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }

    .login-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
    }

    .brand-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #3b82f6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      flex-shrink: 0;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-weight: 700;
      font-size: 1.1rem;
      color: #1e293b;
      line-height: 1.2;
    }

    .brand-subtitle {
      font-weight: 400;
      font-size: 0.75rem;
      color: #64748b;
    }

    .login-heading {
      margin-bottom: 24px;
    }

    .login-heading h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 6px;
    }

    .login-heading p {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
    }

    .error-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #fef2f2;
      color: #dc2626;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 20px;
      border: 1px solid #fecaca;
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
      color: #475569;
    }

    .form-field input {
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #1e293b;
      background: #ffffff;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-field input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .form-field input::placeholder {
      color: #94a3b8;
    }

    .w-full {
      width: 100%;
    }

    .accounts-box {
      margin-top: 24px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .accounts-title {
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 10px;
    }

    .account-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
    }

    .account-name {
      font-size: 0.8rem;
      color: #475569;
    }

    code {
      font-size: 0.75rem;
      color: #3b82f6;
      background: #eff6ff;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #dbeafe;
    }

    .login-footer {
      margin-top: 24px;
      font-size: 0.75rem;
      color: #94a3b8;
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

  username = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal('');

  onSubmit() {
    if (!this.username || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.authService.setCurrentUser(res);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Invalid username or password. Please try again.');
      }
    });
  }
}
