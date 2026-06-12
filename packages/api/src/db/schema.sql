-- EventFlow Database Schema v0.1.0
BEGIN;

CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  venue        TEXT,
  event_date   TIMESTAMPTZ NOT NULL,
  capacity     INTEGER,
  event_code   CHAR(6) UNIQUE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pre_event' CHECK (status IN ('pre_event','active','emergency','post_event')),
  health       TEXT NOT NULL DEFAULT 'green' CHECK (health IN ('green','yellow','orange','red')),
  health_score NUMERIC(8,2) DEFAULT 0,
  config       JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  label      TEXT NOT NULL,
  capacity   INTEGER,
  status     TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal','busy','critical','closed')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, label)
);

CREATE TABLE IF NOT EXISTS operators (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  zone_id      UUID REFERENCES zones(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  phone        TEXT,
  role         TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('command','manager','volunteer','security','medical','vendor','parking')),
  device_token TEXT,
  last_seen    TIMESTAMPTZ,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  zone_id       UUID REFERENCES zones(id) ON DELETE SET NULL,
  reporter_id   UUID REFERENCES operators(id) ON DELETE SET NULL,
  category      TEXT NOT NULL CHECK (category IN ('congestion','medical','security','resource','infrastructure','other')),
  severity      INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 4),
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','under_review','in_progress','auto_escalated','resolved','closed')),
  title         TEXT NOT NULL,
  notes         TEXT,
  photo_url     TEXT,
  lat           NUMERIC(10,7),
  lng           NUMERIC(10,7),
  assigned_team TEXT,
  confidence    TEXT NOT NULL DEFAULT 'low' CHECK (confidence IN ('low','medium','high')),
  report_count  INTEGER NOT NULL DEFAULT 1,
  source        TEXT NOT NULL DEFAULT 'app' CHECK (source IN ('app','sms','command')),
  parent_id     UUID REFERENCES incidents(id) ON DELETE SET NULL,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES operators(id) ON DELETE SET NULL,
  message     TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'informational' CHECK (priority IN ('informational','operational','emergency')),
  audience    TEXT NOT NULL,
  channels    TEXT[] NOT NULL DEFAULT '{}',
  template_id TEXT,
  delivered   JSONB DEFAULT '{"app":0,"sms":0,"whatsapp":0}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  incident_id  UUID REFERENCES incidents(id) ON DELETE SET NULL,
  broadcast_id UUID REFERENCES broadcasts(id) ON DELETE SET NULL,
  actor_id     UUID REFERENCES operators(id) ON DELETE SET NULL,
  actor_label  TEXT,
  action       TEXT NOT NULL,
  detail       TEXT,
  entry_type   TEXT NOT NULL DEFAULT 'incident' CHECK (entry_type IN ('incident','broadcast','system','zone')),
  severity     INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id    UUID REFERENCES incidents(id),
  operator_id    UUID REFERENCES operators(id),
  original_ts    TIMESTAMPTZ NOT NULL,
  synced_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delay_seconds  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_incidents_event    ON incidents(event_id);
CREATE INDEX IF NOT EXISTS idx_incidents_zone     ON incidents(zone_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status   ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created  ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_event     ON timeline_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_created   ON timeline_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcasts_event   ON broadcasts(event_id);
CREATE INDEX IF NOT EXISTS idx_operators_event    ON operators(event_id);
CREATE INDEX IF NOT EXISTS idx_zones_event        ON zones(event_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'events_updated_at') THEN
    CREATE TRIGGER events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'zones_updated_at') THEN
    CREATE TRIGGER zones_updated_at BEFORE UPDATE ON zones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'operators_updated_at') THEN
    CREATE TRIGGER operators_updated_at BEFORE UPDATE ON operators FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'incidents_updated_at') THEN
    CREATE TRIGGER incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

COMMIT;
