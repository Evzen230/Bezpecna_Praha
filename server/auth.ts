import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { users, type User as SelectUser, type InsertUser } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(
  supplied: string,
  stored: string
): Promise<boolean> {
  const [hashedPassword, salt] = stored.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "city-alert-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: storage.sessionStore,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "lax",
        secure: app.get("env") === "production",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Nesprávné uživatelské jméno nebo heslo." });
        }
        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Nesprávné uživatelské jméno nebo heslo." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password } = req.body as InsertUser;

      if (!username || !password) {
        return res.status(400).json({ message: "Uživatelské jméno a heslo jsou povinné" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Uživatelské jméno již existuje" });
      }

      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
      });

      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Registrace úspěšná",
          user: { id: newUser._id, username: newUser.username },
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User, info: any) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).json({ message: info.message ?? "Přihlášení se nezdařilo" });
      }

      req.login(user, (err) => {
        if (err) {
          return next(err);
        }

        return res.json({
          message: "Přihlášení úspěšné",
          user: { id: user._id, username: user.username },
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Odhlášení se nezdařilo" });
      }

      res.json({ message: "Odhlášení úspěšné" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).json({ message: "Nepřihlášen" });
  });
}