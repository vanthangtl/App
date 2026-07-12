import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TransactionsClient } from "./_components/transactions-client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default async function TransactionsPage() {
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch data in parallel
  const [
    { data: transactions, error: txError },
    { data: categories },
    { data: accounts },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("accounts")
      .select("id, name, type")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  if (txError) {
    console.error("Error fetching transactions:", txError);
  }

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Trang chủ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Giao dịch</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <TransactionsClient
        initialTransactions={transactions ?? []}
        categories={categories ?? []}
        accounts={accounts ?? []}
      />
    </div>
  );
}