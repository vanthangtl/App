import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountsClient } from "./_components/accounts-client"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default async function AccountsPage() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Fetch accounts belonging to the authenticated user from Supabase
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching accounts in AccountsPage:", error)
  }

  return (
    <>
      <AccountsClient initialAccounts={accounts || []} />
    </>
  )
}
