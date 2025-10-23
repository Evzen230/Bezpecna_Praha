
import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

export const insertAlertSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1),
  category: z.enum(['road', 'criminal']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  alternativeRoute: z.string().optional(),
  expiresAt: z.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

// TypeScript interfaces
export interface User extends Document {
  username: string;
  password: string;
  createdAt: Date;
}

export interface Alert extends Document {
  title: string;
  description: string;
  category: 'road' | 'criminal';
  severity: 'critical' | 'high' | 'medium' | 'low';
  latitude: number;
  longitude: number;
  alternativeRoute?: string;
  expiresAt?: Date | null;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// Mongoose schemas
const userSchema = new Schema<User>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const alertSchema = new Schema<Alert>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['road', 'criminal'], required: true },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  alternativeRoute: { type: String },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Indexes
alertSchema.index({ isActive: 1, expiresAt: 1, createdAt: -1 });
alertSchema.index({ createdBy: 1 });

export const users = mongoose.model<User>('User', userSchema);
export const alerts = mongoose.model<Alert>('Alert', alertSchema);
