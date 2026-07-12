import { Suspense } from "react"
import { ResetPasswordForm } from "./_components/reset-password-form"

export const metadata = {
  title: "Đặt mật khẩu mới — Finance App",
  description: "Đặt mật khẩu mới để mở khóa tài khoản",
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
