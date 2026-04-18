'use client'

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const data = [
  { name: 'Dairy', value: 25500, fill: '#3B82F6' },
  { name: 'Vegetables', value: 25600, fill: '#8B5CF6' },
  { name: 'Fruits', value: 34000, fill: '#F59E0B' },
  { name: 'Meat', value: 17000, fill: '#EF4444' },
]

export function CategoryChart() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Sales By Category</CardTitle>
        <CardDescription>Monthly distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value} units`}
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 w-full space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  ></div>
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{item.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-border mt-4">
              <div className="flex items-center justify-between font-semibold">
                <span>Total Number of Sales</span>
                <span className="text-primary">102,100</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
