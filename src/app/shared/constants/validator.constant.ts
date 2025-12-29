import { AbstractControl, ValidationErrors } from '@angular/forms';

const regexPassword = /^(?=.*[A-Z])(?=.*[\W_]).+$/;

export const passwordValidator = (
    controlPassword: AbstractControl
): ValidationErrors | null => {
    return regexPassword.test(controlPassword.value)
        ? null
        : { invalidPassword: true };
};
