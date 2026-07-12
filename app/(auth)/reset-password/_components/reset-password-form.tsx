"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { resetPasswordAction } from "../actions"

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleFormAction = (formData: FormData) => {
    setError(null)
    setSessionExpired(false)
    startTransition(async () => {
      const result = await resetPasswordAction(formData)
      if (result?.error) {
        setError(result.error)
        if (result.sessionExpired) {
          setSessionExpired(true)
        }
      }
      // Nếu thành công, server redirect về /login — không cần xử lý thêm
    })
  }

  // Session hết hạn — hiển thị hướng dẫn yêu cầu lại
  if (sessionExpired) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="text-5xl">⏰</div>
              <h2 className="text-xl font-bold text-destructive">
                Đường dẫn đã hết hạn
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Phiên xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email mở khóa.
              </p>
              <Link href="/unlock-account">
                <Button>Yêu cầu mở khóa lại</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <div className="text-center mb-2 text-4xl">🔑</div>
          <CardTitle className="text-center text-2xl font-bold">
            Đặt mật khẩu mới
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Nhập mật khẩu mới để mở khóa tài khoản của bạn.
          </p>
        </CardHeader>
        <CardContent>
          <form action={handleFormAction}>
            <FieldGroup className="flex flex-col gap-4">
              {error && !sessionExpired && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-900/50">
                  {error}
                </div>
              )}

              <Field className="flex flex-col gap-2">
                <FieldLabel htmlFor="password">Mật khẩu mới</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  required
                  minLength={8}
                  disabled={isPending}
                  autoFocus
                />
              </Field>

              <Field className="flex flex-col gap-2">
                <FieldLabel htmlFor="confirmPassword">Xác nhận mật khẩu</FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  required
                  minLength={8}
                  disabled={isPending}
                />
              </Field>

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                💡 Mật khẩu phải có ít nhất 8 ký tự.
              </div>

              <Field>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Đang cập nhật..." : "Xác nhận mật khẩu mới"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
