'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  user_id: string
  date: string
  description: string
  category: string
  source: string
  amount: number
  type: TransactionType
  created_at: string
}

export interface FetchTransactionsParams {
  page: number
  pageSize: number
  search?: string
  type?: TransactionType | 'all'
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FetchTransactionsResult {
  data: Transaction[]
  totalCount: number
  totalPages: number
}

// ─── Fetch (server-side pagination + filter + search) ─────────────────────────

export async function fetchTransactionsAction(
  params: FetchTransactionsParams
): Promise<FetchTransactionsResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], totalCount: 0, totalPages: 0 }

  const {
    page = 1,
    pageSize = 10,
    search = '',
    type = 'all',
    dateFrom,
    dateTo,
    sortBy = 'date',
    sortOrder = 'desc',
  } = params

  // --- Count query (identical filters, no range) ---
  let countQuery = supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (search) {
    countQuery = countQuery.or(
      `description.ilike.%${search}%,id.ilike.%${search}%,category.ilike.%${search}%`
    )
  }
  if (type && type !== 'all') countQuery = countQuery.eq('type', type)
  if (dateFrom) countQuery = countQuery.gte('date', dateFrom)
  if (dateTo) countQuery = countQuery.lte('date', dateTo)

  const { count } = await countQuery
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // --- Data query ---
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let dataQuery = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)

  if (search) {
    dataQuery = dataQuery.or(
      `description.ilike.%${search}%,id.ilike.%${search}%,category.ilike.%${search}%`
    )
  }
  if (type && type !== 'all') dataQuery = dataQuery.eq('type', type)
  if (dateFrom) dataQuery = dataQuery.gte('date', dateFrom)
  if (dateTo) dataQuery = dataQuery.lte('date', dateTo)

  dataQuery = dataQuery
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to)

  const { data, error } = await dataQuery
  if (error) {
    console.error('[fetchTransactions] error:', error)
    return { data: [], totalCount: 0, totalPages: 0 }
  }

  return { data: data as Transaction[], totalCount, totalPages }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createTransactionAction(formData: {
  date: string
  description: string
  category: string
  source: string
  amount: number
  type: TransactionType
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn phải đăng nhập.' }

  if (!formData.date) return { error: 'Vui lòng chọn ngày giao dịch.' }
  if (!formData.description?.trim()) return { error: 'Vui lòng nhập nội dung.' }
  if (!formData.category?.trim()) return { error: 'Vui lòng chọn danh mục.' }
  if (!formData.source?.trim()) return { error: 'Vui lòng chọn nguồn tiền.' }
  if (!formData.amount || formData.amount <= 0) return { error: 'Số tiền phải lớn hơn 0.' }
  if (!formData.type) return { error: 'Vui lòng chọn loại giao dịch.' }

  const amountVal = formData.type === 'expense' ? -Math.abs(formData.amount) : Math.abs(formData.amount)

  // 1. Fetch account to check balance
  const { data: account } = await supabase
    .from('accounts')
    .select('id, balance')
    .eq('name', formData.source.trim())
    .eq('user_id', user.id)
    .single()

  if (!account) return { error: 'Không tìm thấy tài khoản nguồn.' }

  const newBalance = account.balance + amountVal
  if (newBalance < 0) {
    return { error: 'Tài khoản không đủ tiền để thực hiện giao dịch này.' }
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    date: formData.date,
    description: formData.description.trim(),
    category: formData.category.trim(),
    source: formData.source.trim(),
    amount: amountVal,
    type: formData.type,
  })

  if (error) return { error: error.message }

  // 2. Update account balance
  await supabase.from('accounts').update({ balance: newBalance }).eq('id', account.id)

  revalidatePath('/transactions')
  revalidatePath('/accounts')
  return { success: true }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateTransactionAction(
  id: string,
  formData: {
    date: string
    description: string
    category: string
    source: string
    amount: number
    type: TransactionType
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn phải đăng nhập.' }

  if (!formData.amount || formData.amount <= 0) return { error: 'Số tiền phải lớn hơn 0.' }

  const amountVal = formData.type === 'expense' ? -Math.abs(formData.amount) : Math.abs(formData.amount)

  // 1. Get old transaction
  const { data: oldTx } = await supabase.from('transactions').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!oldTx) return { error: 'Không tìm thấy giao dịch cũ.' }

  // 2. Get old account
  const { data: oldAccount } = await supabase.from('accounts').select('id, balance').eq('name', oldTx.source).eq('user_id', user.id).single()
  
  // 3. Get new account
  const isSameAccount = oldTx.source === formData.source.trim()
  let newAccount = oldAccount
  if (!isSameAccount) {
    const { data: acc } = await supabase.from('accounts').select('id, balance').eq('name', formData.source.trim()).eq('user_id', user.id).single()
    newAccount = acc
  }

  if (!oldAccount || !newAccount) return { error: 'Không tìm thấy tài khoản liên quan.' }

  // 4. Calculate balances
  let oldAccountNewBalance = oldAccount.balance - oldTx.amount
  let newAccountNewBalance = newAccount.balance
  
  if (isSameAccount) {
    newAccountNewBalance = oldAccountNewBalance + amountVal
    if (newAccountNewBalance < 0) return { error: 'Tài khoản không đủ tiền.' }
  } else {
    newAccountNewBalance = newAccount.balance + amountVal
    if (oldAccountNewBalance < 0 || newAccountNewBalance < 0) return { error: 'Tài khoản không đủ tiền.' }
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      date: formData.date,
      description: formData.description.trim(),
      category: formData.category.trim(),
      source: formData.source.trim(),
      amount: amountVal,
      type: formData.type,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // 5. Update account balances
  if (isSameAccount) {
    await supabase.from('accounts').update({ balance: newAccountNewBalance }).eq('id', newAccount.id)
  } else {
    await supabase.from('accounts').update({ balance: oldAccountNewBalance }).eq('id', oldAccount.id)
    await supabase.from('accounts').update({ balance: newAccountNewBalance }).eq('id', newAccount.id)
  }

  revalidatePath('/transactions')
  revalidatePath('/accounts')
  return { success: true }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteTransactionAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn phải đăng nhập.' }

  // 1. Get transaction to know the amount and source
  const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!tx) return { error: 'Không tìm thấy giao dịch.' }

  // 2. Get account
  const { data: account } = await supabase.from('accounts').select('id, balance').eq('name', tx.source).eq('user_id', user.id).single()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // 3. Revert account balance
  if (account) {
    await supabase.from('accounts').update({ balance: account.balance - tx.amount }).eq('id', account.id)
  }

  revalidatePath('/transactions')
  revalidatePath('/accounts')
  return { success: true }
}

// ─── Bulk Delete ──────────────────────────────────────────────────────────────

export async function bulkDeleteTransactionsAction(ids: string[]) {
  if (!ids.length) return { error: 'Không có giao dịch nào được chọn.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn phải đăng nhập.' }

  // 1. Get transactions to know amounts and sources
  const { data: txs } = await supabase.from('transactions').select('*').in('id', ids).eq('user_id', user.id)
  if (!txs || txs.length === 0) return { error: 'Không tìm thấy giao dịch nào để xóa.' }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // 2. Revert account balances
  const accountAmountMap = new Map<string, number>()
  for (const tx of txs) {
    const current = accountAmountMap.get(tx.source) || 0
    accountAmountMap.set(tx.source, current - tx.amount)
  }

  for (const [source, amountDiff] of accountAmountMap.entries()) {
    const { data: account } = await supabase.from('accounts').select('id, balance').eq('name', source).eq('user_id', user.id).single()
    if (account) {
      await supabase.from('accounts').update({ balance: account.balance + amountDiff }).eq('id', account.id)
    }
  }

  revalidatePath('/transactions')
  revalidatePath('/accounts')
  return { success: true }
}

// ─── Fetch helpers for form dropdowns ────────────────────────────────────────

export async function fetchAccountsForFormAction() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('accounts')
    .select('id, name, type')
    .order('name')
  return data ?? []
}

export async function fetchCategoriesForFormAction() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, type, icon, color')
    .order('name')
  return data ?? []
}
