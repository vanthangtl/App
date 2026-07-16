-- ============================================================
-- Migration: Add metadata columns to user_sessions
-- Enables multi-device session tracking
-- ============================================================

-- 1. Add metadata columns
ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS device_name  TEXT,
  ADD COLUMN IF NOT EXISTS browser      TEXT,
  ADD COLUMN IF NOT EXISTS os           TEXT,
  ADD COLUMN IF NOT EXISTS ip_address   TEXT,
  ADD COLUMN IF NOT EXISTS user_agent   TEXT;

-- 2. Drop the UNIQUE constraint on session_token if it already allows multi-device
--    (It should still be unique — each token identifies exactly one session)
--    No change needed here.

-- 3. Remove the unique constraint that might enforce single-session per user
--    (The old code deleted all sessions on new login; we no longer do that)
--    Nothing to drop — the constraint was enforced in app code, not DB constraints.

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'user_sessions'
ORDER BY ordinal_position;
