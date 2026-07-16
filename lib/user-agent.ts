/**
 * Lightweight User-Agent parser — không dùng thư viện ngoài.
 * Trả về tên thiết bị, trình duyệt và hệ điều hành từ chuỗi User-Agent.
 */

export interface ParsedUserAgent {
  deviceName: string
  browser: string
  os: string
}

export function parseUserAgent(ua: string): ParsedUserAgent {
  const browser = detectBrowser(ua)
  const os = detectOS(ua)
  const deviceName = buildDeviceName(ua, os, browser)

  return { deviceName, browser, os }
}

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return 'Microsoft Edge'
  if (/OPR\/|Opera\//.test(ua)) return 'Opera'
  if (/YaBrowser\//.test(ua)) return 'Yandex Browser'
  if (/SamsungBrowser\//.test(ua)) return 'Samsung Internet'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Chrome\//.test(ua) && /Safari\//.test(ua)) return 'Chrome'
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari'
  if (/MSIE|Trident\//.test(ua)) return 'Internet Explorer'
  return 'Unknown Browser'
}

function detectOS(ua: string): string {
  if (/iPhone/.test(ua)) return 'iOS'
  if (/iPad/.test(ua)) return 'iPadOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11'
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1'
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Mac OS X/.test(ua)) {
    if (/iPhone|iPad/.test(ua)) return 'iOS'
    return 'macOS'
  }
  if (/Linux/.test(ua)) return 'Linux'
  if (/CrOS/.test(ua)) return 'ChromeOS'
  return 'Unknown OS'
}

function buildDeviceName(ua: string, os: string, browser: string): string {
  // Mobile devices
  if (/iPhone/.test(ua)) return `iPhone • ${browser}`
  if (/iPad/.test(ua)) return `iPad • ${browser}`

  // Samsung Galaxy
  const samsungMatch = ua.match(/SM-[A-Z0-9]+/)
  if (samsungMatch) return `Samsung ${samsungMatch[0]} • ${browser}`

  // Android phone
  if (/Android/.test(ua)) return `Android • ${browser}`

  // Desktop
  return `${os} • ${browser}`
}
