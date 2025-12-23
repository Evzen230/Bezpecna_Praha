
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAlertSchema, banUserSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Get all active alerts
  app.get("/api/alerts", async (_req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all alerts for admin (including inactive)
  app.get("/api/admin/alerts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nepřihlášen" });
    }

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Nemáte oprávnění" });
    }

    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create new alert
  app.post("/api/alerts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nepřihlášen" });
    }

    try {
      const validatedData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert({
        ...validatedData,
        createdBy: req.user?.id || "",
      });
      res.status(201).json(alert);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update alert (only admin or creator)
  app.put("/api/alerts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nepřihlášen" });
    }

    try {
      const id = req.params.id;
      const alert = await storage.getAlert(id);

      if (!alert) {
        return res.status(404).json({ message: "Upozornění nenalezeno" });
      }

      const isCreator = alert.createdBy === req.user?.id;
      const isAdmin = req.user?.role === 'admin';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({ message: "Nemáte oprávnění upravit toto upozornění" });
      }

      const validatedData = insertAlertSchema.partial().parse(req.body);
      const updatedAlert = await storage.updateAlert(id, validatedData);
      res.json(updatedAlert);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete alert (only admin or creator)
  app.delete("/api/alerts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nepřihlášen" });
    }

    try {
      const id = req.params.id;
      const alert = await storage.getAlert(id);

      if (!alert) {
        return res.status(404).json({ message: "Upozornění nenalezeno" });
      }

      const isCreator = alert.createdBy === req.user?.id;
      const isAdmin = req.user?.role === 'admin';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({ message: "Nemáte oprávnění smazat toto upozornění" });
      }

      await storage.deleteAlert(id);
      res.json({ message: "Upozornění úspěšně smazáno" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Ban user (admin only)
  app.post("/api/admin/ban/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nepřihlášen" });
    }

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Nemáte oprávnění" });
    }

    try {
      const { reason } = banUserSchema.parse(req.body);
      const userId = req.params.userId;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Uživatel nebyl nalezen" });
      }

      await storage.banUser(userId, reason);
      res.json({ message: `Uživatel ${user.username} byl zablokován.` });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Unban user (admin only)
  app.post("/api/admin/unban/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nepřihlášen" });
    }

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Nemáte oprávnění" });
    }

    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Uživatel nebyl nalezen" });
      }

      await storage.unbanUser(userId);
      res.json({ message: `Uživatel ${user.username} byl odblokován.` });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nepřihlášen" });
    }

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Nemáte oprávnění" });
    }

    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        isBanned: u.isBanned,
        banReason: u.banReason,
        createdAt: u.createdAt,
      }));
      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
