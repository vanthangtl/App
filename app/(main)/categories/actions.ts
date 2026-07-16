'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CategoryType = 'income' | 'expense'
export type ExpenseGroup = 'living' | 'arising' | 'fixed' | 'investment'

export interface Category {
  id: string
  user_id: string
  name: string
  type: CategoryType
  group: ExpenseGroup | null
  icon: string | null
  color: string | null
  created_at: string
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchCategoriesAction(): Promise<{
  income: Category[]
  expense: Category[]
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { income: [], expense: [] }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    console.error('[fetchCategories] error:', error)
    return { income: [], expense: [] }
  }

  const categories = (data ?? []) as Category[]
  return {
    income: categories.filter((c) => c.type === 'income'),
    expense: categories.filter((c) => c.type === 'expense'),
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createCategoryAction(formData: {
  name: string
  type: CategoryType
  group?: ExpenseGroup | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn phải đăng nhập.' }

  if (!formData.name?.trim()) return { error: 'Tên danh mục không được để trống.' }
  if (formData.type === 'expense' && !formData.group) {
    return { error: 'Vui lòng chọn nhóm danh mục.' }
  }

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    name: formData.name.trim(),
    type: formData.type,
    group: formData.type === 'income' ? null : formData.group,
  })

  if (error) return { error: error.message }
  revalidatePath('/categories')
  return { success: true }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateCategoryAction(
  id: string,
  formData: {
    name: string
    type: CategoryType
    group?: ExpenseGroup | null
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn phải đăng nhập.' }

  if (!formData.name?.trim()) return { error: 'Tên danh mục không được để trống.' }
  if (formData.type === 'expense' && !formData.group) {
    return { error: 'Vui lòng chọn nhóm danh mục.' }
  }

  const { error } = await supabase
    .from('categories')
    .update({
      name: formData.name.trim(),
      type: formData.type,
      group: formData.type === 'income' ? null : formData.group,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/categories')
  return { success: true }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn phải đăng nhập.' }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/categories')
  return { success: true }
}

// ─── Seed defaults ────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES: Omit<
  Category,
  'id' | 'user_id' | 'icon' | 'color' | 'created_at'
>[] = [
  // Chi tiêu - Sinh hoạt
  { name: 'Chợ',          type: 'expense', group: 'living' },
  { name: 'Siêu thị',     type: 'expense', group: 'living' },
  { name: 'Ăn uống',      type: 'expense', group: 'living' },
  { name: 'Di chuyển',    type: 'expense', group: 'living' },
  { name: 'Xăng xe',      type: 'expense', group: 'living' },
  { name: 'Café',         type: 'expense', group: 'living' },
  // Chi phí phát sinh
  { name: 'Mua sắm',      type: 'expense', group: 'arising' },
  { name: 'Giải trí',     type: 'expense', group: 'arising' },
  { name: 'Làm đẹp',      type: 'expense', group: 'arising' },
  { name: 'Sức khỏe',     type: 'expense', group: 'arising' },
  { name: 'Du lịch',      type: 'expense', group: 'arising' },
  { name: 'Quần áo',      type: 'expense', group: 'arising' },
  // Chi phí cố định
  { name: 'Hóa đơn điện', type: 'expense', group: 'fixed' },
  { name: 'Hóa đơn nước', type: 'expense', group: 'fixed' },
  { name: 'Internet',     type: 'expense', group: 'fixed' },
  { name: 'Nhà / Thuê nhà', type: 'expense', group: 'fixed' },
  { name: 'Người thân',   type: 'expense', group: 'fixed' },
  { name: 'Bảo hiểm',     type: 'expense', group: 'fixed' },
  // Đầu tư - Tiết kiệm
  { name: 'Đầu tư',       type: 'expense', group: 'investment' },
  { name: 'Tiết kiệm',    type: 'expense', group: 'investment' },
  { name: 'Học tập',      type: 'expense', group: 'investment' },
  { name: 'Sách vở',      type: 'expense', group: 'investment' },
  // Thu nhập
  { name: 'Lương',        type: 'income',  group: null },
  { name: 'Thưởng',       type: 'income',  group: null },
  { name: 'Trợ cấp',      type: 'income',  group: null },
  { name: 'Kinh doanh',   type: 'income',  group: null },
  { name: 'Lợi nhuận',    type: 'income',  group: null },
  { name: 'Thu hồi nợ',   type: 'income',  group: null },
]

export async function seedDefaultCategoriesAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn phải đăng nhập.' }

  const rows = DEFAULT_CATEGORIES.map((c) => ({
    user_id: user.id,
    name: c.name,
    type: c.type,
    group: c.group ?? null,
  }))

  const { error } = await supabase.from('categories').insert(rows)

  if (error) return { error: error.message }
  revalidatePath('/categories')
  return { success: true }
}
