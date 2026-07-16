"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { forgotPasswordAction } from "../actions"

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleFormAction = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const result = await forgotPasswordAction(formData)
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
          <CardContent className="pt-10 pb-10">
            <div className="flex flex-col items-center gap-5 text-center">
              {/* Animated check icon */}
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                <svg
                  className="w-10 h-10 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  <path d="m16 19 2 2 4-4" />
                </svg>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold">Kiểm tra hộp thư của bạn</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  Nếu email này được đăng ký trong hệ thống, chúng tôi đã gửi
                  hướng dẫn đặt lại mật khẩu. Đường dẫn có hiệu lực trong{" "}
                  <strong>5 phút</strong>.
                </p>
              </div>

              <div className="w-full rounded-lg bg-muted/60 px-4 py-3 text-xs text-muted-foreground text-left space-y-1">
                <p className="font-medium text-foreground">Không thấy email?</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Kiểm tra thư mục Spam / Quảng cáo</li>
                  <li>Đợi vài phút rồi thử lại</li>
                  <li>Đảm bảo email đã đăng ký đúng chính tả</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSubmitted(false)}
                  className="w-full"
                >
                  Gửi lại email
                </Button>
                <Link href="/login" className="w-full">
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                    ← Quay lại đăng nhập
                  </Button>
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
        <CardHeader className="space-y-3">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <svg
                className="w-8 h-8 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                <circle cx="12" cy="16" r="1" />
              </svg>
            </div>
          </div>

          <div className="text-center space-y-1">
            <CardTitle className="text-2xl font-bold">Quên mật khẩu?</CardTitle>
            <p className="text-sm text-muted-foreground">
              Nhập email đăng ký. Chúng tôi sẽ gửi đường dẫn để đặt lại mật khẩu.
            </p>
          </div>
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
                  {isPending ? "Đang gửi..." : "Gửi đường dẫn đặt lại mật khẩu"}
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
