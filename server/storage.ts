import { users, alerts, type User, type InsertUser, type Alert, type InsertAlert } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, isNull } from "drizzle-orm";
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
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

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
    try {
      const { expirationMinutes, ...insertData } = alertData;
      
      let expiresAt: Date | null = null;
      if (expirationMinutes && expirationMinutes > 0) {
        expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);
      }

      console.log('Creating alert with data:', { ...insertData, expiresAt });

      const [alert] = await db
        .insert(alerts)
        .values({
          title: insertData.title,
          description: insertData.description,
          alternativeRoute: insertData.alternativeRoute,
          alternativeRoutes: insertData.alternativeRoutes || null,
          category: insertData.category,
          severity: insertData.severity,
          xPosition: String(insertData.xPosition),
          yPosition: String(insertData.yPosition),
          createdBy: insertData.createdBy,
          expiresAt,
        })
        .returning();
      
      console.log('Alert created successfully:', alert);
      return alert;
    } catch (error) {
      console.error('Database error in createAlert:', error);
      throw error;
    }
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
    return (result.rowCount || 0) > 0;
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
