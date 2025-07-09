import { users, alerts, type User, type InsertUser, type Alert, type InsertAlert } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createAlert(alert: InsertAlert & { createdBy: number }): Promise<Alert>;
  getActiveAlerts(): Promise<Alert[]>;
  getAlert(id: number): Promise<Alert | undefined>;
  updateAlert(id: number, updates: Partial<Alert>): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<boolean>;
  getAlertsByUser(userId: number): Promise<Alert[]>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createAlert(alertData: InsertAlert & { createdBy: number }): Promise<Alert> {
    const { expirationHours, ...insertData } = alertData;
    
    let expiresAt: Date | null = null;
    if (expirationHours && expirationHours > 0) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);
    }

    const [alert] = await db
      .insert(alerts)
      .values({
        ...insertData,
        expiresAt,
      })
      .returning();
    return alert;
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
            eq(alerts.expiresAt, null),
            gte(alerts.expiresAt, now)
          )
        )
      )
      .orderBy(desc(alerts.createdAt));
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert || undefined;
  }

  async updateAlert(id: number, updates: Partial<Alert>): Promise<Alert | undefined> {
    const [alert] = await db
      .update(alerts)
      .set(updates)
      .where(eq(alerts.id, id))
      .returning();
    return alert || undefined;
  }

  async deleteAlert(id: number): Promise<boolean> {
    const result = await db
      .update(alerts)
      .set({ isActive: false })
      .where(eq(alerts.id, id));
    return result.rowCount > 0;
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
