-- Sentinel Observability Platform - Database Schema
-- Run via docker-entrypoint-initdb.d

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username    VARCHAR(64) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,  -- bcrypt hash
  role        VARCHAR(32) NOT NULL DEFAULT 'operator',  -- admin | operator | viewer
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default admin user: admin / sentinel@2024
-- Password hash for "sentinel@2024"
INSERT INTO users (username, password, role) VALUES
  ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKmiFfPHCFPHUqW', 'admin');
  ('Miguel', '$2b$10$wKlhG7O87kLwMvC2oK5P9eF2W1oG3zX9v3x5wY6z4G8jK9lM2nO1q', 'admin');
ON CONFLICT (username) DO NOTHING;
-- ─────────────────────────────────────────
-- MONITORS
-- ─────────────────────────────────────────
CREATE TABLE monitors (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(255) NOT NULL,
  url               VARCHAR(2048) NOT NULL,
  environment       VARCHAR(32) NOT NULL DEFAULT 'production',  -- production | staging | homologation
  check_interval    INTEGER NOT NULL DEFAULT 60,  -- seconds
  timeout           INTEGER NOT NULL DEFAULT 30,   -- seconds
  method            VARCHAR(16) NOT NULL DEFAULT 'GET',
  expected_status   INTEGER NOT NULL DEFAULT 200,
  follow_redirects  BOOLEAN NOT NULL DEFAULT true,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  tags              TEXT[] DEFAULT '{}',
  headers           JSONB DEFAULT '{}',
  description       TEXT,
  alert_threshold   INTEGER NOT NULL DEFAULT 3,  -- consecutive failures before incident
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monitors_active ON monitors(is_active);
CREATE INDEX idx_monitors_environment ON monitors(environment);

-- ─────────────────────────────────────────
-- CHECKS (individual probe results)
-- ─────────────────────────────────────────
CREATE TABLE checks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id      UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          VARCHAR(32) NOT NULL,  -- healthy | warning | degraded | critical | offline
  http_status     INTEGER,
  response_time   INTEGER,  -- milliseconds
  error_message   TEXT,
  is_up           BOOLEAN NOT NULL DEFAULT true,
  dns_time        INTEGER,   -- ms
  connect_time    INTEGER,   -- ms
  ttfb            INTEGER,   -- time to first byte, ms
  content_match   BOOLEAN,
  region          VARCHAR(64) DEFAULT 'default'
);

-- Partition by month for performance at scale
CREATE INDEX idx_checks_monitor_time ON checks(monitor_id, checked_at DESC);
CREATE INDEX idx_checks_status ON checks(status);
CREATE INDEX idx_checks_checked_at ON checks(checked_at DESC);

-- ─────────────────────────────────────────
-- INCIDENTS
-- ─────────────────────────────────────────
CREATE TABLE incidents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id      UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  duration        INTEGER,  -- seconds, populated on resolution
  severity        VARCHAR(32) NOT NULL DEFAULT 'critical',  -- warning | critical | down
  cause           VARCHAR(255),  -- timeout | http_error | dns_failure | connection_refused | ...
  details         TEXT,
  is_resolved     BOOLEAN NOT NULL DEFAULT false,
  affected_checks INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_monitor ON incidents(monitor_id);
CREATE INDEX idx_incidents_active ON incidents(is_resolved, started_at DESC);
CREATE INDEX idx_incidents_started ON incidents(started_at DESC);

-- ─────────────────────────────────────────
-- METRICS (aggregated, stored per hour)
-- ─────────────────────────────────────────
CREATE TABLE metrics_hourly (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id      UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  hour            TIMESTAMPTZ NOT NULL,  -- truncated to hour
  total_checks    INTEGER NOT NULL DEFAULT 0,
  successful      INTEGER NOT NULL DEFAULT 0,
  failed          INTEGER NOT NULL DEFAULT 0,
  avg_response    NUMERIC(10,2),
  min_response    INTEGER,
  max_response    INTEGER,
  p95_response    INTEGER,
  uptime_pct      NUMERIC(5,2),  -- 0.00 - 100.00
  UNIQUE(monitor_id, hour)
);

CREATE INDEX idx_metrics_hourly_monitor ON metrics_hourly(monitor_id, hour DESC);

-- ─────────────────────────────────────────
-- ALERT CHANNELS (future expansion)
-- ─────────────────────────────────────────
CREATE TABLE alert_channels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  type        VARCHAR(64) NOT NULL,  -- email | slack | webhook | pagerduty
  config      JSONB NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE monitor_alert_channels (
  monitor_id  UUID REFERENCES monitors(id) ON DELETE CASCADE,
  channel_id  UUID REFERENCES alert_channels(id) ON DELETE CASCADE,
  PRIMARY KEY (monitor_id, channel_id)
);

-- ─────────────────────────────────────────
-- MONITOR STATUS CACHE (current state)
-- ─────────────────────────────────────────
CREATE TABLE monitor_status (
  monitor_id        UUID PRIMARY KEY REFERENCES monitors(id) ON DELETE CASCADE,
  current_status    VARCHAR(32) NOT NULL DEFAULT 'unknown',
  last_check_at     TIMESTAMPTZ,
  last_http_status  INTEGER,
  last_response_time INTEGER,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  consecutive_successes INTEGER NOT NULL DEFAULT 0,
  uptime_24h        NUMERIC(5,2),
  uptime_7d         NUMERIC(5,2),
  uptime_30d        NUMERIC(5,2),
  incident_count    INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FUNCTIONS & TRIGGERS
-- ─────────────────────────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_monitors_updated_at
  BEFORE UPDATE ON monitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Initialize monitor_status when monitor created
CREATE OR REPLACE FUNCTION init_monitor_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO monitor_status (monitor_id) VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_init_monitor_status
  AFTER INSERT ON monitors
  FOR EACH ROW EXECUTE FUNCTION init_monitor_status();

-- ─────────────────────────────────────────
-- VIEWS
-- ─────────────────────────────────────────

CREATE VIEW monitor_overview AS
SELECT
  m.id,
  m.name,
  m.url,
  m.environment,
  m.check_interval,
  m.is_active,
  m.tags,
  ms.current_status,
  ms.last_check_at,
  ms.last_http_status,
  ms.last_response_time,
  ms.uptime_24h,
  ms.uptime_7d,
  ms.uptime_30d,
  ms.incident_count,
  ms.consecutive_failures
FROM monitors m
LEFT JOIN monitor_status ms ON ms.monitor_id = m.id;
