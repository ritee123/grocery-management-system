'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { getAuthRole, isAuthenticated } from '@/lib/auth'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const isPublicPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/portal' ||
    pathname === '/home'

  useEffect(() => {
    // Client-side guarding for admin pages
    if (isPublicPage) return
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    const role = getAuthRole()
    if (role === 'customer') {
      router.push('/portal')
    }
  }, [isPublicPage, router])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  if (isPublicPage) {
    return <main className="min-h-screen bg-background">{children}</main>
  }

  return (
    <div className="flex h-dvh">
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>
    </div>
  )
}

