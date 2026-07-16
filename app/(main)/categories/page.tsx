import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CategoriesClient } from './_components/categories-client'
import { Category } from './actions'

export default async function CategoriesPage() {
  const supabase = await createClient()

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all categories for this user
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    console.error('[CategoriesPage] fetch error:', error)
  }

  const categories = (data ?? []) as Category[]
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  return (
    <CategoriesClient
      initialIncome={incomeCategories}
      initialExpense={expenseCategories}
    />
  )
}
