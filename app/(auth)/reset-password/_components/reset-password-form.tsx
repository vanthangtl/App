"use client"

import { useState, useTransition, useRef } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { resetPasswordAction } from "../actions"

// ─── Password strength helpers ──────────────────────────────────────────────

function getPasswordStrength(password: string): {
  score: number   // 0-4
  label: string
  color: string
} {
  if (!password) return { score: 0, label: "", color: "" }

  let score = 0
  if (password.length >= 8)  score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  // Clamp to 4
  score = Math.min(score, 4)

  const map = [
    { label: "",          color: "" },
    { label: "Yếu",       color: "bg-red-500" },
    { label: "Trung bình",color: "bg-orange-400" },
    { label: "Khá",       color: "bg-yellow-400" },
    { label: "Mạnh",      color: "bg-green-500" },
  ]
  return { score, ...map[score] }
}

// ─── Eye icon (toggle show/hide) ────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

// ─── Password checklist item ─────────────────────────────────────────────────

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={cn(
      "flex items-center gap-1.5 transition-colors duration-200",
      ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
    )}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        className={cn("w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200",
          ok ? "text-green-500" : "text-muted-foreground/40"
        )}>
        {ok
          ? <><polyline points="20 6 9 17 4 12" /></>
          : <><circle cx="12" cy="12" r="9" strokeWidth="1.5" /></>
        }
      </svg>
      <span>{label}</span>
    </li>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const confirmRef = useRef<HTMLInputElement>(null)

  const strength = getPasswordStrength(password)

  const checks = {
    length: password.length >= 8,
    upper:  /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }

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

  // ── Session hết hạn ────────────────────────────────────────────────────────
  if (sessionExpired) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent className="pt-10 pb-10">
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
                <svg className="w-8 h-8 text-destructive" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-destructive">Đường dẫn đã hết hạn</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  Phiên xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email mở khóa.
                </p>
              </div>
              <Link href="/unlock-account" className="w-full">
                <Button className="w-full">Yêu cầu mở khóa lại</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
          </div>
          <div className="text-center space-y-1">
            <CardTitle className="text-2xl font-bold">Đặt mật khẩu mới</CardTitle>
            <p className="text-sm text-muted-foreground">
              Nhập mật khẩu mới để mở khóa tài khoản của bạn.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form action={handleFormAction}>
            <FieldGroup className="flex flex-col gap-4">
              {error && !sessionExpired && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-900/50">
                  {error}
                </div>
              )}

              {/* ── Mật khẩu mới ── */}
              <Field className="flex flex-col gap-2">
                <FieldLabel htmlFor="password">Mật khẩu mới</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    minLength={8}
                    disabled={isPending}
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>

                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 rounded-full transition-all duration-300",
                            i <= strength.score ? strength.color : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className={cn(
                        "text-xs font-medium transition-colors",
                        strength.score === 1 && "text-red-500",
                        strength.score === 2 && "text-orange-500",
                        strength.score === 3 && "text-yellow-600 dark:text-yellow-400",
                        strength.score === 4 && "text-green-600 dark:text-green-400",
                      )}>
                        Độ mạnh: {strength.label}
                      </p>
                    )}
                  </div>
                )}
              </Field>

              {/* ── Checklist yêu cầu ── */}
              {password.length > 0 && (
                <ul className="text-xs space-y-1 bg-muted/50 rounded-md px-3 py-2.5">
                  <CheckItem ok={checks.length} label="Ít nhất 8 ký tự" />
                  <CheckItem ok={checks.upper}  label="Chữ hoa và chữ thường" />
                  <CheckItem ok={checks.number} label="Ít nhất 1 chữ số (0–9)" />
                  <CheckItem ok={checks.symbol} label="Ít nhất 1 ký tự đặc biệt (!@#…)" />
                </ul>
              )}

              {/* ── Xác nhận mật khẩu ── */}
              <Field className="flex flex-col gap-2">
                <FieldLabel htmlFor="confirmPassword">Xác nhận mật khẩu</FieldLabel>
                <div className="relative">
                  <Input
                    ref={confirmRef}
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    required
                    minLength={8}
                    disabled={isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending || !checks.length}
                >
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
