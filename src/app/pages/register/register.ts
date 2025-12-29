import { Component, inject } from '@angular/core';
import { SignForm } from '../../shared/components/sign-form/sign-form';
import { UserInterface } from '../../shared/interfaces/user';
import { RoutingConstants } from '../../shared/constants/routing.constants';
import { passwordValidator } from '../../shared/constants/validator.constant';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [SignForm],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService: AuthService = inject(AuthService);
  private router = inject(Router);

  RoutingConstants = RoutingConstants;

  registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(6), passwordValidator],
    ],
  });

  handleSubmit(submitUser: UserInterface) {
    if (this.registerForm.invalid) {
      console.error('Form is invalid');
      return;
    }
    this.authService.register(submitUser).subscribe({
      next: () => this.router.navigate([RoutingConstants.HOME]),
      error: error => {
        console.error('Error', error);
      },
    });
  }
}
