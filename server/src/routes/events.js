import { Router } from "express";
import { one, many } from "../db.js";
import { requireAdmin } from "../auth.js";

export const eventsRouter = Router();

// --- Globaali lajikatalogi ---

eventsRouter.get("/event-types", async (_req, res) => {
  const rows = await many("SELECT * FROM event_types ORDER BY name");
  res.json(rows);
});

eventsRouter.post("/event-types", requireAdmin, async (req, res) => {
  const { name, description, defaultRules } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: "Lajin nimi vaaditaan." });
  const ev = await one(
    "INSERT INTO event_types (name, description, default_rules) VALUES ($1, $2, $3) RETURNING *",
    [name.trim(), description?.trim() || null, defaultRules?.trim() || null]
  );
  res.status(201).json(ev);
});

eventsRouter.patch("/event-types/:id", requireAdmin, async (req, res) => {
  const { name, description, defaultRules } = req.body ?? {};
  const ev = await one(
    `UPDATE event_types SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       default_rules = COALESCE($3, default_rules)
     WHERE id = $4 RETURNING *`,
    [name?.trim() || null, description ?? null, defaultRules ?? null, req.params.id]
  );
  if (!ev) return res.status(404).json({ error: "Lajia ei löytynyt." });
  res.json(ev);
});

// --- Kisan rastit (laji kytkettynä kisaan) ---

// Rastit yhdessä kisassa, säännöt mukana (override tai katalogin oletus)
eventsRouter.get("/competitions/:competitionId/stations", async (req, res) => {
  const rows = await many(
    `SELECT cs.id, cs.competition_id, cs.event_type_id, cs.position, cs.is_locked,
            cs.rules_override,
            et.name, et.description,
            COALESCE(cs.rules_override, et.default_rules) AS rules
     FROM competition_stations cs
     JOIN event_types et ON et.id = cs.event_type_id
     WHERE cs.competition_id = $1
     ORDER BY cs.position, cs.id`,
    [req.params.competitionId]
  );
  res.json(rows);
});

// Lisää rasti kisaan (admin)
eventsRouter.post("/competitions/:competitionId/stations", requireAdmin, async (req, res) => {
  const { eventTypeId, position, rulesOverride } = req.body ?? {};
  if (!eventTypeId) return res.status(400).json({ error: "Laji (eventTypeId) vaaditaan." });
  try {
    const row = await one(
      `INSERT INTO competition_stations (competition_id, event_type_id, position, rules_override)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.competitionId, eventTypeId, Number(position) || 0, rulesOverride?.trim() || null]
    );
    res.status(201).json(row);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Tämä laji on jo lisätty kisaan." });
    }
    throw err;
  }
});

// Muokkaa rastia (admin) – sisältää lukituksen ja sääntöjen ohituksen
eventsRouter.patch("/stations/:id", requireAdmin, async (req, res) => {
  const { position, isLocked, rulesOverride } = req.body ?? {};
  const row = await one(
    `UPDATE competition_stations SET
       position = COALESCE($1, position),
       is_locked = COALESCE($2, is_locked),
       rules_override = COALESCE($3, rules_override)
     WHERE id = $4 RETURNING *`,
    [
      typeof position === "number" ? position : null,
      typeof isLocked === "boolean" ? isLocked : null,
      rulesOverride ?? null,
      req.params.id,
    ]
  );
  if (!row) return res.status(404).json({ error: "Rastia ei löytynyt." });
  res.json(row);
});

eventsRouter.delete("/stations/:id", requireAdmin, async (req, res) => {
  await one("DELETE FROM competition_stations WHERE id = $1 RETURNING id", [req.params.id]);
  res.json({ ok: true });
});
