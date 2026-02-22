import * as z from 'zod';
import { UserRole } from "@hardware-os/shared";

export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export const baseRegistrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, { message: 'Full name must be at least 3 characters.' })
    .regex(/^[a-zA-Z\s\-']+$/, { message: 'Full name can only contain letters, spaces, hyphens, and apostrophes.' }),
  businessName: z.string().trim().min(2, { message: 'Business name is required.' }),
  email: z.string().trim().email({ message: 'Please enter a valid email address.' }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, { message: 'Please enter a valid phone number.' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .regex(/[@$!%*?&#]/, { message: 'Password must contain at least one special character.' }),
  role: z.nativeEnum(UserRole, { error: 'Please select an account type.' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistrationFormData = z.infer<typeof baseRegistrationSchema>;
