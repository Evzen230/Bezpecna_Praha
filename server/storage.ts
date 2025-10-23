import { users, alerts, type User, type InsertUser, type Alert, type InsertAlert } from "@shared/schema";
import session from "express-session";
import { eq, and, or, isNull, gte, desc } from "drizzle-orm";
import { db } from "./db";
import connectPgSimple from "connect-pg-simple";
import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export interface IStorage {
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;

  createAlert(alert: InsertAlert & { createdBy: number }): Promise<Alert>;
  getActiveAlerts(): Promise<Alert[]>;
  getAlert(id: number): Promise<Alert | null>;
  updateAlert(id: number, updates: Partial<Alert>): Promise<Alert | null>;
  deleteAlert(id: number): Promise<boolean>;
  getAlertsByUser(userId: number): Promise<Alert[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PgSession = connectPgSimple(session);
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    this.sessionStore = new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createAlert(insertAlert: InsertAlert & { createdBy: number }): Promise<Alert> {
    const result = await db.insert(alerts).values(insertAlert).returning();
    return result[0];
  }

  async getActiveAlerts(): Promise<Alert[]> {
    const now = new Date();
    return await db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.isActive, true),
          or(
            isNull(alerts.expiresAt),
            gte(alerts.expiresAt, now)
          )
        )
      )
      .orderBy(desc(alerts.createdAt));
  }

  async getAlert(id: number): Promise<Alert | null> {
    const result = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
    return result[0] || null;
  }

  async updateAlert(id: number, updates: Partial<Alert>): Promise<Alert | null> {
    const result = await db
      .update(alerts)
      .set(updates)
      .where(eq(alerts.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteAlert(id: number): Promise<boolean> {
    const result = await db
      .update(alerts)
      .set({ isActive: false })
      .where(eq(alerts.id, id))
      .returning();
    return result.length > 0;
  }

  async getAlertsByUser(userId: number): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.createdBy, userId))
      .orderBy(desc(alerts.createdAt));
  }
}

export const storage = new DatabaseStorage();
