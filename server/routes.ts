import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertAlertSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Alert management routes
  app.get("/api/alerts", async (_req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert({
        ...validatedData,
        createdBy: req.user!.id,
      });
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid alert data", errors: error.errors });
      }
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  app.put("/api/alerts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const alertId = parseInt(req.params.id);
      const updates = req.body;
      
      const alert = await storage.updateAlert(alertId, updates);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ message: "Failed to update alert" });
    }
  });

  app.delete("/api/alerts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const alertId = parseInt(req.params.id);
      const success = await storage.deleteAlert(alertId);
      
      if (!success) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting alert:", error);
      res.status(500).json({ message: "Failed to delete alert" });
    }
  });

  app.get("/api/admin/alerts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const alerts = await storage.getAlertsByUser(req.user!.id);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching admin alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
