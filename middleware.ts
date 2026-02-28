import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Allowed networks bypass auth (public IP + local ranges)
const ALLOWED_IPS = [
  '70.106.235.230', // Current detected IP
  '192.168.',
  '10.',
  '::1',
  '127.',
]

// Also allow 172.16.0.0 - 172.31.255.255 (private range)
for (let i = 16; i <= 31; i++) {
  ALLOWED_IPS.push(`172.${i}.`)
}

function isAllowedIP(ip: string): boolean {
  return ALLOWED_IPS.some(allowed => ip.startsWith(allowed) || ip === allowed)
}

function generatePasswords(): { current: string; previous: string } {
  const now = new Date()
  const utcMinutes = now.getUTCMinutes()
  const utcHours = now.getUTCHours()
  
  // Current slot (next 10-minute boundary)
  const nextSlot = Math.ceil((utcMinutes + 1) / 10) * 10
  const adjustedHour = nextSlot >= 60 ? (utcHours + 1) % 24 : utcHours
  const adjustedMinutes = nextSlot >= 60 ? 0 : nextSlot
  const current = `${String(adjustedHour).padStart(2, '0')}${String(adjustedMinutes).padStart(2, '0')}`
  
  // Previous slot (for overlap at boundaries)
  const prevSlot = Math.floor(utcMinutes / 10) * 10
  const previous = `${String(utcHours).padStart(2, '0')}${String(prevSlot).padStart(2, '0')}`
  
  return { current, previous }
}

function checkAuth(authHeader: string | null): boolean {
  if (!authHeader) return false
  
  const base64Credentials = authHeader.split(' ')[1]
  if (!base64Credentials) return false
  
  try {
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
    const [, password] = credentials.split(':')
    
    const { current, previous } = generatePasswords()
    return password === current || password === previous
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'
  
  // Allowed IPs bypass auth
  if (isAllowedIP(ip)) {
    return NextResponse.next()
  }
  
  // All others require auth
  const authHeader = request.headers.get('authorization')
  
  if (!checkAuth(authHeader)) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Mission Control"',
      },
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)'],
}
