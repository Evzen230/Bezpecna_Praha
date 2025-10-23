import { UserModel, AlertModel, type User, type InsertUser, type Alert, type InsertAlert, type IUser, type IAlert } from "@shared/schema";
import session from "express-session";
import MongoStore from "connect-mongodb-session";

const MongoDBStore = MongoStore(session);

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
    this.sessionStore = new MongoDBStore({
      uri: process.env.DATABASE_URL!,
      collection: 'sessions'
    });
  }

  async getUser(id: string): Promise<User | null> {
    return await UserModel.findById(id).lean() as User | null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await UserModel.findOne({ username }).lean() as User | null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = new UserModel(insertUser);
    return await user.save();
  }

  async createAlert(insertAlert: InsertAlert & { createdBy: string }): Promise<Alert> {
    const alert = new AlertModel(insertAlert);
    const saved = await alert.save();
    return this.transformAlert(saved.toObject());
  }

  async getActiveAlerts(): Promise<Alert[]> {
    const now = new Date();
    const alerts = await AlertModel.find({
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gte: now } }
      ]
    })
    .sort({ createdAt: -1 })
    .lean();
    return alerts.map(alert => this.transformAlert(alert));
  }

  async getAlert(id: string): Promise<Alert | null> {
    const alert = await AlertModel.findById(id).lean();
    return alert ? this.transformAlert(alert) : null;
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null> {
    const alert = await AlertModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    return alert ? this.transformAlert(alert) : null;
  }

  async deleteAlert(id: string): Promise<boolean> {
    const result = await AlertModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    return result !== null;
  }

  async getAlertsByUser(userId: string): Promise<Alert[]> {
    const alerts = await AlertModel.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .lean();
    return alerts.map(alert => this.transformAlert(alert));
  }

  private transformAlert(alert: any): Alert {
    return {
      ...alert,
      id: alert._id.toString(),
      createdBy: alert.createdBy.toString(),
    };
  }
}

export const storage = new DatabaseStorage();