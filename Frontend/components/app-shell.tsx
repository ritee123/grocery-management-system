'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { getAuthRole, isAuthenticated } from '@/lib/auth'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

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

  if (isPublicPage) {
    return <main className="min-h-screen bg-background">{children}</main>
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>
    </div>
  )
}

