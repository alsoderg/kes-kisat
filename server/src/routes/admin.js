import { Router } from "express";
import { one, many } from "../db.js";
import { requireAdmin } from "../auth.js";
import { postToDiscord, getWebhookUrl } from "../discord.js";

export const adminRouter = Router();

// --- Asetukset / hallintapaneeli ---

adminRouter.get("/settings", requireAdmin, async (_req, res) => {
  const url = await getWebhookUrl();
  res.json({ discordWebhookUrl: url || "" });
});

adminRouter.put("/settings", requireAdmin, async (req, res) => {
  const { discordWebhookUrl } = req.body ?? {};
  await one(
    `INSERT INTO app_settings (key, value) VALUES ('discord_webhook_url', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value RETURNING key`,
    [discordWebhookUrl?.trim() || null]
  );
  res.json({ discordWebhookUrl: discordWebhookUrl?.trim() || "" });
});

// --- Discord-jaot (webhook pysyy palvelimella, ei paljastu selaimelle) ---

const medals = ["🥇", "🥈", "🥉"];

adminRouter.post("/discord/competition/:id/standings", requireAdmin, async (req, res) => {
  const comp = await one("SELECT name FROM competitions WHERE id = $1", [req.params.id]);
  if (!comp) return res.status(404).json({ error: "Kisaa ei löytynyt." });
  const rows = await many(
    `SELECT u.display_name,
            COALESCE(SUM(r.points + r.style_points), 0)::int AS total,
            COALESCE(SUM(r.points), 0)::int AS points,
            COALESCE(SUM(r.style_points), 0)::int AS style_points
     FROM competition_participants p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN results r ON r.user_id = u.id AND r.competition_id = p.competition_id
     WHERE p.competition_id = $1
     GROUP BY u.display_name
     ORDER BY total DESC`,
    [req.params.id]
  );
  const lines = rows.map(
    (row, i) =>
      `${medals[i] ?? `${i + 1}.`} **${row.display_name}** — ${row.total} p. (${row.points} + ${row.style_points} tyyliä)`
  );
  await postToDiscord(`🏆 **${comp.name} – tilanne:**\n${lines.join("\n") || "Ei tuloksia."}`);
  res.json({ ok: true });
});

adminRouter.post("/discord/station/:id", requireAdmin, async (req, res) => {
  const station = await one(
    `SELECT et.name FROM competition_stations cs
     JOIN event_types et ON et.id = cs.event_type_id WHERE cs.id = $1`,
    [req.params.id]
  );
  if (!station) return res.status(404).json({ error: "Rastia ei löytynyt." });
  const rows = await many(
    `SELECT u.display_name, r.points, r.style_points
     FROM results r JOIN users u ON u.id = r.user_id
     WHERE r.competition_station_id = $1
     ORDER BY (r.points + r.style_points) DESC`,
    [req.params.id]
  );
  const lines = rows.map(
    (row) =>
      `**${row.display_name}**: ${row.points} pistettä, ${row.style_points} tyylipistettä (yht. ${row.points + row.style_points})`
  );
  await postToDiscord(`📣 **${station.name} – tulokset:**\n${lines.join("\n") || "Ei tuloksia."}`);
  res.json({ ok: true });
});

adminRouter.post("/discord/announce", requireAdmin, async (req, res) => {
  const { message, mentionEveryone } = req.body ?? {};
  await postToDiscord(message?.trim() || "@everyone KESÄKISAT ALKAA KOHTA 🏆☀️", {
    mentionEveryone: mentionEveryone !== false,
  });
  res.json({ ok: true });
});

adminRouter.post("/discord/start-time/:id", requireAdmin, async (req, res) => {
  const comp = await one("SELECT name, start_time, location FROM competitions WHERE id = $1", [
    req.params.id,
  ]);
  if (!comp) return res.status(404).json({ error: "Kisaa ei löytynyt." });
  if (!comp.start_time) return res.status(400).json({ error: "Kisalla ei ole alkamisaikaa." });
  const formatted = new Date(comp.start_time).toLocaleString("fi-FI", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const locationLine = comp.location ? `\n📍 Paikka: **${comp.location}**` : "";
  await postToDiscord(
    `🎉☀️ **${comp.name}** käynnistyy **${formatted}**!${locationLine}\nLaita kalenteriin ja ota aurinkolasit mukaan 😎🏆`,
    { mentionEveryone: true }
  );
  res.json({ ok: true });
});
