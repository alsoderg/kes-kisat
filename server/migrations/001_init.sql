-- Allun Kesäkisat – tietokannan perusrakenne
-- Itserekisteröinti · globaali lajikatalogi · globaali Discord-webhook

-- KÄYTTÄJÄT
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(40) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name  VARCHAR(60) NOT NULL,
  theme         VARCHAR(20) NOT NULL DEFAULT 'kesa',
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LAJIKATALOGI (globaali, jaettu kisojen kesken)
CREATE TABLE event_types (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(80) NOT NULL,
  description   TEXT,
  default_rules TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- KISAT
CREATE TABLE competitions (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  location    VARCHAR(160),
  start_time  TIMESTAMPTZ,
  is_locked   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RASTI = laji kytkettynä kisaan
CREATE TABLE competition_stations (
  id             SERIAL PRIMARY KEY,
  competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  event_type_id  INTEGER NOT NULL REFERENCES event_types(id) ON DELETE RESTRICT,
  position       INTEGER NOT NULL DEFAULT 0,
  is_locked      BOOLEAN NOT NULL DEFAULT FALSE,
  rules_override TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, event_type_id),
  -- ankkuri results-taulun yhdistelmä-viiteavaimelle:
  UNIQUE (id, competition_id, event_type_id)
);

-- OSALLISTUMINEN
CREATE TABLE competition_participants (
  id             SERIAL PRIMARY KEY,
  competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, user_id)
);

-- TULOKSET (competition_id + event_type_id denormalisoitu nopeita tilastoja varten)
CREATE TABLE results (
  id                     SERIAL PRIMARY KEY,
  competition_station_id INTEGER NOT NULL,
  user_id                INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competition_id         INTEGER NOT NULL,
  event_type_id          INTEGER NOT NULL,
  points                 INTEGER NOT NULL DEFAULT 0,
  style_points           INTEGER NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_station_id, user_id),
  -- yhdistelmä-FK takaa, ettei denormalisoidut kentät voi mennä ristiin rastin kanssa:
  FOREIGN KEY (competition_station_id, competition_id, event_type_id)
    REFERENCES competition_stations (id, competition_id, event_type_id) ON DELETE CASCADE
);

-- GLOBAALIT ASETUKSET (mm. Discord-webhook)
CREATE TABLE app_settings (
  key   VARCHAR(60) PRIMARY KEY,
  value TEXT
);

-- Hakuindeksit tilastoja varten
CREATE INDEX idx_results_competition ON results (competition_id);
CREATE INDEX idx_results_event_type ON results (event_type_id);
CREATE INDEX idx_results_user ON results (user_id);
CREATE INDEX idx_comp_stations_competition ON competition_stations (competition_id);
