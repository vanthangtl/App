-- ============================================================
-- Migration: Add 'group' column to categories table
-- and seed default categories for new & existing users
-- ============================================================

-- Step 1: Add 'group' column (nullable to avoid breaking existing rows)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS "group" TEXT;

-- Step 2: Add CHECK constraint for valid group values
-- (only applied to expense categories; income will be NULL)
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_group_check;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_group_check
  CHECK (
    type = 'income'
    OR "group" IN ('living', 'arising', 'fixed', 'investment')
  );

-- ============================================================
-- Step 3: Seed default categories
-- NOTE: These are global defaults inserted with a placeholder
--       user_id. Replace with actual seed logic in your app,
--       or run per-user seeding via a trigger / Edge Function.
--
-- For now we insert as a template using a function that
-- inserts defaults for a given user — call it after signup.
-- ============================================================

-- Helper function: seed default categories for a user
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ── Chi tiêu - Sinh hoạt (living) ────────────────────────
  INSERT INTO public.categories (user_id, name, type, "group")
  VALUES
    (p_user_id, 'Chợ',          'expense', 'living'),
    (p_user_id, 'Siêu thị',     'expense', 'living'),
    (p_user_id, 'Ăn uống',      'expense', 'living'),
    (p_user_id, 'Di chuyển',    'expense', 'living'),
    (p_user_id, 'Xăng xe',      'expense', 'living'),
    (p_user_id, 'Café',         'expense', 'living')
  ON CONFLICT DO NOTHING;

  -- ── Chi phí phát sinh (arising) ──────────────────────────
  INSERT INTO public.categories (user_id, name, type, "group")
  VALUES
    (p_user_id, 'Mua sắm',      'expense', 'arising'),
    (p_user_id, 'Giải trí',     'expense', 'arising'),
    (p_user_id, 'Làm đẹp',      'expense', 'arising'),
    (p_user_id, 'Sức khỏe',     'expense', 'arising'),
    (p_user_id, 'Du lịch',      'expense', 'arising'),
    (p_user_id, 'Quần áo',      'expense', 'arising')
  ON CONFLICT DO NOTHING;

  -- ── Chi phí cố định (fixed) ──────────────────────────────
  INSERT INTO public.categories (user_id, name, type, "group")
  VALUES
    (p_user_id, 'Hóa đơn điện', 'expense', 'fixed'),
    (p_user_id, 'Hóa đơn nước', 'expense', 'fixed'),
    (p_user_id, 'Internet',     'expense', 'fixed'),
    (p_user_id, 'Nhà / Thuê nhà','expense','fixed'),
    (p_user_id, 'Người thân',   'expense', 'fixed'),
    (p_user_id, 'Bảo hiểm',     'expense', 'fixed')
  ON CONFLICT DO NOTHING;

  -- ── Đầu tư - Tiết kiệm (investment) ─────────────────────
  INSERT INTO public.categories (user_id, name, type, "group")
  VALUES
    (p_user_id, 'Đầu tư',       'expense', 'investment'),
    (p_user_id, 'Tiết kiệm',    'expense', 'investment'),
    (p_user_id, 'Học tập',      'expense', 'investment'),
    (p_user_id, 'Sách vở',      'expense', 'investment')
  ON CONFLICT DO NOTHING;

  -- ── Thu nhập (income) ────────────────────────────────────
  INSERT INTO public.categories (user_id, name, type, "group")
  VALUES
    (p_user_id, 'Lương',        'income', NULL),
    (p_user_id, 'Thưởng',       'income', NULL),
    (p_user_id, 'Trợ cấp',      'income', NULL),
    (p_user_id, 'Kinh doanh',   'income', NULL),
    (p_user_id, 'Lợi nhuận',    'income', NULL),
    (p_user_id, 'Thu hồi nợ',   'income', NULL)
  ON CONFLICT DO NOTHING;
END;
$$;
