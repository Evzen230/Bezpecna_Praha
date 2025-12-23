import { z } from 'zod';

// User type
export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  verificationCode?: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  createdAt: Date;
}

// Alert type
export interface Alert {
  id: string;
  title: string;
  description: string;
  category: 'road' | 'criminal';
  severity: 'critical' | 'high' | 'medium' | 'low';
  xPosition: number;
  yPosition: number;
  icon?: string;
  alternativeRoute?: string;
  expirationMinutes: number;
  expiresAt?: Date | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

// Validation schemas
export const insertUserSchema = z.object({
  email: z.string().email('Neplatná e-mailová adresa'),
  username: z.string().min(3, 'Uživatelské jméno musí mít alespoň 3 znaky').max(50),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
  acceptedTerms: z.boolean().refine(val => val === true, 'Musíte souhlasit s podmínkami používání'),
  acceptedPrivacy: z.boolean().refine(val => val === true, 'Musíte souhlasit se zásadami o zpracování osobních údajů'),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'E-mail nebo uživatelské jméno je povinné'),
  password: z.string().min(1, 'Heslo je povinné'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Neplatná e-mailová adresa'),
  verificationCode: z.string().min(6, 'Ověřovací kód musí mít 6 znaků'),
});

export const requestPasswordResetSchema = z.object({
  emailOrUsername: z.string().min(1, 'E-mail nebo uživatelské jméno je povinné'),
});

export const resetPasswordSchema = z.object({
  emailOrUsername: z.string().min(1, 'E-mail nebo uživatelské jméno je povinné'),
  resetCode: z.string().min(6, 'Reset kód musí mít 6 znaků'),
  newPassword: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
});

export const insertAlertSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1),
  category: z.enum(['road', 'criminal']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  xPosition: z.number().min(0).max(100),
  yPosition: z.number().min(0).max(100),
  icon: z.string().optional(),
  alternativeRoute: z.string().optional(),
  expirationMinutes: z.number().min(0).default(60),
  expiresAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type VerifyEmail = z.infer<typeof verifyEmailSchema>;
export type RequestPasswordReset = z.infer<typeof requestPasswordResetSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// Legacy aliases for compatibility
export type IUser = User;
export type IAlert = Alert;
