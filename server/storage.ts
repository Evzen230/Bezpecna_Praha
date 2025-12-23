import { type User, type InsertUser, type Alert, type InsertAlert } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { nanoid } from "nanoid";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
  verifyUserEmail(email: string, verificationCode: string): Promise<boolean>;

  createAlert(alert: InsertAlert & { createdBy: string }): Promise<Alert>;
  getActiveAlerts(): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | null>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null>;
  deleteAlert(id: string): Promise<boolean>;
  getAlertsByUser(userId: string): Promise<Alert[]>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: Map<string, User>;
  private alerts: Map<string, Alert>;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
    this.users = new Map();
    this.alerts = new Map();
  }

  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = Array.from(this.users.values());
    for (const user of users) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = nanoid();
    const verificationCode = Math.random().toString().slice(2, 8);
    const user: User = {
      id,
      email: insertUser.email,
      username: insertUser.username,
      password: insertUser.password,
      role: 'user',
      emailVerified: false,
      verificationCode,
      acceptedTerms: insertUser.acceptedTerms,
      acceptedPrivacy: insertUser.acceptedPrivacy,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async verifyUserEmail(email: string, verificationCode: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user || user.verificationCode !== verificationCode) {
      return false;
    }
    user.emailVerified = true;
    user.verificationCode = undefined;
    this.users.set(user.id, user);
    return true;
  }

  async createAlert(insertAlert: InsertAlert & { createdBy: string }): Promise<Alert> {
    const id = nanoid();
    const now = new Date();
    const expiresAt = insertAlert.expirationMinutes > 0
      ? new Date(now.getTime() + insertAlert.expirationMinutes * 60000)
      : null;
    
    const alert: Alert = {
      id,
      title: insertAlert.title,
      description: insertAlert.description,
      category: insertAlert.category,
      severity: insertAlert.severity,
      xPosition: insertAlert.xPosition,
      yPosition: insertAlert.yPosition,
      icon: insertAlert.icon,
      alternativeRoute: insertAlert.alternativeRoute,
      expirationMinutes: insertAlert.expirationMinutes,
      expiresAt,
      isActive: insertAlert.isActive ?? true,
      createdBy: insertAlert.createdBy,
      createdAt: now
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async getActiveAlerts(): Promise<Alert[]> {
    const now = new Date();
    const activeAlerts: Alert[] = [];
    const alerts = Array.from(this.alerts.values());
    for (const alert of alerts) {
      if (alert.isActive && (!alert.expiresAt || alert.expiresAt >= now)) {
        activeAlerts.push(alert);
      }
    }
    return activeAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAlert(id: string): Promise<Alert | null> {
    return this.alerts.get(id) || null;
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null> {
    const alert = this.alerts.get(id);
    if (!alert) return null;
    const updatedAlert = { ...alert, ...updates };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteAlert(id: string): Promise<boolean> {
    const alert = this.alerts.get(id);
    if (!alert) return false;
    alert.isActive = false;
    this.alerts.set(id, alert);
    return true;
  }

  async getAlertsByUser(userId: string): Promise<Alert[]> {
    const userAlerts: Alert[] = [];
    const alerts = Array.from(this.alerts.values());
    for (const alert of alerts) {
      if (alert.createdBy === userId) {
        userAlerts.push(alert);
      }
    }
    return userAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
