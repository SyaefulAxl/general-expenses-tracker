import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

interface DemoAccount { name: string; username: string; password: string; tone: 'accent' | 'danger' | 'info'; role: string; }

const DEMO_ACCOUNTS: DemoAccount[] = [
  { name: 'Syaeful', username: 'syaeful', password: 'Texcoms@2025!', tone: 'accent', role: 'ADMIN'  },
  { name: 'Winda',   username: 'winda',   password: 'Texcoms@2025!', tone: 'danger', role: 'MEMBER' },
  { name: 'Dina',    username: 'dina',    password: 'Texcoms@2025!', tone: 'info',   role: 'MEMBER' },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-root">

      <!-- ── Left hero panel (desktop only) ────────────────── -->
      <div class="login-hero" aria-hidden="true">
        <div class="hero-inner">
          <div class="hero-logo">
            <span class="hero-symbol">฿</span>
          </div>
          <h2 class="hero-title">Expenses Tracker</h2>
          <p class="hero-sub">Thailand Trip · Team Finance</p>

          <ul class="hero-features">
            <li><span class="bullet"></span><span>Track expenses effortlessly</span></li>
            <li><span class="bullet"></span><span>Split costs with your team</span></li>
            <li><span class="bullet"></span><span>Manage loans &amp; repayments</span></li>
            <li><span class="bullet"></span><span>THB · USD · IDR conversion</span></li>
          </ul>
        </div>
        <div class="hero-circle hero-c1"></div>
        <div class="hero-circle hero-c2"></div>
        <div class="hero-circle hero-c3"></div>
      </div>

      <!-- ── Right form panel ──────────────────────────────── -->
      <div class="login-panel">
        <div class="form-wrap">

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

          @if (errorMsg()) {
            <div class="error-alert" role="alert">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ errorMsg() }}</span>
            </div>
          }

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
                <button type="button" class="pw-toggle" (click)="showPw.update(v => !v)" [attr.aria-label]="showPw() ? 'Hide password' : 'Show password'">
                  <i class="pi" [class.pi-eye]="!showPw()" [class.pi-eye-slash]="showPw()"></i>
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
                <span>Sign in</span>
              }
            </button>
          </form>

          <div class="demo-section">
            <div class="demo-label">Quick sign-in</div>
            <div class="demo-accounts">
              @for (acc of demoAccounts; track acc.username) {
                <button
                  type="button"
                  class="demo-btn"
                  (click)="fillDemo(acc)"
                  [disabled]="isLoading()">
                  <div class="demo-avatar" [class]="'tone-' + acc.tone">{{ acc.name.charAt(0) }}</div>
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
      background: var(--surface-muted);
    }

    /* ── Hero ──────────────────────────────────────────────── */
    .login-hero {
      flex: 1;
      background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #2563eb 100%);
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
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.22);
      border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.8rem; font-weight: 800;
      margin-bottom: 24px;
      backdrop-filter: blur(8px);
    }
    .hero-symbol { letter-spacing: -0.02em; }
    .hero-title  { font-size: 2rem; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em; color: #ffffff; }
    .hero-sub    { font-size: 1rem; color: rgba(255,255,255,0.7); margin: 0 0 32px; }

    .hero-features {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .hero-features li {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.95rem;
      color: rgba(255,255,255,0.9);
    }
    .bullet {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #60a5fa;
      flex-shrink: 0;
      box-shadow: 0 0 0 4px rgba(96,165,250,0.18);
    }

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
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 40px;
      box-shadow: -8px 0 40px rgba(15,23,42,0.08);
    }
    @media (max-width: 768px) {
      .login-panel { width: 100%; min-width: unset; padding: 32px 20px; box-shadow: none; }
    }

    .form-wrap { width: 100%; max-width: 360px; }

    .mobile-brand {
      display: none;
      align-items: center; gap: 12px; margin-bottom: 32px;
    }
    @media (max-width: 768px) { .mobile-brand { display: flex; } }
    .mobile-logo {
      width: 44px; height: 44px; border-radius: var(--radius);
      background: linear-gradient(135deg, var(--accent), var(--accent-hover));
      color: #fff; font-size: 1.3rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .mobile-brand-name { font-size: 0.95rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
    .mobile-brand-sub  { font-size: 0.75rem; color: var(--text-subtle); }

    .form-heading   { margin-bottom: 28px; }
    .form-title     { font-size: 1.6rem; font-weight: 800; color: var(--text); margin: 0 0 6px; letter-spacing: -0.02em; }
    .form-desc      { font-size: 0.875rem; color: var(--text-subtle); margin: 0; }

    .error-alert {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px; background: var(--danger-soft);
      border: 1px solid var(--danger-soft); border-left: 3px solid var(--danger);
      border-radius: var(--radius);
      font-size: 0.875rem; color: var(--danger); margin-bottom: 20px;
    }
    .error-alert i { font-size: 1.05rem; }

    .login-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); }
    .field-input {
      width: 100%; padding: 11px 14px;
      border: 1.5px solid var(--border); border-radius: var(--radius);
      font-size: 0.9rem; font-family: inherit; color: var(--text);
      background: var(--surface); outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field-input:focus        { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
    .field-input::placeholder { color: var(--text-faint); }
    .field-input:disabled     { background: var(--surface-muted); color: var(--text-faint); cursor: not-allowed; }

    .pw-wrap  { position: relative; }
    .pw-input { padding-right: 44px; }
    .pw-toggle {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 8px;
      color: var(--text-subtle); transition: color 0.15s;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .pw-toggle:hover { color: var(--text); }

    .submit-btn {
      width: 100%; padding: 13px;
      background: var(--accent);
      color: #ffffff; border: none; border-radius: var(--radius);
      font-size: 0.95rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 14px rgba(37,99,235,0.25);
      transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
      margin-top: 4px;
      letter-spacing: -0.005em;
    }
    .submit-btn:hover:not(:disabled) {
      background: var(--accent-hover);
      box-shadow: 0 6px 20px rgba(37,99,235,0.35);
    }
    .submit-btn:active:not(:disabled) { transform: translateY(1px); }
    .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }

    .spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #ffffff; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Demo accounts ─────────────────────────────────────── */
    .demo-section { margin-bottom: 24px; }
    .demo-label {
      font-size: 0.68rem; font-weight: 700; color: var(--text-faint);
      text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;
      display: flex; align-items: center; gap: 8px;
    }
    .demo-label::before, .demo-label::after {
      content: ''; flex: 1; height: 1px; background: var(--border);
    }
    .demo-accounts {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .demo-btn {
      flex: 1 1 calc(33.333% - 8px);
      min-width: 0;
      display: flex; align-items: center; gap: 8px;
      padding: 10px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--surface);
      cursor: pointer; transition: background 0.15s, border-color 0.15s;
      text-align: left; font-family: inherit;
    }
    .demo-btn:hover:not(:disabled) {
      background: var(--surface-muted);
      border-color: var(--accent);
    }
    .demo-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .demo-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      font-size: 0.78rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .demo-info { min-width: 0; overflow: hidden; }
    .demo-name { font-size: 0.78rem; font-weight: 700; color: var(--text); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
    .demo-role { font-size: 0.62rem; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.04em; }

    /* Stack vertically on narrow phones so each chip gets a full row */
    @media (max-width: 480px) {
      .demo-accounts { flex-direction: column; }
      .demo-btn { flex: 1 1 100%; }
    }

    .form-footer { font-size: 0.72rem; color: var(--text-faint); text-align: center; }
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

  fillDemo(acc: DemoAccount): void {
    this.username = acc.username;
    this.password = acc.password;
    this.errorMsg.set('');
  }

  onSubmit(): void {
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
          this.errorMsg.set('Cannot connect to server. Please try again shortly.');
        } else {
          this.errorMsg.set(err?.error?.message ?? 'Login failed. Please try again.');
        }
      },
    });
  }
}
