import { ValidationPipe, ValidationError, BadRequestException } from '@nestjs/common';

export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        console.error('VALIDATION ERROR IS:', JSON.stringify(errors, null, 2));
        const messages = errors.map(error => 
            Object.values(error.constraints || {}).join(', ')
        );
        return new BadRequestException(messages.join('; '));
      }
    });
  }
}
