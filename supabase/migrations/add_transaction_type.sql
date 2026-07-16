-- ============================================================
-- Migration: Add `type` column to transactions table
-- ============================================================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense'
  CHECK (type IN ('income', 'expense'));

-- Cập nhật dữ liệu cũ dựa theo dấu của amount
UPDATE public.transactions
SET type = CASE WHEN amount >= 0 THEN 'income' ELSE 'expense' END
WHERE type = 'expense'; -- chỉ update những row chưa được gán đúng

-- Tạo index cho filter nhanh
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);
CREATE INDEX IF NOT EXISTS transactions_date_type_idx ON public.transactions(date DESC, type);

-- Xác nhận
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'transactions'
ORDER BY ordinal_position;
