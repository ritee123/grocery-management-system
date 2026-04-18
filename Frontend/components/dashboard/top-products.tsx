import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const products = [
  { name: 'Fresh Milk', price: '$684.00', sold: 342 },
  { name: 'Wheat Bread', price: '$512.00', sold: 256 },
  { name: 'Emerald Velvet', price: '$355.90', sold: 180 },
  { name: 'Organic Eggs', price: '$298.00', sold: 214 },
]

export function TopProducts() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Top inventory items</CardTitle>
        <CardDescription>Most popular items</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sold} sold</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-secondary/10">{product.price}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
