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

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization')
  
  // Try either CRON_SECRET (Vercel) or SYNC_SECRET_TOKEN (Custom Cron)
  const cronSecret = process.env.CRON_SECRET
  const syncSecret = process.env.SYNC_SECRET_TOKEN
  
  // Custom cron sites might pass the secret in the Authorization header, or query param
  const url = new URL(req.url)
  const querySecret = url.searchParams.get('token')

  const isAuthorized = 
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (syncSecret && authHeader === `Bearer ${syncSecret}`) ||
    (syncSecret && querySecret === syncSecret)

  if (isAuthorized) {
    try {
      const results = await syncCompletedResults()
      return NextResponse.json({ 
        status: 'success', 
        message: 'Results synced via cron successfully',
        results 
      })
    } catch (err: any) {
      console.error('Cron Sync Error:', err)
      return NextResponse.json({ status: 'error', message: err.message }, { status: 500 })
    }
  }

  return NextResponse.json({ message: 'Unauthorized. Use POST with Bearer token, or GET with ?token=your_sync_secret' }, { status: 401 })
}
