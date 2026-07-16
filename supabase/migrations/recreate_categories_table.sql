-- ============================================================
-- TẠO LẠI BẢNG categories (bao gồm cột "group")
-- Chạy toàn bộ script này trong Supabase SQL Editor
-- ============================================================

-- Bước 1: Xóa bảng cũ (kèm RLS policies & indexes)
DROP TABLE IF EXISTS public.categories CASCADE;

-- Bước 2: Tạo lại bảng với cột "group"
CREATE TABLE public.categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    "group"     TEXT CHECK (
                    type = 'income'
                    OR "group" IN ('living', 'arising', 'fixed', 'investment')
                ),
    icon        TEXT,
    color       TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bước 3: Bật Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Bước 4: Tạo RLS Policies
CREATE POLICY "Users can view their own categories"
    ON public.categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- Bước 5: Index hiệu năng
CREATE INDEX categories_user_id_idx ON public.categories(user_id);
CREATE INDEX categories_type_idx    ON public.categories(type);
