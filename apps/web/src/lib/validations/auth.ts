import * as z from "zod";
import { UserRole } from "@hardware-os/shared";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, { message: "Email or username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const nameRegex = /^[a-zA-Z\s\-']+$/;

export const baseRegistrationSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, { message: "First name must be at least 2 characters." })
      .regex(nameRegex, {
        message:
          "Name can only contain letters, spaces, hyphens, and apostrophes.",
      }),
    middleName: z.string().trim().optional().or(z.literal("")),
    lastName: z
      .string()
      .trim()
      .min(2, { message: "Last name must be at least 2 characters." })
      .regex(nameRegex, {
        message:
          "Name can only contain letters, spaces, hyphens, and apostrophes.",
      }),
    businessName: z.string().trim()
      .min(3, { message: "Business name must be at least 3 characters." })
      .optional().or(z.literal("")),
    slug: z.string().trim()
      .min(3, { message: "Username must be at least 3 characters." })
      .max(30, { message: "Username must be at most 30 characters." })
      .regex(/^[a-z0-9](-?[a-z0-9])*$/, { message: "Invalid username format. Use lowercase, numbers and hyphens." })
      .optional().or(z.literal("")),
    buyerType: z.string().trim().optional().or(z.literal("")),
    companyName: z.string().trim().optional().or(z.literal("")),
    companyAddress: z.string().trim().optional().or(z.literal("")),
    cacNumber: z.string().trim().optional().or(z.literal("")),
    email: z
      .string()
      .trim()
      .email({ message: "Please enter a valid email address." }),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{10,15}$/, {
        message: "Please enter a valid phone number.",
      }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number." })
      .regex(/[@$!%*?&#]/, {
        message: "Password must contain at least one special character.",
      }),
    role: z.nativeEnum(UserRole, { error: "Please select an account type." }),
  })
  .superRefine((data, ctx) => {
    if (data.role === UserRole.SUPPLIER) {
      if (!data.companyName || !data.companyName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Company name and address are both required for supplier registration.",
          path: ["companyName"],
        });
      }
      if (!data.companyAddress || !data.companyAddress.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Company name and address are both required for supplier registration.",
          path: ["companyAddress"],
        });
      }
    }
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistrationFormData = z.infer<typeof baseRegistrationSchema>;
