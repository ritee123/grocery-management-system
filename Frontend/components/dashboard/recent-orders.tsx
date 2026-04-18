import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'

const orders = [
  {
    id: 1,
    product: 'Fresh Dairy',
    date: 'May 5',
    status: 'Received',
    price: '$145.80',
    customer: 'M-Starlight',
    statusColor: 'bg-green-100 text-green-700',
  },
  {
    id: 2,
    product: 'Vegetables',
    date: 'May 4',
    status: 'Received',
    price: '$210.30',
    customer: 'Serene W',
    statusColor: 'bg-green-100 text-green-700',
  },
  {
    id: 3,
    product: 'Rang Eggs',
    date: 'May 3',
    status: 'Received',
    price: '$298.40',
    customer: 'James D',
    statusColor: 'bg-green-100 text-green-700',
  },
]

export function RecentOrders() {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Recent sales</CardTitle>
          <CardDescription>Latest customer sales</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">#</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Item</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Date</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Price</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Customer</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-3">{order.id}</td>
                  <td className="py-3 px-3 font-medium">{order.product}</td>
                  <td className="py-3 px-3">{order.date}</td>
                  <td className="py-3 px-3">
                    <Badge className={order.statusColor} variant="outline">
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 font-medium">{order.price}</td>
                  <td className="py-3 px-3">{order.customer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
