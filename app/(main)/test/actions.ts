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

    const { error } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        date: data.date,
        description: data.description.trim(),
        category: data.category,
        source: data.source,
        amount: Number(data.amount),
      },
    ]);

    if (error) return { error: error.message };
    revalidatePath("/test");
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

    const { error } = await supabase
      .from("transactions")
      .update({
        date: data.date,
        description: data.description.trim(),
        category: data.category,
        source: data.source,
        amount: Number(data.amount),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/test");
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

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/test");
    return { success: true };
  } catch {
    return { error: "Đã xảy ra lỗi hệ thống." };
  }
}
