-- =============================================================================
-- Rollback: 001_initial_schema
-- Project:  oprah-demo
--
-- Drops all objects created by 001_initial_schema.sql in reverse dependency
-- order: collisions first (references users), then users.
-- Extensions are intentionally left in place (other schemas may use them).
-- =============================================================================

-- Triggers are dropped automatically with their table, but explicit drop is
-- harmless and makes the rollback self-documenting.
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;

-- Drop tables (CASCADE removes dependent indexes, policies, and triggers).
DROP TABLE IF EXISTS public.collisions CASCADE;
DROP TABLE IF EXISTS public.users      CASCADE;
