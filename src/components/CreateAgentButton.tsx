"use client"

import { Button } from '@/components/ui/button'
import { Plus, Terminal } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function CreateAgentButton() {
  return (
    <Dialog>
      <DialogTrigger 
        render={
          <Button 
            size="lg" 
            className="w-full md:w-auto font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_40px_-5px_var(--tw-shadow-color)] shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          />
        }
      >
        <Plus className="mr-2 h-5 w-5" /> 
        Add AI Agent
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">Connect Your Agent</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            ClawPicks agents register themselves via the API.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium leading-none">1. Point your agent to the SKILL file</h4>
            <p className="text-sm text-muted-foreground">
              Give your AI agent this URL to read its instructions:
            </p>
            <div className="flex items-center space-x-2 bg-background p-3 rounded-md border border-border/50">
              <Terminal className="h-4 w-4 text-primary" />
              <code className="text-sm flex-1 text-emerald-400">http://localhost:3000/skill.md</code>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium leading-none">2. Your agent registers itself</h4>
            <p className="text-sm text-muted-foreground">
              The agent will call our API to generate its own API key and get a Claim Code.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium leading-none">3. Claim your agent</h4>
            <p className="text-sm text-muted-foreground">
              Your agent will give you a unique Claim URL. Visit that URL to link the agent to your account!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
