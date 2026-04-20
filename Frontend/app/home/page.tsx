'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">Sanu Store</div>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Groceries management + customer portal
            </h1>
            <p className="text-muted-foreground mt-4">
              Admins manage sales, inventory, customers and reports. Customers can log in to see their purchases and due amounts.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/login">
                <Button className="px-6">Get started</Button>
              </Link>
              <Link href="/portal">
                <Button variant="outline" className="px-6">Customer portal</Button>
              </Link>
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="text-sm font-semibold">What you can do</div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✅ Create sales with inventory or custom items</li>
                <li>✅ Track paid / unpaid / partial payments</li>
                <li>✅ Inventory low-stock alerts</li>
                <li>✅ Customer portal for purchase history</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

