-- ============================================================
-- Migration: Single-Device Session Management
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Stores the active session token per user.
-- Only ONE valid token per user is allowed at any time.
-- When a new login occurs, all old tokens for that user are deleted.
-- The middleware validates this token on every protected request.
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Disable anon/user access — only service role (server-side) can touch this table
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct client access to user_sessions" ON public.user_sessions;
CREATE POLICY "No direct client access to user_sessions"
  ON public.user_sessions
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Indexes for fast lookups in middleware (runs on every request)
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_token_idx ON public.user_sessions(session_token);
