"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const validateInput = (data: {
  date?: string;
  description?: string;
  category?: string;
  source?: string;
  amount?: string | number;
}) => {
  if (!data.date) return "Ngày giao dịch không được để trống.";
  if (!data.description?.trim()) return "Nội dung không được để trống.";
  if (!data.category) return "Vui lòng chọn danh mục.";
  if (!data.source) return "Vui lòng chọn nguồn tiền.";
  if (data.amount === "" || data.amount === undefined || data.amount === null)
    return "Số tiền không được để trống.";
  if (isNaN(Number(data.amount))) return "Số tiền phải là một con số hợp lệ.";
  return null;
};

export async function createTransactionAction(data: {
  date: string;
  description: string;
  category: string;
  source: string;
  amount: string;
}) {
  const errorMsg = validateInput(data);
  if (errorMsg) return { error: errorMsg };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Bạn phải đăng nhập." };

    const amountVal = Number(data.amount);

    const { data: account } = await supabase
      .from("accounts")
      .select("id, balance")
      .eq("name", data.source)
      .eq("user_id", user.id)
      .single();

    if (!account) return { error: "Không tìm thấy tài khoản nguồn." };

    const newBalance = account.balance + amountVal;
    if (newBalance < 0) return { error: "Tài khoản không đủ tiền." };

    const { error } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        date: data.date,
        description: data.description.trim(),
        category: data.category,
        source: data.source,
        amount: amountVal,
      },
    ]);

    if (error) return { error: error.message };

    await supabase.from("accounts").update({ balance: newBalance }).eq("id", account.id);

    revalidatePath("/test");
    revalidatePath("/accounts");
    return { success: true };
  } catch {
    return { error: "Đã xảy ra lỗi hệ thống." };
  }
}

export async function updateTransactionAction(
  id: string,
  data: {
    date: string;
    description: string;
    category: string;
    source: string;
    amount: string;
  }
) {
  const errorMsg = validateInput(data);
  if (errorMsg) return { error: errorMsg };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Bạn phải đăng nhập." };

    const amountVal = Number(data.amount);

    const { data: oldTx } = await supabase.from("transactions").select("*").eq("id", id).eq("user_id", user.id).single();
    if (!oldTx) return { error: "Không tìm thấy giao dịch cũ." };

    const { data: oldAccount } = await supabase.from("accounts").select("id, balance").eq("name", oldTx.source).eq("user_id", user.id).single();
    
    const isSameAccount = oldTx.source === data.source;
    let newAccount = oldAccount;
    if (!isSameAccount) {
      const { data: acc } = await supabase.from("accounts").select("id, balance").eq("name", data.source).eq("user_id", user.id).single();
      newAccount = acc;
    }

    if (!oldAccount || !newAccount) return { error: "Không tìm thấy tài khoản liên quan." };

    let oldAccountNewBalance = oldAccount.balance - oldTx.amount;
    let newAccountNewBalance = newAccount.balance;

    if (isSameAccount) {
      newAccountNewBalance = oldAccountNewBalance + amountVal;
      if (newAccountNewBalance < 0) return { error: "Tài khoản không đủ tiền." };
    } else {
      newAccountNewBalance = newAccount.balance + amountVal;
      if (oldAccountNewBalance < 0 || newAccountNewBalance < 0) return { error: "Tài khoản không đủ tiền." };
    }

    const { error } = await supabase
      .from("transactions")
      .update({
        date: data.date,
        description: data.description.trim(),
        category: data.category,
        source: data.source,
        amount: amountVal,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    if (isSameAccount) {
      await supabase.from("accounts").update({ balance: newAccountNewBalance }).eq("id", newAccount.id);
    } else {
      await supabase.from("accounts").update({ balance: oldAccountNewBalance }).eq("id", oldAccount.id);
      await supabase.from("accounts").update({ balance: newAccountNewBalance }).eq("id", newAccount.id);
    }

    revalidatePath("/test");
    revalidatePath("/accounts");
    return { success: true };
  } catch {
    return { error: "Đã xảy ra lỗi hệ thống." };
  }
}

export async function deleteTransactionAction(id: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Bạn phải đăng nhập." };

    const { data: tx } = await supabase.from("transactions").select("*").eq("id", id).eq("user_id", user.id).single();
    if (!tx) return { error: "Không tìm thấy giao dịch." };

    const { data: account } = await supabase.from("accounts").select("id, balance").eq("name", tx.source).eq("user_id", user.id).single();

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    if (account) {
      await supabase.from("accounts").update({ balance: account.balance - tx.amount }).eq("id", account.id);
    }

    revalidatePath("/test");
    revalidatePath("/accounts");
    return { success: true };
  } catch {
    return { error: "Đã xảy ra lỗi hệ thống." };
  }
}
