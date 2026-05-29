import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';

export interface LoginRequest { username: string; password: string; }

// Matches AuthResponse from backend (unwrapped by apiResponseInterceptor)
export interface AuthResponse {
  token: string;
  type: string;
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    isActive?: boolean;
    // Jackson may serialize the boolean `isActive` field as `active`.
    active?: boolean;
  };
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auth`;
  private tokenKey = 'gen_expenses_token';
  private userKey = 'gen_expenses_user';

  /**
   * Reactive current user. Initialised from localStorage so a page refresh
   * keeps the session, and updated synchronously on login/logout so every
   * consumer (shell topbar, sidebar, feature pages) reacts immediately.
   * This is the fix for "after login the user is not detected".
   */
  readonly currentUser = signal<User | null>(this.readUserFromStorage());

  login(username: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${this.base}/login`, { username, password } as LoginRequest).pipe(
      tap((res) => {
        if (res?.token) {
          localStorage.setItem(this.tokenKey, res.token);
        }
      }),
      map((res) => {
        const src = res.user;
        const user: User = {
          id: src.id,
          name: src.name,
          username: src.username,
          email: src.email,
          role: (src.role as User['role']) ?? 'MEMBER',
          // Backend `isActive` may arrive as `active` depending on Jackson.
          isActive: src.isActive ?? src.active ?? true,
          isSystem: false,
        };
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUser.set(user);
        return user;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUser.set(user);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null && this.currentUser() !== null;
  }

  private readUserFromStorage(): User | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  }
}
