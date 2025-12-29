import { inject, Injectable } from '@angular/core';
import { environment } from '../environment/environment';
import { HttpClient } from '@angular/common/http';
import { UserInterface } from '../interfaces/user';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { ApiRoutingConstants } from '../constants/api-routing.constants';
import { UserService } from './user.service';

// --- новий інтерфейс для логіну ---
export interface UserLoginInterface {
    email: string;
    password: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private registerUrl = `${environment.apiUrl}/${ApiRoutingConstants.REGISTER}`;
    private loginUrl = `${environment.apiUrl}/${ApiRoutingConstants.LOGIN}`;
    private logoutUrl = `${environment.apiUrl}/logout`;
    private http = inject(HttpClient);
    private cookieService: CookieService = inject(CookieService);
    private userService = inject(UserService);

    // --- реєстрація ---
    register(user: UserInterface): Observable<UserInterface> {
        return this.http
            .post<UserInterface>(this.registerUrl, user, { withCredentials: true })
            .pipe(
                catchError(error => {
                    console.error('Registration error', error);
                    return throwError(() => error);
                })
            );
    }

    // --- логін ---
    login(user: UserLoginInterface): Observable<UserInterface> {
        return this.http
            .post<UserInterface>(this.loginUrl, user, { withCredentials: true })
            .pipe(
                tap(u => this.userService.clearUser()), // можна оновити userSubject після успішного логіну
                catchError(error => {
                    console.error('Login error', error);
                    return throwError(() => error);
                })
            );
    }

    isAuthenticated(): boolean {
        return this.cookieService.check('token');
    }

    getAuthToken(): string {
        return this.cookieService.get('token');
    }

    logout(): Observable<any> {
        return this.http
            .post(this.logoutUrl, {}, { withCredentials: true })
            .pipe(
                tap(() => this.userService.clearUser()),
                catchError(error => {
                    console.error('Logout error', error);
                    return throwError(() => error);
                })
            );
    }
}
