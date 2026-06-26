#!/usr/bin/env node
// Käynnistää palvelimen ja clientin dev-tilassa rinnakkain.
//
// HUOM: tämä EI käytä `npm run dev -w <workspace>` -muotoa, koska bun ohittaa
// -w-lipun ja ajaa root-devin uudelleen → ääretön rekursio (fork-pommi).
// Sen sijaan jokainen workspace ajetaan SUORAAN sen omassa hakemistossa,
// jolloin ajettava skripti on aina lehtikomento (node --watch / vite) eikä
// voi kutsua itseään uudelleen. Toimii sekä npm:llä että bunilla.
//
// Käyttö:
//   node scripts/dev.mjs           -> molemmat
//   node scripts/dev.mjs server    -> vain palvelin
//   node scripts/dev.mjs client    -> vain client

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const only = process.argv[2];

const targets = [
  { name: "server", color: "\x1b[34m" }, // sininen
  { name: "client", color: "\x1b[32m" }, // vihreä
].filter((t) => !only || t.name === only);

const children = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const c of children) {
    try { c.kill(); } catch { /* ohitetaan */ }
  }
  process.exit(code);
}

for (const { name, color } of targets) {
  const prefix = `${color}[${name}]\x1b[0m `;
  // Ajetaan workspacen oma dev-skripti sen OMASSA hakemistossa (ei -w-lippua).
  // Komento annetaan yhtenä merkkijonona + shell:true, jotta Windowsin npm.cmd
  // toimii (ilman shelliä → EINVAL) eikä Node anna DEP0190-varoitusta (joka
  // tulee vain erillisestä args-taulukosta shellin kanssa).
  const child = spawn("npm run dev", {
    cwd: join(root, name),
    shell: true,
    env: process.env,
  });
  children.push(child);

  const pipe = (stream, out) =>
    stream.on("data", (buf) => {
      const lines = buf.toString().split(/\r?\n/).filter(Boolean);
      out.write(lines.map((l) => prefix + l + "\n").join(""));
    });
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);

  child.on("exit", (code) => {
    process.stdout.write(`${prefix}prosessi päättyi (koodi ${code ?? 0})\n`);
    shutdown(code ?? 0);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
