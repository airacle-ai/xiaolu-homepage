-- =============================================================================
-- Migration: 001_initial_schema
-- Project:   oprah-demo
-- Created:   2026-05-27
--
-- Creates the initial schema for the oprah personality-matching app.
-- Tables: public.users, public.collisions
--
-- Re-runnable: all CREATE statements use IF NOT EXISTS guards.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "moddatetime"; -- automatic updated_at trigger

-- ---------------------------------------------------------------------------
-- 1. public.users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  pin_code     TEXT        PRIMARY KEY,
  match_code   TEXT        UNIQUE,
  chat_history JSONB       NOT NULL DEFAULT '[]',
  dimensions   JSONB,
  progress     JSONB       NOT NULL DEFAULT '{}',
  mode         TEXT        CHECK (mode IN ('simple', 'detailed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.users                IS 'One row per user, keyed by their 4-digit PIN code.';
COMMENT ON COLUMN public.users.pin_code       IS '6-digit numeric PIN that acts as the user''s primary identifier and implicit credential. Demo-grade only — not a real secret.';
COMMENT ON COLUMN public.users.match_code     IS '4-letter uppercase share code used to invite another user into a collision. Globally unique.';
COMMENT ON COLUMN public.users.chat_history   IS 'Ordered array of ChatMessage objects: {role, content}.';
COMMENT ON COLUMN public.users.dimensions     IS 'Full DimensionResult JSON produced by the AI analysis, or NULL if analysis is not yet complete.';
COMMENT ON COLUMN public.users.progress       IS 'Opaque key-value store for in-progress quiz / onboarding state.';
COMMENT ON COLUMN public.users.mode           IS 'Analysis depth chosen by the user: ''simple'' or ''detailed''.';

-- ---------------------------------------------------------------------------
-- 2. public.collisions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collisions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_pin    TEXT        NOT NULL REFERENCES public.users(pin_code) ON DELETE CASCADE,
  friend_code TEXT        NOT NULL,
  result      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.collisions             IS 'Each row is one user''s "collision" (compatibility analysis) against another user''s match_code.';
COMMENT ON COLUMN public.collisions.id          IS 'Stable UUID for the collision record.';
COMMENT ON COLUMN public.collisions.user_pin    IS 'PIN of the user who initiated the collision.';
COMMENT ON COLUMN public.collisions.friend_code IS 'match_code of the target user (the friend). Not a FK so it remains valid if the target later clears their match_code.';
COMMENT ON COLUMN public.collisions.result      IS 'CollisionResult JSON, or NULL if the analysis is still pending.';

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_collisions_user_pin
  ON public.collisions (user_pin);

CREATE INDEX IF NOT EXISTS idx_collisions_friend_code
  ON public.collisions (friend_code);

-- Partial index — only index non-NULL match_codes (most rows are NULL while
-- users haven't chosen a share code yet).
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_match_code
  ON public.users (match_code)
  WHERE match_code IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Auto-update trigger for users.updated_at
-- ---------------------------------------------------------------------------
-- The moddatetime extension provides the moddatetime() trigger function.
-- We drop and recreate the trigger so the migration stays idempotent.
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------
-- SECURITY NOTE ─────────────────────────────────────────────────────────────
--   This app is a demo that uses the Supabase anon key directly from the
--   browser with no server-side proxy and no Supabase Auth / JWT.  There is
--   therefore no per-request identity the database can use to enforce
--   row-level ownership.
--
--   The pin_code acts as a weak "password-in-a-primary-key" scheme:
--   anyone who knows a PIN can read or modify that user's row.
--
--   The policies below are DEMO-GRADE only.  Before moving to production:
--     1. Enable Supabase Auth and issue JWTs.
--     2. Add a `auth_user_id UUID REFERENCES auth.users(id)` column.
--     3. Replace every policy below with `USING (auth.uid() = auth_user_id)`.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collisions ENABLE ROW LEVEL SECURITY;

-- ── users policies ──────────────────────────────────────────────────────────

-- Allow anonymous users to look up any user (needed to resolve match_code →
-- user_pin before initiating a collision).
DROP POLICY IF EXISTS "anon can select users" ON public.users;
CREATE POLICY "anon can select users"
  ON public.users
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to create their own user record (sign-up flow).
DROP POLICY IF EXISTS "anon can insert users" ON public.users;
CREATE POLICY "anon can insert users"
  ON public.users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update a user row.
-- DEMO-GRADE: we cannot restrict to "own row only" without JWT auth.
-- The application layer (supabase.ts) always scopes updates to the
-- known pin_code, which provides minimal protection in practice.
DROP POLICY IF EXISTS "anon can update users" ON public.users;
CREATE POLICY "anon can update users"
  ON public.users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ── collisions policies ─────────────────────────────────────────────────────

-- Allow anonymous users to read collision records (needed to display history
-- and incoming-collision lists).
DROP POLICY IF EXISTS "anon can select collisions" ON public.collisions;
CREATE POLICY "anon can select collisions"
  ON public.collisions
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to insert new collision records.
DROP POLICY IF EXISTS "anon can insert collisions" ON public.collisions;
CREATE POLICY "anon can insert collisions"
  ON public.collisions
  FOR INSERT
  TO anon
  WITH CHECK (true);
