import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'PDF generation endpoint — use @react-pdf/renderer in server actions' }, { status: 200 })
}
