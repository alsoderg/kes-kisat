import express from "express";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

import { config } from "./config.js";
import { attachUser } from "./auth.js";
import { authRouter } from "./routes/auth.js";
import { competitionsRouter } from "./routes/competitions.js";
import { eventsRouter } from "./routes/events.js";
import { resultsRouter } from "./routes/results.js";
import { statsRouter } from "./routes/stats.js";
import { adminRouter } from "./routes/admin.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

// --- API ---
const api = express.Router();
api.get("/health", (_req, res) => res.json({ ok: true }));
api.use("/auth", authRouter);
api.use("/competitions", competitionsRouter);
api.use("/", eventsRouter); // event-types + competitions/:id/stations + stations/:id
api.use("/", resultsRouter); // stations/:id/results
api.use("/stats", statsRouter);
api.use("/admin", adminRouter);
app.use("/api", api);

// API-virheiden yhtenäinen käsittely
app.use("/api", (err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ error: err.message || "Palvelinvirhe." });
});

// --- Staattinen client (tuotanto) ---
const clientDir = join(__dirname, "..", "public");
if (existsSync(clientDir)) {
  app.use(express.static(clientDir));
  // SPA fallback: kaikki ei-API-reitit -> index.html
  app.get("*", (_req, res) => res.sendFile(join(clientDir, "index.html")));
}

app.listen(config.port, () => {
  console.log(`Kesäkisat-palvelin käynnissä portissa ${config.port}`);
});
