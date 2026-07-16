"use client"

import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { loginAction } from "../actions"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [accountLocked, setAccountLocked] = useState(false)
  const [isPending, startTransition] = useTransition()

  const searchParams = useSearchParams()
  const sessionRevoked   = searchParams.get('reason') === 'session_revoked'
  const passwordReset    = searchParams.get('reason') === 'password_reset'

  const handleFormAction = (formData: FormData) => {
    setError(null)
    setAccountLocked(false)
    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
        if (result.accountLocked) {
          setAccountLocked(true)
        }
      }
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-4xl font-bold">Đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleFormAction}>
            <FieldGroup className="flex flex-col gap-4">

              {/* Thông báo phiên bị thu hồi */}
              {sessionRevoked && (
                <div className="text-sm text-blue-700 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-300 p-3 rounded-md border border-blue-200 dark:border-blue-900/50">
                  🔒 Phiên đăng nhập của bạn đã hết hạn hoặc bị thu hồi. Vui lòng đăng nhập lại.
                </div>
              )}

              {/* Thông báo đặt lại mật khẩu thành công */}
              {passwordReset && (
                <div className="text-sm text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-300 p-3 rounded-md border border-green-200 dark:border-green-900/50">
                  ✅ Mật khẩu đã được cập nhật thành công. Tài khoản của bạn đã được mở khóa. Vui lòng đăng nhập lại.
                </div>
              )}

              {/* Banner tài khoản bị khóa */}
              {accountLocked && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-md p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🚫</span>
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400 text-sm">
                        Tài khoản đã bị khóa
                      </p>
                      <p className="text-red-600 dark:text-red-300 text-xs mt-1 leading-relaxed">
                        Tài khoản này đã bị khóa do nhập sai mật khẩu quá nhiều lần.
                        Nhấn nút bên dưới để yêu cầu mở khóa qua email.
                      </p>
                    </div>
                  </div>
                  <Link href="/unlock-account" className="block">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      🔓 Mở khóa tài khoản
                    </Button>
                  </Link>
                </div>
              )}

              {/* Lỗi thông thường (không phải locked) */}
              {error && !accountLocked && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-900/50">
                  {error}
                </div>
              )}

              <Field className="flex flex-col gap-2">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  disabled={isPending}
                />
              </Field>
              <Field className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isPending}
                />
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Đang xử lý..." : "Đăng nhập"}
                </Button>
              </Field>

              {/* Link mở khóa luôn hiển thị (nhỏ, dưới nút) */}
              <div className="text-center">
                <Link
                  href="/unlock-account"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tài khoản bị khóa?{" "}
                  <span className="underline underline-offset-2">Mở khóa qua email</span>
                </Link>
              </div>

            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
