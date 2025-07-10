import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  alternativeRoute: text("alternative_route"), // for road closures
  alternativeRoutes: text("alternative_routes"), // JSON array of drawn routes
  category: varchar("category", { length: 50 }).notNull(), // road, criminal
  severity: varchar("severity", { length: 20 }).notNull(), // critical, high, medium, low
  xPosition: decimal("x_position", { precision: 5, scale: 2 }).notNull(), // percentage
  yPosition: decimal("y_position", { precision: 5, scale: 2 }).notNull(), // percentage
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // null means never expires
  isActive: boolean("is_active").default(true).notNull(),
});

export const alertsRelations = relations(alerts, ({ one }) => ({
  creator: one(users, {
    fields: [alerts.createdBy],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  alerts: many(alerts),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  isActive: true,
  expiresAt: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["road", "criminal"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  xPosition: z.number().min(0).max(100),
  yPosition: z.number().min(0).max(100),
  icon: z.string().optional(),
  expirationHours: z.number().default(24), // helper field for UI
  alternativeRoutes: z.string().optional(),
  xPosition: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  yPosition: z.union([z.string(), z.number()]).transform((val) => Number(val)),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;