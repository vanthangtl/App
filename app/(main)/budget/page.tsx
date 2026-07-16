import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchBudgetPageData } from './actions'
import { formatMonth } from './types'
import { BudgetClient } from './_components/budget-client'

interface BudgetPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function BudgetPage({ searchParams }: BudgetPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const params = await searchParams
  const month = params.month ?? formatMonth(new Date())

  const data = await fetchBudgetPageData(month)

  return <BudgetClient initialData={data} />
}
