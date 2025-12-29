import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Pipe({
    name: 'controlErrorHandler',
})
export class ControlErrorHandlerPipe implements PipeTransform {
    private errorResolver: Record<string, (error?: ValidationErrors) => string> =
        {
            required: () => 'The field is required',
            minlength: () => 'The field must be at least 6 characters long',
            email: () => 'Email should be entered in the correct format',
            invalidPassword: () =>
                'The password must contain at least one special character and a capital letter',
        };

    transform(errorKeys: ValidationErrors | null): string | null {
        if (!errorKeys) return null;

        const validatorError: string = Object.keys(errorKeys)[0];

        if (validatorError in this.errorResolver) {
            return this.errorResolver[validatorError](errorKeys[validatorError]);
        }

        return 'Invalid input';
    }
}
