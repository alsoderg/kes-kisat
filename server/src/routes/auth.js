import { Router } from "express";
import bcrypt from "bcryptjs";
import { one } from "../db.js";
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from "../auth.js";

export const authRouter = Router();

function publicUser(u) {
  return { id: u.id, username: u.username, displayName: u.display_name, theme: u.theme, isAdmin: u.is_admin };
}

// Itserekisteröinti
authRouter.post("/register", async (req, res) => {
  const { username, password, displayName } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: "Käyttäjänimi ja salasana vaaditaan." });
  }
  if (String(password).length < 4) {
    return res.status(400).json({ error: "Salasanan tulee olla vähintään 4 merkkiä." });
  }
  const existing = await one("SELECT id FROM users WHERE username = $1", [username]);
  if (existing) return res.status(409).json({ error: "Käyttäjänimi on jo varattu." });

  const hash = await bcrypt.hash(String(password), 10);
  const user = await one(
    `INSERT INTO users (username, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING id, username, display_name, theme, is_admin`,
    [username, hash, displayName?.trim() || username]
  );
  setAuthCookie(res, signToken(user));
  res.status(201).json(publicUser(user));
});

// Kirjautuminen
authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: "Käyttäjänimi ja salasana vaaditaan." });
  }
  const user = await one("SELECT * FROM users WHERE username = $1", [username]);
  if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
    return res.status(401).json({ error: "Väärä käyttäjänimi tai salasana." });
  }
  setAuthCookie(res, signToken(user));
  res.json(publicUser(user));
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// Nykyinen käyttäjä
authRouter.get("/me", (req, res) => {
  res.json(req.user ? publicUser(req.user) : null);
});

// Oman profiilin muokkaus (nimi + teema)
authRouter.patch("/me", requireAuth, async (req, res) => {
  const { displayName, theme } = req.body ?? {};
  const user = await one(
    `UPDATE users
     SET display_name = COALESCE($1, display_name),
         theme = COALESCE($2, theme),
         updated_at = now()
     WHERE id = $3
     RETURNING id, username, display_name, theme, is_admin`,
    [displayName?.trim() || null, theme || null, req.user.id]
  );
  res.json(publicUser(user));
});

// Salasanan vaihto
authRouter.post("/me/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!newPassword || String(newPassword).length < 4) {
    return res.status(400).json({ error: "Uuden salasanan tulee olla vähintään 4 merkkiä." });
  }
  const user = await one("SELECT * FROM users WHERE id = $1", [req.user.id]);
  if (!(await bcrypt.compare(String(currentPassword ?? ""), user.password_hash))) {
    return res.status(401).json({ error: "Nykyinen salasana on väärä." });
  }
  const hash = await bcrypt.hash(String(newPassword), 10);
  await one("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2 RETURNING id", [
    hash,
    req.user.id,
  ]);
  res.json({ ok: true });
});
