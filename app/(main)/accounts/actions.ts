"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const validateInput = (data: any) => {
  if (!data.name?.trim()) return "Tên hiển thị không được để trống.";
  if (!data.owner?.trim()) return "Chủ tài khoản không được để trống.";
  if (!data.type) return "Vui lòng chọn loại tài khoản.";
  return null;
};

export async function createAccountAction(data: any) {
  const errorMsg = validateInput(data);
  if (errorMsg) return { error: errorMsg };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Bạn phải đăng nhập." };

    const { error } = await supabase.from("accounts").insert([
      {
        user_id: user.id,
        name: data.name.trim(),
        account_number: data.accountNumber?.trim() || null,
        owner: data.owner.trim().toUpperCase(),
        balance: data.balance,
        type: data.type,
      },
    ]);

    if (error) return { error: error.message };
    revalidatePath("/accounts");
    return { success: true };
  } catch (err: unknown) {
    return { error: "Đã xảy ra lỗi hệ thống." };
  }
}

export async function updateAccountAction(id: string, data: any) {
  const errorMsg = validateInput(data);
  if (errorMsg) return { error: errorMsg };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Bạn phải đăng nhập." };

    const { error } = await supabase
      .from("accounts")
      .update({
        name: data.name.trim(),
        account_number: data.accountNumber?.trim() || null,
        owner: data.owner.trim().toUpperCase(),
        balance: data.balance,
        type: data.type,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/accounts");
    return { success: true };
  } catch (err: unknown) {
    return { error: "Đã xảy ra lỗi hệ thống." };
  }
}

export async function deleteAccountAction(id: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Bạn phải đăng nhập." };

    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/accounts");
    return { success: true };
  } catch (err: unknown) {
    return { error: "Đã xảy ra lỗi hệ thống." };
  }
}
