import { Routes } from '@angular/router';
import { RoutingConstants } from './shared/constants/routing.constants';

export const routes: Routes = [
    {
        path: RoutingConstants.HOME,
        loadChildren: () =>
            import('./pages/home/home-routing.module').then(m => m.HomeModule),
    },
    {
        path: RoutingConstants.REGISTER,
        loadChildren: () =>
            import('./pages/register/register-routing.module').then(
                m => m.RegisterModule
            ),
    },
    {
        path: RoutingConstants.LOGIN,
        loadChildren: () =>
            import('./pages/login/login-routing.module').then(m => m.LoginModule),
    },
    {
        path: '**',
        redirectTo: RoutingConstants.HOME,
    },
];
