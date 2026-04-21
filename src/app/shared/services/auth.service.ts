import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse } from '../../modules/auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly apiUrl = 'http://localhost:8080';
  private readonly tokenKey = 'authsafe-session-token';

  private readonly tokenSubject = new BehaviorSubject<string | null>(null);
  private readonly authenticatedSubject = new BehaviorSubject<boolean>(false);

  public readonly token$ = this.tokenSubject.asObservable();
  public readonly isAuthenticated$ = this.authenticatedSubject.asObservable();

  constructor() {
    if (!this.isBrowser()) {
      return;
    }

    const restoredToken = sessionStorage.getItem(this.tokenKey);
    if (restoredToken) {
      this.tokenSubject.next(restoredToken);
      this.authenticatedSubject.next(true);
    }
  }

  public login(masterPassword: string): Observable<LoginResponse> {
    const payload: LoginRequest = { masterPassword };
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, payload)
      .pipe(tap(({ token }) => this.setSession(token)));
  }

  public lockSession(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  public logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  public getToken(): string | null {
    return this.tokenSubject.value;
  }

  public isAuthenticated(): boolean {
    return this.authenticatedSubject.value;
  }

  private setSession(token: string): void {
    this.tokenSubject.next(token);
    this.authenticatedSubject.next(true);
    if (this.isBrowser()) {
      sessionStorage.setItem(this.tokenKey, token);
    }
  }

  private clearSession(): void {
    this.tokenSubject.next(null);
    this.authenticatedSubject.next(false);
    if (this.isBrowser()) {
      sessionStorage.removeItem(this.tokenKey);
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
