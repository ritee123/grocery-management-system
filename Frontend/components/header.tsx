'use client'

import { Search, Bell, MessageSquare, Globe, Menu } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden rounded-xl"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-md min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search properties..."
              className="pl-10 bg-muted/50 border-0 text-sm h-10 rounded-lg"
            />
            <div className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-white px-1.5 py-0.5 rounded border">
              Ctrl K
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Messages */}
          <Button variant="ghost" size="icon" className="relative hover:bg-muted rounded-xl">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </Button>

          {/* Notification */}
          <Button variant="ghost" size="icon" className="relative hover:bg-muted rounded-xl">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
          </Button>

          {/* Language */}
          <Button variant="ghost" size="sm" className="hidden md:flex gap-2 hover:bg-muted rounded-xl text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span className="text-sm">English</span>
          </Button>

          {/* Profile */}
          <Link href="/profile" className="flex items-center gap-3 pl-2 md:pl-4 ml-1 md:ml-2 border-l hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
              S
            </div>
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium">Sanu Store</div>
              <div className="text-xs text-muted-foreground">oliviara53@gmail.com</div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
