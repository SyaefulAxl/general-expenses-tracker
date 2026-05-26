import { Injectable, inject } from '@angular/core';
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
    isActive: boolean;
  };
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auth`;
  private tokenKey = 'gen_expenses_token';
  private userKey = 'gen_expenses_user';

  login(username: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${this.base}/login`, { username, password } as LoginRequest).pipe(
      tap((res) => {
        if (res.token) {
          localStorage.setItem(this.tokenKey, res.token);
        }
      }),
      map((res) => {
        const user: User = {
          id: res.user.id,
          name: res.user.name,
          username: res.user.username,
          email: res.user.email,
          role: res.user.role as User['role'],
          isActive: res.user.isActive,
          isSystem: false,
        };
        localStorage.setItem(this.userKey, JSON.stringify(user));
        return user;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }
}
