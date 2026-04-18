'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const data = [
  { day: 'MON', sales: 4200 },
  { day: 'TUE', sales: 4500 },
  { day: 'WED', sales: 4100 },
  { day: 'THU', sales: 4800 },
  { day: 'FRI', sales: 5200 },
  { day: 'SAT', sales: 4900 },
  { day: 'SUN', sales: 4600 },
]

export function SalesChart() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Sales By Category</CardTitle>
        <CardDescription>Weekly sales breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="day"
              stroke="var(--muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              formatter={(value) => [`$${value}`, 'Sales']}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
