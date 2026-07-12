-- ============================================================
-- Migration: Account Lockout System
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================
-- Bảng lưu trạng thái khóa tài khoản và token mở khóa.
-- Được quản lý hoàn toàn bởi service role (server-side).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.account_lockouts (
  user_id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  failed_attempts          INT NOT NULL DEFAULT 0,
  is_locked                BOOLEAN NOT NULL DEFAULT false,
  locked_at                TIMESTAMPTZ,
  unlock_token             TEXT UNIQUE,
  unlock_token_expires_at  TIMESTAMPTZ,
  updated_at               TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Chỉ service role mới được truy cập — RLS block tất cả client
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct client access to account_lockouts" ON public.account_lockouts;
CREATE POLICY "No direct client access to account_lockouts"
  ON public.account_lockouts
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Index tra cứu nhanh theo unlock_token (dùng trong reset-password flow)
CREATE INDEX IF NOT EXISTS account_lockouts_token_idx
  ON public.account_lockouts(unlock_token)
  WHERE unlock_token IS NOT NULL;
