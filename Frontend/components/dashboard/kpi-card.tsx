import { ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface KPICardProps {
  title: string
  value: string | number
  change: number
  isPositive: boolean
  icon: React.ReactNode
  chart?: React.ReactNode
}

export function KPICard({ title, value, change, isPositive, icon, chart }: KPICardProps) {
  return (
    <Card className="border-border bg-card hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="text-2xl font-bold mt-2">{value}</div>
          <div className="flex items-center gap-1 mt-1">
            {isPositive ? (
              <>
                <ArrowUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">{change}%</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600 font-medium">{change}%</span>
              </>
            )}
            <span className="text-xs text-muted-foreground ml-1">this week</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <div className="text-primary">{icon}</div>
        </div>
      </CardHeader>
      {chart && <CardContent>{chart}</CardContent>}
    </Card>
  )
}
