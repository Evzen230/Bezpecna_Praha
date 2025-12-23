import { type User, type InsertUser, type Alert, type InsertAlert } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { nanoid } from "nanoid";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const MemoryStore = createMemoryStore(session);

// Load data from file
function loadDataFromFile() {
  const dataPath = join(process.cwd(), "data.json");
  try {
    const data = JSON.parse(readFileSync(dataPath, "utf-8"));
    return data;
  } catch (error) {
    console.log("[Storage] data.json not found, starting with empty database");
    return { users: [], alerts: [] };
  }
}

// Save data to file
function saveDataToFile(data: any) {
  const dataPath = join(process.cwd(), "data.json");
  try {
    writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("[Storage] Failed to save data.json:", error);
  }
}

export interface IStorage {
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
  verifyUserEmail(email: string, verificationCode: string): Promise<boolean>;
  requestPasswordReset(emailOrUsername: string): Promise<{ resetCode: string; email: string } | null>;
  resetPassword(emailOrUsername: string, resetCode: string, newPassword: string): Promise<boolean>;
  banUser(userId: string, reason: string): Promise<boolean>;
  unbanUser(userId: string): Promise<boolean>;
  changeUserRole(userId: string, role: 'admin' | 'user'): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getDebugInfo(): Promise<{ users: any[]; alerts: any[] }>;
  clearAllData(): Promise<boolean>;

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
  private resetCodes: Map<string, { code: string; expiresAt: number }> = new Map();

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
    this.users = new Map();
    this.alerts = new Map();

    // Load data from file on startup
    const data = loadDataFromFile();
    if (data.users && data.users.length > 0) {
      data.users.forEach((user: any) => {
        this.users.set(user.id, {
          ...user,
          createdAt: new Date(user.createdAt),
          bannedAt: user.bannedAt ? new Date(user.bannedAt) : undefined,
        });
      });
      console.log(`[Storage] Loaded ${data.users.length} users from data.json`);
    }
    if (data.alerts && data.alerts.length > 0) {
      data.alerts.forEach((alert: any) => {
        this.alerts.set(alert.id, {
          ...alert,
          createdAt: new Date(alert.createdAt),
          expiresAt: alert.expiresAt ? new Date(alert.expiresAt) : null,
        });
      });
      console.log(`[Storage] Loaded ${data.alerts.length} alerts from data.json`);
    }
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

  async getUserByUsername(username: string): Promise<User | null> {
    const users = Array.from(this.users.values());
    for (const user of users) {
      if (user.username === username) {
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
      isBanned: false,
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

  async requestPasswordReset(emailOrUsername: string): Promise<{ resetCode: string; email: string } | null> {
    let user = await this.getUserByEmail(emailOrUsername);
    if (!user) {
      user = await this.getUserByUsername(emailOrUsername);
    }
    if (!user) return null;

    const resetCode = Math.random().toString().slice(2, 8);
    this.resetCodes.set(emailOrUsername, { code: resetCode, expiresAt: Date.now() + 15 * 60000 });
    return { resetCode, email: user.email };
  }

  async resetPassword(emailOrUsername: string, resetCode: string, newPassword: string): Promise<boolean> {
    const resetData = this.resetCodes.get(emailOrUsername);
    if (!resetData || resetData.code !== resetCode || resetData.expiresAt < Date.now()) {
      return false;
    }

    let user = await this.getUserByEmail(emailOrUsername);
    if (!user) {
      user = await this.getUserByUsername(emailOrUsername);
    }
    if (!user) return false;

    user.password = newPassword;
    this.users.set(user.id, user);
    this.resetCodes.delete(emailOrUsername);
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

  async banUser(userId: string, reason: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    user.isBanned = true;
    user.banReason = reason;
    user.bannedAt = new Date();
    this.users.set(userId, user);
    return true;
  }

  async unbanUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    user.isBanned = false;
    user.banReason = undefined;
    user.bannedAt = undefined;
    this.users.set(userId, user);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async changeUserRole(userId: string, role: 'admin' | 'user'): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    user.role = role;
    this.users.set(userId, user);
    return true;
  }

  async getDebugInfo(): Promise<{ users: any[]; alerts: any[] }> {
    return {
      users: Array.from(this.users.values()),
      alerts: Array.from(this.alerts.values()),
    };
  }

  async clearAllData(): Promise<boolean> {
    this.users.clear();
    this.alerts.clear();
    saveDataToFile({ users: [], alerts: [] });
    return true;
  }

  async syncToFile(): Promise<void> {
    const data = {
      users: Array.from(this.users.values()),
      alerts: Array.from(this.alerts.values()),
    };
    saveDataToFile(data);
  }
}

export const storage = new MemStorage();
