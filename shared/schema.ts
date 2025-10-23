
import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// User schema
export interface IUser extends Document {
  username: string;
  password: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, maxlength: 50 },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model<IUser>('User', userSchema);

// Alert schema
export interface IAlert extends Document {
  title: string;
  description: string;
  category: 'road' | 'criminal';
  severity: 'critical' | 'high' | 'medium' | 'low';
  xPosition: number;
  yPosition: number;
  icon?: string;
  alternativeRoute?: string;
  expirationMinutes: number;
  expiresAt?: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const alertSchema = new Schema<IAlert>({
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['road', 'criminal'] },
  severity: { type: String, required: true, enum: ['critical', 'high', 'medium', 'low'] },
  xPosition: { type: Number, required: true, min: 0, max: 100 },
  yPosition: { type: Number, required: true, min: 0, max: 100 },
  icon: { type: String },
  alternativeRoute: { type: String },
  expirationMinutes: { type: Number, default: 60, min: 0 },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export const AlertModel = mongoose.model<IAlert>('Alert', alertSchema);

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
export type User = IUser;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = IAlert;
