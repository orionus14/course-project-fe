import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { RoutingConstants } from '../constants/routing.constants';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const authService: AuthService = inject(AuthService);
    const userService: UserService = inject(UserService);
    const router: Router = inject(Router);

    const isAuthenticated = authService.isAuthenticated();

    if (isAuthenticated) {
        return userService.getCachedUser().pipe(
            take(1),
            map(user => !!user)
        );
    }
    router.navigate([RoutingConstants.LOGIN]);
    return false;
};
