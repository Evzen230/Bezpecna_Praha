
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAlertSchema } from "@shared/schema";

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

    try {
      const alerts = await storage.getAlertsByUser(req.user._id.toString());
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
        createdBy: req.user._id.toString(),
      });
      res.status(201).json(alert);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update alert
  app.put("/api/alerts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nepřihlášen" });
    }

    try {
      const { id } = req.params;
      const alert = await storage.getAlert(id);

      if (!alert) {
        return res.status(404).json({ message: "Upozornění nenalezeno" });
      }

      if (alert.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Nemáte oprávnění upravit toto upozornění" });
      }

      const validatedData = insertAlertSchema.partial().parse(req.body);
      const updatedAlert = await storage.updateAlert(id, validatedData);
      res.json(updatedAlert);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete alert
  app.delete("/api/alerts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nepřihlášen" });
    }

    try {
      const { id } = req.params;
      const alert = await storage.getAlert(id);

      if (!alert) {
        return res.status(404).json({ message: "Upozornění nenalezeno" });
      }

      if (alert.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Nemáte oprávnění smazat toto upozornění" });
      }

      await storage.deleteAlert(id);
      res.json({ message: "Upozornění úspěšně smazáno" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
