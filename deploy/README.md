# Deploy Hetzner-palvelimelle

Sovellus on yksi Node-prosessi, joka tarjoilee sekä API:n että buildatun Reactin
samasta osoitteesta. Tarvitset Postgresin samalle (tai toiselle) palvelimelle.

## 1. Palvelimen kertaluontoinen pystytys (Ubuntu/Debian)

```bash
# Node 20 + Postgres + git
sudo apt update
sudo apt install -y nodejs npm postgresql git

# Oma käyttäjä sovellukselle
sudo useradd -m -s /bin/bash kesakisat

# Tietokanta ja käyttäjä
sudo -u postgres psql -c "CREATE USER kesakisat WITH PASSWORD 'vaihda-tama';"
sudo -u postgres psql -c "CREATE DATABASE kesakisat OWNER kesakisat;"

# Repo
sudo git clone https://github.com/alsoderg/kes-kisat.git /opt/kesakisat
sudo chown -R kesakisat:kesakisat /opt/kesakisat
```

## 2. Ympäristömuuttujat

```bash
sudo -u kesakisat cp /opt/kesakisat/server/.env.example /opt/kesakisat/server/.env
sudo -u kesakisat nano /opt/kesakisat/server/.env   # täytä DATABASE_URL, JWT_SECRET, COOKIE_SECURE=true, admin-tiedot
```

## 3. Ensimmäinen asennus

```bash
cd /opt/kesakisat
sudo -u kesakisat npm ci
sudo -u kesakisat npm run build
sudo -u kesakisat npm run db:migrate
sudo -u kesakisat npm run db:seed     # luo lajikatalogin + 1. admin-tilin
```

## 4. systemd-palvelu

```bash
sudo cp /opt/kesakisat/deploy/kesakisat.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now kesakisat
sudo systemctl status kesakisat
```

Salli deploy-skriptin uudelleenkäynnistys ilman salasanaa (valinnainen):
```
# /etc/sudoers.d/kesakisat
kesakisat ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart kesakisat
```

## 5. HTTPS (suositus)

Laita Nginx tai Caddy eteen ja hae Let's Encrypt -sertifikaatti. Esim. Caddy:
```
kisat.example.com {
    reverse_proxy localhost:3001
}
```
Muista `COOKIE_SECURE=true` .env:ssä kun HTTPS on käytössä.

## 6. Päivitys jatkossa

Omalta koneelta (kun SSH-avain on palvelimelle):
```bash
DEPLOY_SSH=kesakisat@palvelin DEPLOY_PATH=/opt/kesakisat DEPLOY_SERVICE=kesakisat npm run deploy
```
Skripti tekee palvelimella: `git reset --hard` → `npm ci` → `build` → `db:migrate` → `systemctl restart`.
