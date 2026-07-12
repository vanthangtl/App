import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Finance App <noreply@yourdomain.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// --------------------------------------------------------------------------
// sendUnlockEmail
// Gửi email chứa đường dẫn mở khóa tài khoản.
// --------------------------------------------------------------------------
export async function sendUnlockEmail(toEmail: string, token: string): Promise<void> {
  const unlockUrl = `${APP_URL}/reset-password?token=${token}`

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: '🔓 Yêu cầu mở khóa tài khoản Finance App',
    html: `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Mở khóa tài khoản</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ef4444,#dc2626);
                       padding:36px 40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">🔒</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;
                         letter-spacing:-0.3px;">
                Tài khoản của bạn đã bị khóa
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Xin chào,
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Chúng tôi nhận được yêu cầu mở khóa tài khoản liên kết với địa chỉ email này.
                Nhấn vào nút bên dưới để đặt mật khẩu mới và mở khóa tài khoản:
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(135deg,#3b82f6,#2563eb);">
                    <a href="${unlockUrl}"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;
                              font-size:15px;font-weight:600;text-decoration:none;
                              border-radius:8px;letter-spacing:0.2px;">
                      Đặt mật khẩu mới &amp; Mở khóa
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;
                          padding:16px;margin-bottom:24px;">
                <p style="margin:0;color:#854d0e;font-size:13px;line-height:1.5;">
                  ⏱️ <strong>Lưu ý:</strong> Đường dẫn này chỉ có hiệu lực trong
                  <strong>5 phút</strong>. Sau đó bạn cần yêu cầu mở khóa lại.
                </p>
              </div>

              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.5;">
                Nếu nút không hoạt động, hãy sao chép và dán liên kết sau vào trình duyệt:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${unlockUrl}"
                   style="color:#3b82f6;font-size:12px;text-decoration:none;">
                  ${unlockUrl}
                </a>
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />

              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Nếu bạn không yêu cầu mở khóa, hãy bỏ qua email này.
                Tài khoản của bạn vẫn an toàn và đang bị khóa.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;
                       padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} Finance App. Mọi quyền được bảo lưu.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  })

  if (error) {
    console.error('[email] sendUnlockEmail error:', error)
    throw new Error('Không thể gửi email. Vui lòng thử lại sau.')
  }
}
