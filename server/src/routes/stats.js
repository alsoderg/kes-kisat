import { Router } from "express";
import { many } from "../db.js";

export const statsRouter = Router();

// KISAKOHTAINEN: yhden kisan kokonaistilanne per osallistuja
statsRouter.get("/competitions/:competitionId/standings", async (req, res) => {
  const rows = await many(
    `SELECT u.id AS user_id, u.display_name,
            COALESCE(SUM(r.points), 0)::int AS points,
            COALESCE(SUM(r.style_points), 0)::int AS style_points,
            COALESCE(SUM(r.points + r.style_points), 0)::int AS total
     FROM competition_participants p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN results r ON r.user_id = u.id AND r.competition_id = p.competition_id
     WHERE p.competition_id = $1
     GROUP BY u.id, u.display_name
     ORDER BY total DESC, u.display_name`,
    [req.params.competitionId]
  );
  res.json(rows);
});

// LAJIKOHTAINEN YLI KISOJEN: yhden lajin paras tulos / summa per käyttäjä
statsRouter.get("/event-types/:eventTypeId/standings", async (req, res) => {
  const rows = await many(
    `SELECT u.id AS user_id, u.display_name,
            COALESCE(SUM(r.points), 0)::int AS points,
            COALESCE(SUM(r.style_points), 0)::int AS style_points,
            COALESCE(SUM(r.points + r.style_points), 0)::int AS total,
            COALESCE(MAX(r.points + r.style_points), 0)::int AS best,
            count(r.id)::int AS attempts
     FROM results r
     JOIN users u ON u.id = r.user_id
     WHERE r.event_type_id = $1
     GROUP BY u.id, u.display_name
     ORDER BY best DESC, total DESC`,
    [req.params.eventTypeId]
  );
  res.json(rows);
});

// KOKONAIS: kaikkien kisojen yhteistilanne per käyttäjä
statsRouter.get("/overall", async (_req, res) => {
  const rows = await many(
    `SELECT u.id AS user_id, u.display_name,
            COALESCE(SUM(r.points), 0)::int AS points,
            COALESCE(SUM(r.style_points), 0)::int AS style_points,
            COALESCE(SUM(r.points + r.style_points), 0)::int AS total,
            COUNT(DISTINCT r.competition_id)::int AS competitions
     FROM users u
     LEFT JOIN results r ON r.user_id = u.id
     GROUP BY u.id, u.display_name
     HAVING COALESCE(SUM(r.points + r.style_points), 0) > 0
     ORDER BY total DESC, u.display_name`
  );
  res.json(rows);
});
