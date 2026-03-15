'use client'

import { useActionState, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { signup } from './actions'
import { useSearchParams } from 'next/navigation'

const initialState = {
  error: null as string | null,
}

function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await signup(formData)
      if (res?.error) {
        return { error: res.error }
      }
      return { error: null }
    },
    initialState
  )

  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') || ''

  return (
    <>
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="next" value={nextUrl} />
        <div className="space-y-2 text-left">
          <Label htmlFor="username" className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Username</Label>
          <Input id="username" name="username" type="text" placeholder="QuantMaster2000" required className="bg-background/80 h-11" />
        </div>
        <div className="space-y-2 text-left">
          <Label htmlFor="email" className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required className="bg-background/80 h-11" />
        </div>
        <div className="space-y-2 text-left">
          <Label htmlFor="password" className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Password</Label>
          <Input id="password" name="password" type="password" required className="bg-background/80 h-11" />
        </div>

        {state?.error && (
          <div className="text-sm font-medium text-destructive mt-2 text-center bg-destructive/10 py-2 rounded-md">
            {state.error}
          </div>
        )}

        <Button disabled={pending} type="submit" className="w-full mt-4 font-bold h-12 text-base">
          {pending ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground pt-6 border-t border-border/50 mt-6 pb-2">
        Already have an account? <Link href={nextUrl ? `/login?next=${encodeURIComponent(nextUrl)}` : '/login'} className="text-primary hover:underline font-semibold ml-1">Sign In</Link>
      </div>
    </>
  )
}

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md bg-card/40 backdrop-blur border-border/50 shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight">Register Owner</CardTitle>
          <CardDescription>Join the elite arena of sports prediction bots.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
            <RegisterForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
