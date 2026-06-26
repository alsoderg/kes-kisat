import bcrypt from "bcryptjs";
import { pool } from "./db.js";
import { config } from "./config.js";

const defaultEvents = [
  { name: "Mölkky", description: "Klassinen kesämökkipeli – kaada numerokeiloja kepillä.", default_rules: "Heitä mölkkyä ja yritä saada tasan 50 pistettä. Yli menneet nollataan 25:een." },
  { name: "Pillipalloheitto", description: "Heitä pallo mahdollisimman lähelle maalia.", default_rules: "Kolme heittoa, paras tulos lasketaan." },
  { name: "Säkkihyppy", description: "Hyppää säkissä radan läpi mahdollisimman nopeasti.", default_rules: "Aika ratkaisee. Säkin pudotessa palaa lähtöön." },
  { name: "Tikanheitto", description: "Osu tauluun mahdollisimman tarkasti.", default_rules: "Kolme tikkaa, pisteet lasketaan yhteen." },
];

async function run() {
  // Lajikatalogi (vain jos tyhjä)
  const { rows: existingEvents } = await pool.query("SELECT count(*)::int AS n FROM event_types");
  if (existingEvents[0].n === 0) {
    for (const e of defaultEvents) {
      await pool.query(
        "INSERT INTO event_types (name, description, default_rules) VALUES ($1, $2, $3)",
        [e.name, e.description, e.default_rules]
      );
    }
    console.log(`✓ Lisätty ${defaultEvents.length} lajia katalogiin.`);
  } else {
    console.log("Lajikatalogissa on jo lajeja – ohitetaan.");
  }

  // Ensimmäinen admin (vain jos käyttäjänimeä ei ole)
  const { rows: existingUser } = await pool.query("SELECT id FROM users WHERE username = $1", [
    config.admin.username,
  ]);
  if (existingUser.length === 0) {
    const hash = await bcrypt.hash(config.admin.password, 10);
    await pool.query(
      "INSERT INTO users (username, password_hash, display_name, is_admin) VALUES ($1, $2, $3, TRUE)",
      [config.admin.username, hash, config.admin.displayName]
    );
    console.log(`✓ Luotu admin-käyttäjä: ${config.admin.username}`);
  } else {
    console.log(`Käyttäjä ${config.admin.username} on jo olemassa – ohitetaan.`);
  }

  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
