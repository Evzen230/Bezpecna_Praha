import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { type User, type InsertUser, loginSchema, verifyEmailSchema } from "@shared/schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";

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
    interface User {
      id: string;
      email: string;
      username: string;
      role: 'user' | 'admin';
      emailVerified: boolean;
      acceptedTerms: boolean;
      acceptedPrivacy: boolean;
      createdAt: Date;
    }
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
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 dní
        httpOnly: true,
        sameSite: "lax",
        secure: app.get("env") === "production",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "emailOrUsername" },
      async (emailOrUsername, password, done) => {
        try {
          let user = await storage.getUserByEmail(emailOrUsername);
          if (!user) {
            user = await storage.getUserByUsername(emailOrUsername);
          }
          if (!user) {
            return done(null, false, { message: "Nesprávný e-mail/uživatelské jméno nebo heslo." });
          }
          if (!user.emailVerified) {
            return done(null, false, { message: "Prosím ověřte svou e-mailovou adresu." });
          }
          if (user.isBanned) {
            return done(null, false, { message: `Váš účet byl zablokován. Důvod: ${user.banReason || "neuvedeno"}` });
          }
          const isMatch = await comparePasswords(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Nesprávný e-mail/uživatelské jméno nebo heslo." });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
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
      const { email, username, password, acceptedTerms, acceptedPrivacy } = req.body as InsertUser;

      if (!email || !username || !password) {
        return res.status(400).json({ message: "E-mail, uživatelské jméno a heslo jsou povinné" });
      }

      if (!acceptedTerms || !acceptedPrivacy) {
        return res.status(400).json({ message: "Musíte souhlasit s podmínkami a zásadami" });
      }

      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "E-mail je již registrován" });
      }

      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Uživatelské jméno je již registrováno" });
      }

      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        acceptedTerms,
        acceptedPrivacy,
      });

      // Send verification email
      if (newUser.verificationCode) {
        await sendVerificationEmail(email, newUser.verificationCode);
      }

      return res.status(201).json({
        message: "Registrace úspěšná. Prosím zkontrolujte svou e-mailovou adresu pro ověřovací kód.",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          verificationCode: newUser.verificationCode,
          emailVerified: false,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/verify-email", async (req, res, next) => {
    try {
      const { email, verificationCode } = req.body;

      if (!email || !verificationCode) {
        return res.status(400).json({ message: "E-mail a ověřovací kód jsou povinné" });
      }

      const isVerified = await storage.verifyUserEmail(email, verificationCode);
      if (!isVerified) {
        return res.status(400).json({ message: "Neplatný ověřovací kód" });
      }

      return res.json({ message: "E-mail úspěšně ověřen. Nyní se můžete přihlásit." });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/request-password-reset", async (req, res, next) => {
    try {
      const { emailOrUsername } = req.body;

      if (!emailOrUsername) {
        return res.status(400).json({ message: "E-mail nebo uživatelské jméno je povinné" });
      }

      const result = await storage.requestPasswordReset(emailOrUsername);
      if (!result) {
        return res.status(404).json({ message: "Uživatel nebyl nalezen" });
      }

      // Send password reset email
      await sendPasswordResetEmail(result.email, result.resetCode);

      return res.json({
        message: "Pokud účet existuje, reset kód byl odeslán na e-mail.",
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { emailOrUsername, resetCode, newPassword } = req.body;

      if (!emailOrUsername || !resetCode || !newPassword) {
        return res.status(400).json({ message: "Všechna pole jsou povinná" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Heslo musí mít alespoň 6 znaků" });
      }

      const hashedPassword = await hashPassword(newPassword);
      const success = await storage.resetPassword(emailOrUsername, resetCode, hashedPassword);

      if (!success) {
        return res.status(400).json({ message: "Neplatný nebo vypršelý reset kód" });
      }

      return res.json({ message: "Heslo bylo úspěšně změněno. Nyní se můžete přihlásit novým heslem." });
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
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            emailVerified: user.emailVerified,
          },
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
