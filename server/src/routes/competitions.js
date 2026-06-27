import { Router } from "express";
import { one, many } from "../db.js";
import { requireAuth, requireAdmin } from "../auth.js";

export const competitionsRouter = Router();

// Lista kisoista (osallistuja- ja rastimäärät mukana)
competitionsRouter.get("/", async (_req, res) => {
  const rows = await many(`
    SELECT c.*,
           (SELECT count(*)::int FROM competition_participants p WHERE p.competition_id = c.id) AS participant_count,
           (SELECT count(*)::int FROM competition_stations s WHERE s.competition_id = c.id) AS station_count
    FROM competitions c
    ORDER BY c.start_time DESC NULLS LAST, c.id DESC
  `);
  res.json(rows);
});

// Yksittäinen kisa + osallistujat
competitionsRouter.get("/:id", async (req, res) => {
  const comp = await one("SELECT * FROM competitions WHERE id = $1", [req.params.id]);
  if (!comp) return res.status(404).json({ error: "Kisaa ei löytynyt." });
  const participants = await many(
    `SELECT u.id, u.display_name, u.username
     FROM competition_participants p
     JOIN users u ON u.id = p.user_id
     WHERE p.competition_id = $1
     ORDER BY p.joined_at`,
    [req.params.id]
  );
  res.json({ ...comp, participants });
});

// Luo kisa (admin)
competitionsRouter.post("/", requireAdmin, async (req, res) => {
  const { name, description, location, startTime } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: "Kisan nimi vaaditaan." });
  const comp = await one(
    `INSERT INTO competitions (name, description, location, start_time)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name.trim(), description?.trim() || null, location?.trim() || null, startTime || null]
  );
  res.status(201).json(comp);
});

// Muokkaa kisaa (admin) – myös lukitus
competitionsRouter.patch("/:id", requireAdmin, async (req, res) => {
  const { name, description, location, startTime, isLocked } = req.body ?? {};
  const comp = await one(
    `UPDATE competitions SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       location = COALESCE($3, location),
       start_time = COALESCE($4, start_time),
       is_locked = COALESCE($5, is_locked),
       updated_at = now()
     WHERE id = $6 RETURNING *`,
    [
      name?.trim() || null,
      description ?? null,
      location ?? null,
      startTime ?? null,
      typeof isLocked === "boolean" ? isLocked : null,
      req.params.id,
    ]
  );
  if (!comp) return res.status(404).json({ error: "Kisaa ei löytynyt." });
  res.json(comp);
});

competitionsRouter.delete("/:id", requireAdmin, async (req, res) => {
  await one("DELETE FROM competitions WHERE id = $1 RETURNING id", [req.params.id]);
  res.json({ ok: true });
});

// Liity kisaan (kirjautunut käyttäjä)
competitionsRouter.post("/:id/join", requireAuth, async (req, res) => {
  const comp = await one("SELECT is_locked FROM competitions WHERE id = $1", [req.params.id]);
  if (!comp) return res.status(404).json({ error: "Kisaa ei löytynyt." });
  if (comp.is_locked) return res.status(403).json({ error: "Kisa on lukittu." });
  await one(
    `INSERT INTO competition_participants (competition_id, user_id)
     VALUES ($1, $2) ON CONFLICT (competition_id, user_id) DO NOTHING RETURNING id`,
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
});

// Poistu kisasta
competitionsRouter.delete("/:id/join", requireAuth, async (req, res) => {
  await one(
    "DELETE FROM competition_participants WHERE competition_id = $1 AND user_id = $2 RETURNING id",
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
});
