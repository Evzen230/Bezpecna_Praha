import { pgTable, text, timestamp, boolean, serial, doublePrecision, varchar, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// User table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Alert table
export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 20 }).notNull(), // 'road' | 'criminal'
  severity: varchar('severity', { length: 20 }).notNull(), // 'critical' | 'high' | 'medium' | 'low'
  xPosition: doublePrecision('x_position').notNull(), // Custom coordinate system for game environment
  yPosition: doublePrecision('y_position').notNull(), // Custom coordinate system for game environment
  icon: varchar('icon', { length: 50 }), // Optional icon identifier
  alternativeRoute: text('alternative_route'),
  expirationMinutes: integer('expiration_minutes').default(60), // Minutes until expiration
  expiresAt: timestamp('expires_at'), // Calculated expiration timestamp
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3).max(50),
  password: z.string().min(6),
}).omit({ id: true, createdAt: true });

export const insertAlertSchema = createInsertSchema(alerts, {
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
}).omit({ id: true, createdAt: true, createdBy: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
