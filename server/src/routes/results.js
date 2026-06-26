import { Router } from "express";
import { one, many } from "../db.js";
import { requireAuth } from "../auth.js";

export const resultsRouter = Router();

// Tulokset yhdellä rastilla (kaikki osallistujat)
resultsRouter.get("/stations/:stationId/results", async (req, res) => {
  const rows = await many(
    `SELECT r.id, r.user_id, u.display_name, r.points, r.style_points,
            (r.points + r.style_points) AS total
     FROM results r
     JOIN users u ON u.id = r.user_id
     WHERE r.competition_station_id = $1
     ORDER BY total DESC`,
    [req.params.stationId]
  );
  res.json(rows);
});

// Syötä/päivitä tulos (kirjautunut käyttäjä). Lukittu rasti/kisa estää muokkauksen.
resultsRouter.put("/stations/:stationId/results", requireAuth, async (req, res) => {
  const { userId, points, stylePoints } = req.body ?? {};
  if (!userId) return res.status(400).json({ error: "userId vaaditaan." });

  const station = await one(
    `SELECT cs.id, cs.competition_id, cs.event_type_id, cs.is_locked,
            c.is_locked AS competition_locked
     FROM competition_stations cs
     JOIN competitions c ON c.id = cs.competition_id
     WHERE cs.id = $1`,
    [req.params.stationId]
  );
  if (!station) return res.status(404).json({ error: "Rastia ei löytynyt." });
  if (station.is_locked || station.competition_locked) {
    return res.status(403).json({ error: "Rasti tai kisa on lukittu – pisteitä ei voi muokata." });
  }

  const p = Number(points) || 0;
  const s = Number(stylePoints) || 0;
  const row = await one(
    `INSERT INTO results (competition_station_id, user_id, competition_id, event_type_id, points, style_points)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (competition_station_id, user_id)
     DO UPDATE SET points = EXCLUDED.points, style_points = EXCLUDED.style_points, updated_at = now()
     RETURNING *`,
    [station.id, userId, station.competition_id, station.event_type_id, p, s]
  );
  res.json(row);
});
