import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

interface DemoAccount { name: string; username: string; password: string; color: string; role: string; }

const DEMO_ACCOUNTS: DemoAccount[] = [
  { name: 'Syaeful', username: 'syaeful', password: 'Texcoms@2025!', color: '#7c3aed', role: 'ADMIN' },
  { name: 'Winda',   username: 'winda',   password: 'Texcoms@2025!', color: '#db2777', role: 'MEMBER' },
  { name: 'Dina',    username: 'dina',    password: 'Texcoms@2025!', color: '#0891b2', role: 'MEMBER' },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-root">

      <!-- ── Left hero panel ───────────────────────────────── -->
      <div class="login-hero" aria-hidden="true">
        <div class="hero-inner">
          <div class="hero-logo">
            <span class="hero-symbol">฿</span>
          </div>
          <h2 class="hero-title">Expenses Tracker</h2>
          <p class="hero-sub">Thailand Trip · Team Finance</p>

          <div class="hero-rates">
            <div class="rate-chip">฿1 THB = <strong>\$0.0293 USD</strong></div>
            <div class="rate-chip">฿1 THB = <strong>Rp 455 IDR</strong></div>
          </div>

          <div class="hero-features">
            <div class="feature-item">
              <span class="fi-icon">💳</span>
              <span>Track expenses effortlessly</span>
            </div>
            <div class="feature-item">
              <span class="fi-icon">🤝</span>
              <span>Split costs with your team</span>
            </div>
            <div class="feature-item">
              <span class="fi-icon">💰</span>
              <span>Manage loans &amp; repayments</span>
            </div>
            <div class="feature-item">
              <span class="fi-icon">💱</span>
              <span>THB · USD · IDR conversion</span>
            </div>
          </div>

          <div class="hero-team">
            @for (acc of demoAccounts; track acc.username) {
              <div class="team-chip">
                <div class="team-avatar" [style.background]="acc.color">{{ acc.name.charAt(0) }}</div>
                <div>
                  <div class="team-name">{{ acc.name }}</div>
                  <div class="team-role">{{ acc.role }}</div>
                </div>
              </div>
            }
          </div>
        </div>
        <div class="hero-circle hero-c1"></div>
        <div class="hero-circle hero-c2"></div>
        <div class="hero-circle hero-c3"></div>
      </div>

      <!-- ── Right form panel ───────────────────────────────── -->
      <div class="login-panel">
        <div class="form-wrap">

          <!-- Mobile logo -->
          <div class="mobile-brand">
            <div class="mobile-logo">฿</div>
            <div>
              <div class="mobile-brand-name">Expenses Tracker</div>
              <div class="mobile-brand-sub">Thailand Trip · Team Finance</div>
            </div>
          </div>

          <div class="form-heading">
            <h1 class="form-title">Welcome back</h1>
            <p class="form-desc">Sign in to your account to continue</p>
          </div>

          <!-- Error -->
          @if (errorMsg()) {
            <div class="error-alert" role="alert">
              <span>⚠️</span>
              <span>{{ errorMsg() }}</span>
            </div>
          }

          <!-- Form -->
          <form (ngSubmit)="onSubmit()" novalidate class="login-form">

            <div class="field">
              <label for="username" class="field-label">Username</label>
              <input
                id="username"
                type="text"
                [(ngModel)]="username"
                name="username"
                placeholder="Enter your username"
                autocomplete="username"
                [disabled]="isLoading()"
                class="field-input"
                required />
            </div>

            <div class="field">
              <label for="password" class="field-label">Password</label>
              <div class="pw-wrap">
                <input
                  id="password"
                  [type]="showPw() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  [disabled]="isLoading()"
                  class="field-input pw-input"
                  required />
                <button type="button" class="pw-toggle" (click)="showPw.update(v => !v)">
                  {{ showPw() ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <button
              type="submit"
              class="submit-btn"
              [disabled]="isLoading() || !username || !password">
              @if (isLoading()) {
                <span class="spinner"></span>
                <span>Signing in…</span>
              } @else {
                <span>Sign In</span>
              }
            </button>

          </form>

          <!-- Quick fill demo accounts -->
          <div class="demo-section">
            <div class="demo-label">Quick sign-in</div>
            <div class="demo-accounts">
              @for (acc of demoAccounts; track acc.username) {
                <button
                  type="button"
                  class="demo-btn"
                  [style.border-color]="acc.color"
                  (click)="fillDemo(acc)"
                  [disabled]="isLoading()">
                  <div class="demo-avatar" [style.background]="acc.color">{{ acc.name.charAt(0) }}</div>
                  <div class="demo-info">
                    <div class="demo-name">{{ acc.name }}</div>
                    <div class="demo-role">{{ acc.role }}</div>
                  </div>
                </button>
              }
            </div>
          </div>

          <div class="form-footer">
            Texcoms Worldwide · IT Department · May 2026
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-root {
      display: flex;
      min-height: 100vh;
      background: #f0f4f8;
    }

    /* ── Hero ──────────────────────────────────────────────── */
    .login-hero {
      flex: 1;
      background: linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #7c3aed 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 48px;
      min-height: 100vh;
    }
    @media (max-width: 768px) { .login-hero { display: none; } }

    .hero-inner {
      position: relative;
      z-index: 2;
      max-width: 420px;
      color: #ffffff;
    }
    .hero-logo {
      width: 64px; height: 64px;
      background: rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.8rem; font-weight: 900;
      margin-bottom: 24px;
      backdrop-filter: blur(8px);
    }
    .hero-symbol { letter-spacing: -0.02em; }
    .hero-title  { font-size: 2rem; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em; color: #ffffff; }
    .hero-sub    { font-size: 1rem; color: rgba(255,255,255,0.7); margin: 0 0 28px; }

    .hero-rates  { display: flex; gap: 10px; margin-bottom: 28px; flex-wrap: wrap; }
    .rate-chip   {
      padding: 6px 14px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
      border-radius: 999px; font-size: 0.78rem; color: rgba(255,255,255,0.9); backdrop-filter: blur(4px);
    }
    .rate-chip strong { color: #fde68a; }

    .hero-features { display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
    .feature-item  { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: rgba(255,255,255,0.85); }
    .fi-icon       { font-size: 1.1rem; width: 24px; }

    .hero-team { display: flex; gap: 10px; flex-wrap: wrap; }
    .team-chip {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px; background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2); border-radius: 10px;
      backdrop-filter: blur(4px);
    }
    .team-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      color: #fff; font-size: 0.75rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .team-name { font-size: 0.8rem; font-weight: 700; color: #ffffff; }
    .team-role { font-size: 0.65rem; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.04em; }

    .hero-circle {
      position: absolute; border-radius: 50%;
      background: rgba(255,255,255,0.05);
      pointer-events: none;
    }
    .hero-c1 { width: 400px; height: 400px; top: -120px; right: -100px; }
    .hero-c2 { width: 250px; height: 250px; bottom: -80px; left: -60px; }
    .hero-c3 { width: 180px; height: 180px; bottom: 120px; right: -60px; background: rgba(255,255,255,0.08); }

    /* ── Form panel ────────────────────────────────────────── */
    .login-panel {
      width: 480px;
      min-width: 380px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 40px;
      box-shadow: -8px 0 40px rgba(0,0,0,0.08);
    }
    @media (max-width: 768px) {
      .login-panel { width: 100%; min-width: unset; padding: 32px 24px; box-shadow: none; }
    }

    .form-wrap { width: 100%; max-width: 360px; }

    .mobile-brand {
      display: none;
      align-items: center; gap: 12px; margin-bottom: 32px;
    }
    @media (max-width: 768px) { .mobile-brand { display: flex; } }
    .mobile-logo {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: #fff; font-size: 1.3rem; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
    }
    .mobile-brand-name { font-size: 0.9rem; font-weight: 800; color: #0f172a; }
    .mobile-brand-sub  { font-size: 0.72rem; color: #64748b; }

    .form-heading   { margin-bottom: 28px; }
    .form-title     { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0 0 6px; letter-spacing: -0.02em; }
    .form-desc      { font-size: 0.875rem; color: #64748b; margin: 0; }

    .error-alert {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 14px; background: #fef2f2;
      border: 1.5px solid #fecaca; border-radius: 10px;
      font-size: 0.875rem; color: #dc2626; margin-bottom: 20px;
    }

    .login-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 0.78rem; font-weight: 700; color: #334155; }
    .field-input {
      width: 100%; padding: 11px 14px;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 0.9rem; font-family: inherit; color: #0f172a;
      background: #ffffff; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field-input:focus        { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
    .field-input::placeholder { color: #94a3b8; }
    .field-input:disabled     { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

    .pw-wrap  { position: relative; }
    .pw-input { padding-right: 44px; }
    .pw-toggle {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 1rem; padding: 4px;
      color: #64748b; transition: color 0.15s;
    }
    .pw-toggle:hover { color: #0f172a; }

    .submit-btn {
      width: 100%; padding: 13px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff; border: none; border-radius: 10px;
      font-size: 0.95rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 14px rgba(37,99,235,0.35);
      transition: all 0.15s; font-family: inherit;
      margin-top: 4px;
    }
    .submit-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #1d4ed8, #1e40af);
      box-shadow: 0 6px 20px rgba(37,99,235,0.45);
      transform: translateY(-1px);
    }
    .submit-btn:active:not(:disabled) { transform: translateY(0); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

    .spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #ffffff; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Demo accounts ─────────────────────────────────────── */
    .demo-section { margin-bottom: 24px; }
    .demo-label {
      font-size: 0.68rem; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;
      display: flex; align-items: center; gap: 8px;
    }
    .demo-label::before, .demo-label::after {
      content: ''; flex: 1; height: 1px; background: #e2e8f0;
    }
    .demo-accounts { display: flex; gap: 8px; }
    .demo-btn {
      flex: 1; display: flex; align-items: center; gap: 8px;
      padding: 10px 10px; border-radius: 10px;
      border: 1.5px solid #e2e8f0; background: #f8fafc;
      cursor: pointer; transition: all 0.15s; text-align: left; font-family: inherit;
    }
    .demo-btn:hover:not(:disabled) { background: #f1f5f9; }
    .demo-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .demo-avatar {
      width: 28px; height: 28px; border-radius: 50%; color: #fff;
      font-size: 0.78rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .demo-name { font-size: 0.78rem; font-weight: 700; color: #0f172a; }
    .demo-role { font-size: 0.62rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }

    .form-footer { font-size: 0.72rem; color: #94a3b8; text-align: center; }
  `]
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  username  = '';
  password  = '';
  showPw    = signal(false);
  isLoading = signal(false);
  errorMsg  = signal('');

  readonly demoAccounts = DEMO_ACCOUNTS;

  fillDemo(acc: DemoAccount) {
    this.username = acc.username;
    this.password = acc.password;
    this.errorMsg.set('');
  }

  onSubmit() {
    if (!this.username || !this.password) return;
    this.isLoading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err?.status === 401 || err?.status === 403) {
          this.errorMsg.set('Invalid username or password. Please try again.');
        } else if (err?.status === 0) {
          this.errorMsg.set('Cannot connect to server. Using demo mode — please check credentials.');
        } else {
          this.errorMsg.set(err?.error?.message ?? 'Login failed. Please try again.');
        }
      },
    });
  }
}
