"use client";

import React, { useState } from "react";
import { AccountCard, AccountItem } from "./account-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AddAccountDialog,
  UpdateAccountDialog,
  DeleteAccountDialog,
} from "./account-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export type AccountType =
  | "BANK"
  | "CASH"
  | "WALLET"
  | "CREDIT_CARD"
  | "DEBT"
  | "INVESTMENT"
  | "OTHER";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_number: string | null;
  owner: string;
  balance: number;
  type: AccountType;
  created_at: string;
}

interface AccountsClientProps {
  initialAccounts: Account[];
}

export function AccountsClient({ initialAccounts }: AccountsClientProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  // Calculate totals dynamically
  const bankTotal = initialAccounts
    .filter((a) => a.type === "BANK")
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const walletTotal = initialAccounts
    .filter((a) => a.type === "WALLET" || a.type === "CASH")
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const creditTotal = initialAccounts
    .filter((a) => a.type === "CREDIT_CARD")
    .reduce((sum, a) => sum + Number(a.balance), 0);

  // Filter accounts based on active tab
  const getFilteredAccounts = (tab: string) => {
    switch (tab) {
      case "banks":
        return initialAccounts.filter((a) => a.type === "BANK");
      case "wallets":
        return initialAccounts.filter(
          (a) => a.type === "WALLET" || a.type === "CASH",
        );
      case "credit-cards":
        return initialAccounts.filter((a) => a.type === "CREDIT_CARD");
      case "debts":
        return initialAccounts.filter((a) => a.type === "DEBT");
      case "investments":
        return initialAccounts.filter((a) => a.type === "INVESTMENT");
      case "all":
      default:
        return initialAccounts;
    }
  };

  const filteredAccounts = getFilteredAccounts(activeTab);

  const tabLabels = [
    { value: "all", label: "Tất cả" },
    { value: "banks", label: "Ngân hàng" },
    { value: "wallets", label: "Ví & Tiền mặt" },
    { value: "credit-cards", label: "Thẻ tín dụng" },
    { value: "debts", label: "Nợ" },
    { value: "investments", label: "Đầu tư" },
  ];

  return (
    <div className="w-full flex flex-col gap-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        {/* Phần tiêu đề */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Danh sách tài khoản
          </h2>
          <p className="text-muted-foreground text-sm">
            Quản lý và theo dõi số dư các tài khoản của bạn.
          </p>
        </div>

        {/* Nút bấm (Full width trên mobile để dễ nhấn) */}
        <Button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Thêm tài khoản
        </Button>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <AccountItem card_name="Tổng Ngân hàng" tong_tai_khoan={bankTotal} />
        <AccountItem card_name="Ví & Tiền mặt" tong_tai_khoan={walletTotal} />
        <AccountItem
          card_name="Tổng Thẻ tín dụng"
          tong_tai_khoan={creditTotal}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col w-full"
      >
        {/* Thêm wrapper có scroll ngang cho mobile */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-muted p-1 rounded-lg inline-flex mb-4 min-w-max">
            {tabLabels.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="px-4 py-2 text-sm font-medium transition-all rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-xl bg-muted/20">
              <p className="text-muted-foreground text-sm mb-2 text-center">
                Chưa có tài khoản nào trong nhóm này.
              </p>
              {activeTab === "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddOpen(true)}
                >
                  Tạo tài khoản đầu tiên
                </Button>
              )}
            </div>
          ) : (
            // Chuyển grid thành 1 cột trên mobile, 2 cột trở lên từ sm trở đi
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  id={account.id}
                  name={account.name}
                  accountNumber={account.account_number || ""}
                  owner={account.owner}
                  balance={account.balance}
                  type={account.type}
                  onEdit={() => setEditingAccount(account)}
                  onDelete={() => {
                    setEditingAccount(null);
                    setDeletingAccount(account);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Containers */}
      <AddAccountDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

      {editingAccount && (
        <UpdateAccountDialog
          account={editingAccount}
          open={!!editingAccount}
          onOpenChange={(open) => !open && setEditingAccount(null)}
        />
      )}

      {deletingAccount && (
        <DeleteAccountDialog
          account={deletingAccount}
          open={!!deletingAccount}
          onOpenChange={(open) => !open && setDeletingAccount(null)}
        />
      )}
    </div>
  );
}
