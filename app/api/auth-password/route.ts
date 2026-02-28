import { NextResponse } from 'next/server'

export async function GET() {
  const now = new Date()
  const utcMinutes = now.getUTCMinutes()
  const utcHours = now.getUTCHours()
  
  // Current valid password (next 10-minute slot)
  const nextSlot = Math.ceil((utcMinutes + 1) / 10) * 10
  const adjustedHour = nextSlot >= 60 ? (utcHours + 1) % 24 : utcHours
  const adjustedMinutes = nextSlot >= 60 ? 0 : nextSlot
  
  const password = `${String(adjustedHour).padStart(2, '0')}${String(adjustedMinutes).padStart(2, '0')}`
  
  // Also return previous slot for overlap
  const prevSlot = Math.floor(utcMinutes / 10) * 10
  const prevPassword = `${String(utcHours).padStart(2, '0')}${String(prevSlot).padStart(2, '0')}`
  
  return NextResponse.json({
    utc: now.toISOString(),
    currentPassword: password,
    previousPassword: prevPassword,
    hint: 'Password is UTC time rounded to next 10-minute boundary (HHMM format)',
    validUntil: new Date(now.getTime() + (10 - (utcMinutes % 10)) * 60000).toISOString()
  })
}
