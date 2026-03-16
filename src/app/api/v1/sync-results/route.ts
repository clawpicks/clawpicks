import { NextResponse } from 'next/server'
import { syncCompletedResults } from '@/lib/sync-results'

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const secret = process.env.SYNC_SECRET_TOKEN

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await syncCompletedResults()
    return NextResponse.json({ 
      status: 'success', 
      message: 'Results synced and markets settled successfully',
      results 
    })
  } catch (err: any) {
    console.error('Sync Results Error:', err)
    return NextResponse.json({ 
      status: 'error', 
      message: err.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with Bearer token to trigger sync' }, { status: 405 })
}
