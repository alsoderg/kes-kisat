# Allun Kesäkisat 🏆☀️

Kisojen, rastien ja tulosten hallinta. React-frontend + Express/Postgres-backend, joka
tarjoilee molemmat samasta osoitteesta. Suunniteltu omalle palvelimelle (Hetzner).

## Rakenne (monorepo / npm workspaces)

```
client/   React + Vite -frontend (buildautuu server/public:iin)
server/   Express + Postgres + JWT-auth
deploy/   systemd-yksikkö ja palvelimen pystytysohjeet
scripts/  deploy.mjs (SSH-deploy)
```

## Tietomalli

- **users** – itserekisteröinti, salasana (bcrypt), näyttönimi, teema, `is_admin`
- **event_types** – globaali lajikatalogi (esim. Mölkky) + oletussäännöt
- **competitions** – kisat (alkamisaika, paikka, lukitus)
- **competition_stations** – laji kytkettynä kisaan (lukitus, järjestys, sääntöjen ohitus)
- **results** – pisteet + tyylipisteet; kuuluvat aina rastiin, kisaan ja käyttäjään
- **app_settings** – mm. Discord-webhook (pysyy palvelimella)

Tilastot kolmella/neljällä tasolla: rastikohtainen, kisakohtainen, lajikohtainen (yli kisojen) ja kokonais.

## Paikallinen kehitys

```bash
# 1. Postgres käyntiin (esim. Docker)
docker run -d --name kesakisat-db -e POSTGRES_USER=kesakisat \
  -e POSTGRES_PASSWORD=kesakisat -e POSTGRES_DB=kesakisat -p 5432:5432 postgres:16

# 2. Riippuvuudet
npm install

# 3. Ympäristömuuttujat
cp server/.env.example server/.env   # täytä DATABASE_URL, JWT_SECRET

# 4. Tietokanta
npm run db:migrate
npm run db:seed                      # lajikatalogi + 1. admin-tili

# 5. Käynnistä (server :3001 + client :5173, vite proxaa /api -> :3001)
npm run dev
```

## Tuotanto

```bash
npm run build     # buildaa clientin server/public:iin
npm run start     # käynnistää palvelimen, joka tarjoilee myös frontin
```

Palvelimen pystytys ja deploy: katso [deploy/README.md](deploy/README.md).
