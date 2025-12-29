import { Component, inject } from '@angular/core';
import { SignForm } from '../../shared/components/sign-form/sign-form';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { RoutingConstants } from '../../shared/constants/routing.constants';
import { passwordValidator } from '../../shared/constants/validator.constant';
import { UserInterface } from '../../shared/interfaces/user';

@Component({
  selector: 'app-login',
  imports: [SignForm],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService: AuthService = inject(AuthService);
  private router = inject(Router);

  RoutingConstants = RoutingConstants;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(6), passwordValidator],
    ],
  });

  handleSubmit(submitUser: UserInterface) {
    this.authService.login(submitUser).subscribe({
      next: () => this.router.navigate([RoutingConstants.HOME]),
      error: error => {
        console.error('Error', error);
      },
    });
  }
}
