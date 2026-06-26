// Tuo vanhan (localStorage-pohjaisen) sovelluksen varmuuskopio uuteen tietokantaan.
// Käyttö: node src/import-backup.js   (olettaa tyhjän, migratoidun kannan)
//
// - Käyttäjät: username = nimi, salasana = nimi + "123" (bcrypt)
// - Admin-oikeudet: jatsiaki, Albert, rantojenmies
// - Backup sisältää yhden suoritetun kisan.

import bcrypt from "bcryptjs";
import { pool } from "./db.js";

const COMPETITION_NAME = "Kesäkisat 2026";
const COMPETITION_DATE = "2026-06-20T08:16:26.507Z";

// nimet ovat admineja (vertailu isot/pienet kirjaimet huomiotta)
const ADMIN_NAMES = new Set(["jatsiaki", "albert", "rantojenmies"]);

const players = [
  { ref: "1781871537272-2dxtav", name: "Albert" },
  { ref: "1781871566226-ix5ya5", name: "K-kauppias666" },
  { ref: "1781871589087-1qyxba", name: "jatsiaki" },
  { ref: "1781871603595-r59g4f", name: "Tuonela" },
  { ref: "1781871635953-gs7yct", name: "rantojenmies" },
  { ref: "1781875813753-ozgmqe", name: "Matruusi" },
  { ref: "1781875835530-che3ai", name: "Juho" },
];

// järjestyksessä; "Mölkky" korjattu mojibakesta
const stations = [
  { ref: "1781871720298-c4rpd3", name: "Kroketti" },
  { ref: "1781879808460-epuncj", name: "Mölkky" },
  { ref: "1781886790359-1sosre", name: "Frisbii" },
  { ref: "1781898180252-236gl9", name: "Koris" },
];

const scores = {
  "1781871720298-c4rpd3": {
    "1781871537272-2dxtav": { points: "3", style: 0 },
    "1781871566226-ix5ya5": { points: "0", style: 0 },
    "1781871589087-1qyxba": { points: "0", style: 0 },
    "1781871603595-r59g4f": { points: "12", style: 0 },
    "1781871635953-gs7yct": { points: "0", style: 0 },
    "1781875813753-ozgmqe": { points: 0, style: "6" },
    "1781875835530-che3ai": { points: "6", style: 0 },
  },
  "1781879808460-epuncj": {
    "1781871537272-2dxtav": { points: "6", style: 0 },
    "1781871603595-r59g4f": { points: "12", style: 0 },
    "1781871566226-ix5ya5": { points: 0, style: "6" },
    "1781871635953-gs7yct": { points: "3", style: 0 },
  },
  "1781886790359-1sosre": {
    "1781871537272-2dxtav": { points: "0", style: "1" },
    "1781871566226-ix5ya5": { points: "0", style: 0 },
    "1781871589087-1qyxba": { points: "6", style: "2" },
    "1781871603595-r59g4f": { points: "3", style: 0 },
    "1781871635953-gs7yct": { points: "0", style: 0 },
    "1781875813753-ozgmqe": { points: "0", style: 0 },
    "1781875835530-che3ai": { points: "12", style: 0 },
  },
  "1781898180252-236gl9": {
    "1781871537272-2dxtav": { points: "6", style: 0 },
    "1781871635953-gs7yct": { points: "3", style: 0 },
    "1781871589087-1qyxba": { points: "12", style: 0 },
  },
};

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Käyttäjät
    const userId = {}; // ref -> db id
    for (const p of players) {
      const isAdmin = ADMIN_NAMES.has(p.name.toLowerCase());
      const hash = await bcrypt.hash(`${p.name}123`, 10);
      const { rows } = await client.query(
        `INSERT INTO users (username, password_hash, display_name, is_admin)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [p.name, hash, p.name, isAdmin]
      );
      userId[p.ref] = rows[0].id;
    }

    // 2. Kisa
    const { rows: compRows } = await client.query(
      `INSERT INTO competitions (name, start_time) VALUES ($1, $2) RETURNING id`,
      [COMPETITION_NAME, COMPETITION_DATE]
    );
    const competitionId = compRows[0].id;

    // 3. Lajikatalogi + rastit (laji kytkettynä kisaan)
    const stationId = {}; // ref -> competition_station id
    const eventTypeId = {}; // ref -> event_type id
    for (let i = 0; i < stations.length; i++) {
      const s = stations[i];
      const { rows: evRows } = await client.query(
        `INSERT INTO event_types (name) VALUES ($1) RETURNING id`,
        [s.name]
      );
      eventTypeId[s.ref] = evRows[0].id;
      const { rows: csRows } = await client.query(
        `INSERT INTO competition_stations (competition_id, event_type_id, position)
         VALUES ($1, $2, $3) RETURNING id`,
        [competitionId, evRows[0].id, i]
      );
      stationId[s.ref] = csRows[0].id;
    }

    // 4. Osallistujat (kaikki pelaajat kisaan)
    for (const p of players) {
      await client.query(
        `INSERT INTO competition_participants (competition_id, user_id) VALUES ($1, $2)`,
        [competitionId, userId[p.ref]]
      );
    }

    // 5. Tulokset
    let resultCount = 0;
    for (const stationRef of Object.keys(scores)) {
      for (const playerRef of Object.keys(scores[stationRef])) {
        const s = scores[stationRef][playerRef];
        await client.query(
          `INSERT INTO results
             (competition_station_id, user_id, competition_id, event_type_id, points, style_points)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            stationId[stationRef],
            userId[playerRef],
            competitionId,
            eventTypeId[stationRef],
            Number(s.points) || 0,
            Number(s.style) || 0,
          ]
        );
        resultCount++;
      }
    }

    await client.query("COMMIT");
    console.log(`✓ Tuotu: ${players.length} käyttäjää, 1 kisa, ${stations.length} rastia, ${resultCount} tulosta.`);
    const admins = players.filter((p) => ADMIN_NAMES.has(p.name.toLowerCase())).map((p) => p.name);
    console.log(`✓ Adminit: ${admins.join(", ")}`);
    console.log(`✓ Salasanat: <käyttäjänimi>123  (esim. Albert123)`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
