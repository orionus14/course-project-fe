import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { RoutingConstants } from '../../constants/routing.constants';
import { ControlErrorHandlerPipe } from '../../pipes/control-error-handler.pipe';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { UserInterface } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
import { passwordValidator } from '../../constants/validator.constant';

@Component({
  selector: 'app-sign-form',
  imports: [ReactiveFormsModule, NgClass, RouterLink, ControlErrorHandlerPipe],
  templateUrl: './sign-form.html',
  styleUrl: './sign-form.scss',
})
export class SignForm {
  @Input() isRegister!: boolean;
  @Input() form!: FormGroup;
  @Output() submitForm = new EventEmitter<UserInterface>();

  private authService: AuthService = inject(AuthService);
  private fb = inject(FormBuilder);

  registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(6), passwordValidator],
    ],
  });

  get signRouting(): string {
    return this.isRegister
      ? `/${RoutingConstants.LOGIN}`
      : `/${RoutingConstants.REGISTER}`;
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.submitForm.emit(this.form.value);
    }
  }

  isDisabled(): boolean {
    return !this.form || this.form.invalid;
  }

  isInvalidData(field: string) {
    return this.form.get(field)?.invalid && this.form.get(field)?.touched;
  }
}
