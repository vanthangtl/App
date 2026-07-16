import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TransactionsClient } from './_components/transactions-client'
import {
  fetchTransactionsAction,
  fetchAccountsForFormAction,
  fetchCategoriesForFormAction,
} from './actions'

export const metadata = {
  title: 'Quản lý Giao dịch | Tài chính Cá nhân',
  description: 'Xem và quản lý toàn bộ giao dịch thu chi của bạn',
}

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch initial page (server-side, first page with defaults)
  const [initialData, accounts, categories] = await Promise.all([
    fetchTransactionsAction({ page: 1, pageSize: 10, sortBy: 'date', sortOrder: 'desc' }),
    fetchAccountsForFormAction(),
    fetchCategoriesForFormAction(),
  ])

  return (
    <TransactionsClient
      initialData={initialData}
      accounts={accounts}
      categories={categories}
    />
  )
}
