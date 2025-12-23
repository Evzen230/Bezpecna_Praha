import { z } from 'zod';

// User type
export interface User {
  id: string;
  username: string;
  password: string;
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
  username: z.string().min(3).max(50),
  password: z.string().min(6),
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
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// Legacy aliases for compatibility
export type IUser = User;
export type IAlert = Alert;
