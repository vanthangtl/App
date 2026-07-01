import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Landmark,
  Wallet,
  CreditCard,
  Banknote,
  PiggyBank,
  AlertCircle,
  SquarePen,
  Trash2,
  Coins
} from "lucide-react"
import { AccountType } from "./accounts-client"

interface AccountCardProps {
  id: string
  name: string
  accountNumber: string
  owner: string
  balance: number
  type: AccountType
  onEdit: () => void
  onDelete: () => void
}

// Format VND Currency helper
export function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

// Get icon corresponding to account type
function getAccountIcon(type: AccountType) {
  switch (type) {
    case "BANK":
      return <Landmark className="h-5 w-5" />
    case "WALLET":
      return <Wallet className="h-5 w-5" />
    case "CASH":
      return <Banknote className="h-5 w-5" />
    case "CREDIT_CARD":
      return <CreditCard className="h-5 w-5" />
    case "DEBT":
      return <AlertCircle className="h-5 w-5" />
    case "INVESTMENT":
      return <PiggyBank className="h-5 w-5" />
    default:
      return <Coins className="h-5 w-5" />
  }
}

// Get display label for account type
export function getAccountTypeLabel(type: AccountType) {
  switch (type) {
    case "BANK":
      return "Ngân hàng"
    case "WALLET":
      return "Ví điện tử"
    case "CASH":
      return "Tiền mặt"
    case "CREDIT_CARD":
      return "Thẻ tín dụng"
    case "DEBT":
      return "Nợ"
    case "INVESTMENT":
      return "Đầu tư"
    default:
      return "Khác"
  }
}

// Get gradient styling based on account type
function getCardStyle(type: AccountType) {
  switch (type) {
    case "BANK":
      return "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-200/50 hover:border-blue-400/50 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800/40"
    case "WALLET":
    case "CASH":
      return "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-200/50 hover:border-emerald-400/50 dark:from-emerald-950/20 dark:to-teal-950/20 dark:border-emerald-800/40"
    case "CREDIT_CARD":
      return "bg-gradient-to-br from-rose-500/10 to-purple-500/10 border-rose-200/50 hover:border-rose-400/50 dark:from-rose-950/20 dark:to-purple-950/20 dark:border-rose-800/40"
    case "DEBT":
      return "bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-200/50 hover:border-orange-400/50 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-800/40"
    case "INVESTMENT":
      return "bg-gradient-to-br from-cyan-500/10 to-sky-500/10 border-cyan-200/50 hover:border-cyan-400/50 dark:from-cyan-950/20 dark:to-sky-950/20 dark:border-cyan-800/40"
    default:
      return "bg-gradient-to-br from-slate-500/10 to-zinc-500/10 border-slate-200/50 hover:border-slate-400/50 dark:from-slate-950/20 dark:to-zinc-950/20 dark:border-slate-800/40"
  }
}

export function AccountCard({
  name,
  accountNumber,
  owner,
  balance,
  type,
  onEdit,
  onDelete,
}: AccountCardProps) {
  return (
    <Card className={`w-full border shadow-sm transition-all duration-300 ${getCardStyle(type)}`}>
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background border shadow-sm">
              {getAccountIcon(type)}
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-base font-semibold truncate max-w-[120px] sm:max-w-[150px]">
                {name}
              </CardTitle>
              <CardDescription className="text-xs">
                {getAccountTypeLabel(type)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onEdit}>
              <SquarePen className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Chủ tài khoản:</span>
              <span className="font-medium text-foreground truncate max-w-[130px]">{owner}</span>
            </div>
            {accountNumber && (
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Số tài khoản:</span>
                <span className="font-medium text-foreground">{accountNumber}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2 border-t border-border/40">
          <div className="flex justify-between w-full items-center">
            <span className="text-xs text-muted-foreground">Số dư:</span>
            <span className="text-lg font-bold text-foreground">{formatVND(balance)}</span>
          </div>
        </CardFooter>
    </Card>
  )
}

export function AccountItem({
  card_name,
  tong_tai_khoan,
}: {
  card_name: string
  tong_tai_khoan: number
}) {
  return (
    <Card className="w-full border bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {card_name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {formatVND(tong_tai_khoan)}
        </p>
      </CardContent>
    </Card>
  )
}