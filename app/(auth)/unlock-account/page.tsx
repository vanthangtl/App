import { Suspense } from "react"
import { UnlockForm } from "./_components/unlock-form"

export const metadata = {
  title: "Mở khóa tài khoản — Finance App",
  description: "Yêu cầu mở khóa tài khoản bị khóa",
}

export default function UnlockAccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense>
          <UnlockForm />
        </Suspense>
      </div>
    </div>
  )
}
