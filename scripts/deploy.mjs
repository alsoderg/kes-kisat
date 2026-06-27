#!/usr/bin/env node
// Yksinkertainen deploy Hetzner-palvelimelle SSH:n yli.
// Vaatii että palvelimella on repo kloonattuna ja systemd-service pystyssä
// (katso deploy/README ja deploy/kesakisat.service).
//
// Konfigurointi ympäristömuuttujilla (esim. .env tai shellissä):
//   DEPLOY_SSH      esim. "kesakisat@palvelin.example.com"
//   DEPLOY_PATH     esim. "/opt/kesakisat"          (repo palvelimella)
//   DEPLOY_SERVICE  esim. "kesakisat"               (systemd-yksikkö)
//   DEPLOY_BRANCH   esim. "main"                    (valinnainen, oletus main)

import { execFileSync } from "node:child_process";

const ssh = process.env.DEPLOY_SSH;
const path = process.env.DEPLOY_PATH;
const service = process.env.DEPLOY_SERVICE;
const branch = process.env.DEPLOY_BRANCH || "main";

if (!ssh || !path || !service) {
  console.error("Aseta DEPLOY_SSH, DEPLOY_PATH ja DEPLOY_SERVICE -ympäristömuuttujat.");
  process.exit(1);
}

const remote = [
  `cd ${path}`,
  `git fetch --all`,
  `git reset --hard origin/${branch}`,
  `npm ci`,
  `npm run build`,
  `npm run db:migrate`,
  `sudo systemctl restart ${service}`,
  `echo '✓ Deploy valmis'`,
].join(" && ");

console.log(`→ Deploy: ${ssh}:${path} (branch ${branch})`);
try {
  execFileSync("ssh", [ssh, remote], { stdio: "inherit" });
} catch {
  console.error("Deploy epäonnistui.");
  process.exit(1);
}
