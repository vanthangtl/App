"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { requestUnlockAction } from "../actions"

export function UnlockForm({ className, ...props }: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleFormAction = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const result = await requestUnlockAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSubmitted(true)
      }
    })
  }

  if (submitted) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="text-5xl">📬</div>
              <h2 className="text-xl font-bold text-foreground">
                Kiểm tra hộp thư của bạn
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Nếu email này có trong hệ thống, chúng tôi đã gửi hướng dẫn mở khóa.
                Đường dẫn có hiệu lực trong <strong>5 phút</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                Không thấy email? Kiểm tra thư mục spam hoặc
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmitted(false)}
              >
                Thử lại
              </Button>
              <div>
                <Link
                  href="/login"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ← Quay lại đăng nhập
                </Link>
              </div>
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
          <div className="text-center mb-2 text-4xl">🔓</div>
          <CardTitle className="text-center text-2xl font-bold">
            Mở khóa tài khoản
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Nhập email đăng ký để nhận đường dẫn đặt lại mật khẩu và mở khóa tài khoản.
          </p>
        </CardHeader>
        <CardContent>
          <form action={handleFormAction}>
            <FieldGroup className="flex flex-col gap-4">
              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-900/50">
                  {error}
                </div>
              )}
              <Field className="flex flex-col gap-2">
                <FieldLabel htmlFor="email">Địa chỉ email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  disabled={isPending}
                  autoFocus
                />
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Đang gửi..." : "Gửi hướng dẫn mở khóa"}
                </Button>
              </Field>
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
