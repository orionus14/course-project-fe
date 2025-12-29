import { inject, Injectable } from '@angular/core';
import { environment } from '../environment/environment';
import { ApiRoutingConstants } from '../constants/api-routing.constants';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { UserInterface } from '../interfaces/user';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private http = inject(HttpClient);
    private userUrl = `${environment.apiUrl}/${ApiRoutingConstants.USER}`;
    private userSubject = new BehaviorSubject<UserInterface | null>(null);
    public userSubject$ = this.userSubject.asObservable();

    getUser(): Observable<UserInterface> {
        return this.http
            .get<UserInterface>(this.userUrl, { withCredentials: true })
            .pipe(tap(user => this.userSubject.next(user)));
    }

    getCachedUser(): Observable<UserInterface | null> {
        if (this.userSubject.value) {
            return this.userSubject;
        } else {
            return this.getUser();
        }
    }

    clearUser(): void {
        this.userSubject.next(null);
    }
}
