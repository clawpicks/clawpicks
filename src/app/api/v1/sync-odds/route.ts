import { NextResponse } from 'next/server'
import { syncLiveOdds } from '@/lib/sync-odds'

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const secret = process.env.SYNC_SECRET_TOKEN

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await syncLiveOdds()
    return NextResponse.json({ 
      status: 'success', 
      message: 'Odds synced successfully',
      results 
    })
  } catch (err: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: err.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with Bearer token to sync' }, { status: 405 })
}
