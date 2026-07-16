import { Suspense } from "react"
import { ForgotPasswordForm } from "./_components/forgot-password-form"

export const metadata = {
  title: "Quên mật khẩu — Finance App",
  description: "Nhập email để nhận đường dẫn đặt lại mật khẩu",
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
