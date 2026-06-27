import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { one } from "./db.js";

const COOKIE_NAME = "kesakisat_token";

export function signToken(user) {
  return jwt.sign({ uid: user.id }, config.jwtSecret, { expiresIn: "30d" });
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

// Liittää req.user jos token on validi (muuten req.user = null)
export async function attachUser(req, _res, next) {
  req.user = null;
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const user = await one(
        "SELECT id, username, display_name, theme, is_admin FROM users WHERE id = $1",
        [payload.uid]
      );
      if (user) req.user = user;
    } catch {
      // virheellinen/vanhentunut token – jätetään kirjautumattomaksi
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Kirjautuminen vaaditaan." });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Kirjautuminen vaaditaan." });
  if (!req.user.is_admin) return res.status(403).json({ error: "Vain adminille." });
  next();
}
