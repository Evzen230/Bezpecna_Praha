import { users, alerts, type User, type InsertUser, type Alert, type InsertAlert } from "@shared/schema";
import session from "express-session";
import MongoStore from "connect-mongo";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export interface IStorage {
  getUser(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;

  createAlert(alert: InsertAlert & { createdBy: string }): Promise<Alert>;
  getActiveAlerts(): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | null>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null>;
  deleteAlert(id: string): Promise<boolean>;
  getAlertsByUser(userId: string): Promise<Alert[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = MongoStore.create({ 
      mongoUrl: process.env.DATABASE_URL,
      touchAfter: 24 * 3600,
    });
  }

  async getUser(id: string): Promise<User | null> {
    return await users.findById(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await users.findOne({ username });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = new users(insertUser);
    return await user.save();
  }

  async createAlert(insertAlert: InsertAlert & { createdBy: string }): Promise<Alert> {
    const alert = new alerts(insertAlert);
    return await alert.save();
  }

  async getActiveAlerts(): Promise<Alert[]> {
    const now = new Date();
    return await alerts
      .find({
        isActive: true,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gte: now } }
        ]
      })
      .sort({ createdAt: -1 });
  }

  async getAlert(id: string): Promise<Alert | null> {
    return await alerts.findById(id);
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null> {
    return await alerts.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );
  }

  async deleteAlert(id: string): Promise<boolean> {
    const result = await alerts.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );
    return result !== null;
  }

  async getAlertsByUser(userId: string): Promise<Alert[]> {
    return await alerts
      .find({ createdBy: userId })
      .sort({ createdAt: -1 });
  }
}

export const storage = new DatabaseStorage();