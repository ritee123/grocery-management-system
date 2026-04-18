'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchBootstrapData } from '@/lib/api'
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Users,
  Clock,
  CreditCard,
  Banknote,
  Wallet,
  Package,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Stat Card Component matching the design
interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  iconBg: string
}

function StatCard({ title, value, change, icon, iconBg }: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${iconBg}`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {change >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {change >= 0 ? '+' : ''}{change}% vs last week
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [customers, setCustomers] = useState([])
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [salesRange, setSalesRange] = useState<'last_month' | 'last_3_months' | 'last_year'>('last_month')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchBootstrapData()
      .then((data) => {
        if (cancelled) return
        setCustomers(data.customers)
        setSales(data.sales)
        setProducts(data.products)
        setExpenses(data.expenses)
      })
      .catch((error) => {
        console.error('Failed to load dashboard data:', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const totalSalesCount = sales.length
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalCustomers = customers.length

  const paymentMethodData = useMemo(() => {
    const cashTotal = sales
      .filter((sale) => sale.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + sale.totalAmount, 0)
    const onlineTotal = sales
      .filter((sale) => sale.paymentMethod === 'online')
      .reduce((sum, sale) => sum + sale.totalAmount, 0)
    
    return [
      { name: 'Online', value: onlineTotal, color: '#22C55E' },
      { name: 'Cash', value: cashTotal, color: '#F59E0B' },
      { name: 'Wallet', value: 0, color: '#3B82F6' },
    ]
  }, [sales])

  const topPaymentMethod = paymentMethodData.reduce((a, b) => a.value > b.value ? a : b)

  const salesRangeConfig = useMemo(() => {
    const now = new Date()
    const end = now
    const start = new Date(now)
    if (salesRange === 'last_month') start.setDate(now.getDate() - 30)
    if (salesRange === 'last_3_months') start.setMonth(now.getMonth() - 3)
    if (salesRange === 'last_year') start.setFullYear(now.getFullYear() - 1)
    return { start, end }
  }, [salesRange])

  // Sales analytics data (real monthly aggregation from sales/expenses)
  const salesAnalyticsData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const incomeByMonth = new Array(12).fill(0)
    const expenseByMonth = new Array(12).fill(0)

    const { start, end } = salesRangeConfig

    for (const sale of sales) {
      const date = new Date(sale.date)
      if (Number.isNaN(date.getTime())) continue
      if (date < start || date > end) continue
      incomeByMonth[date.getMonth()] += Number(sale.totalAmount) || 0
    }

    for (const expense of expenses) {
      const date = new Date(expense.date)
      if (Number.isNaN(date.getTime())) continue
      if (date < start || date > end) continue
      expenseByMonth[date.getMonth()] += Number(expense.amount) || 0
    }

    return months.map((month, idx) => ({
      month,
      income: Math.round(incomeByMonth[idx]),
      expenses: Math.round(expenseByMonth[idx]),
    }))
  }, [sales, expenses, salesRangeConfig])

  const analyticsTotals = useMemo(() => {
    const income = salesAnalyticsData.reduce((sum, row) => sum + (row.income || 0), 0)
    const expensesTotal = salesAnalyticsData.reduce((sum, row) => sum + (row.expenses || 0), 0)
    return { income, expenses: expensesTotal }
  }, [salesAnalyticsData])

  const analyticsChangePercent = useMemo(() => {
    const now = new Date()
    const { start, end } = salesRangeConfig
    const durationMs = end.getTime() - start.getTime()
    if (durationMs <= 0) return 0
    const prevStart = new Date(start.getTime() - durationMs)
    const prevEnd = new Date(start.getTime())

    const currentIncome = sales
      .filter((s) => {
        const d = new Date(s.date)
        return !Number.isNaN(d.getTime()) && d >= start && d <= end
      })
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)

    const prevIncome = sales
      .filter((s) => {
        const d = new Date(s.date)
        return !Number.isNaN(d.getTime()) && d >= prevStart && d <= prevEnd
      })
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)

    if (prevIncome === 0) return currentIncome > 0 ? 100 : 0
    return Math.round(((currentIncome - prevIncome) / prevIncome) * 100)
  }, [sales, salesRangeConfig])

  // Weekly sales data
  const weeklySalesData = useMemo(() => {
    const now = new Date()
    const weeksCount = 4
    const msInDay = 24 * 60 * 60 * 1000
    const ranges = Array.from({ length: weeksCount }, (_, idx) => {
      // Oldest -> newest
      const end = new Date(now.getTime() - (weeksCount - 1 - idx) * 7 * msInDay)
      const start = new Date(end.getTime() - 7 * msInDay)
      return { start, end, label: `Week ${idx + 1}` }
    })

    return ranges.map(({ start, end, label }) => {
      const salesInWeek = sales.filter((s) => {
        const d = new Date(s.date)
        return !Number.isNaN(d.getTime()) && d >= start && d < end
      })

      const orders = salesInWeek.length
      const revenue = salesInWeek.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)

      const qtyByProduct = new Map<string, { name: string; qty: number }>()
      for (const s of salesInWeek) {
        for (const item of s.items || []) {
          const key = String(item.productId ?? item.product_id ?? item.productName ?? item.product_name ?? 'unknown')
          const name = String(item.productName ?? item.product_name ?? 'Unknown')
          const qty = Number(item.quantity) || 0
          const prev = qtyByProduct.get(key)
          qtyByProduct.set(key, { name, qty: (prev?.qty || 0) + qty })
        }
      }
      const topSelling =
        Array.from(qtyByProduct.values()).sort((a, b) => b.qty - a.qty)[0]?.name ?? '-'

      const newCustomers = customers.filter((c) => {
        const d = new Date(c.createdAt)
        return !Number.isNaN(d.getTime()) && d >= start && d < end
      }).length

      return { week: label, orders, revenue: Math.round(revenue), topSelling, newCustomers }
    })
  }, [sales, customers])

  const lowStockProduct = useMemo(() => {
    const low = products
      .filter((p) => (Number(p.stockQuantity) || 0) <= (Number(p.reorderLevel) || 0))
      .sort((a, b) => (Number(a.stockQuantity) || 0) - (Number(b.stockQuantity) || 0))
    return low[0] ?? null
  }, [products])

  // Recent orders
  const recentOrders = sales.slice(0, 5).map((sale) => ({
    id: sale.id,
    customer: sale.customerName,
    date: new Date(sale.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' }),
    status: sale.paymentStatus,
    amount: sale.totalAmount,
  }))

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Sales"
          value={totalSalesCount.toLocaleString()}
          change={10}
          icon={<ShoppingCart className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-100 dark:bg-emerald-950"
        />
        <StatCard
          title="Revenue"
          value={`Rs ${totalRevenue.toLocaleString()}`}
          change={12}
          icon={<DollarSign className="w-5 h-5 text-amber-600" />}
          iconBg="bg-amber-100 dark:bg-amber-950"
        />
        <StatCard
          title="Total Customers"
          value={totalCustomers.toLocaleString()}
          change={10}
          icon={<Users className="w-5 h-5 text-orange-600" />}
          iconBg="bg-orange-100 dark:bg-orange-950"
        />

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Analytics */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Sales Analytics</CardTitle>
            <select
              className="text-sm border rounded-lg px-3 py-1.5 bg-background"
              value={salesRange}
              onChange={(e) => setSalesRange(e.target.value as any)}
            >
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_year">Last Year</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-muted-foreground">Income</span>
                <span className="text-sm font-semibold">Rs {analyticsTotals.income.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-muted-foreground">Expenses</span>
                <span className="text-sm font-semibold">Rs {analyticsTotals.expenses.toLocaleString()}</span>
              </div>
              <div className={`flex items-center gap-2 ${analyticsChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {analyticsChangePercent >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {analyticsChangePercent >= 0 ? '+' : ''}{analyticsChangePercent}% vs previous period
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              {mounted ? (
                <AreaChart data={salesAnalyticsData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `${value/1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    formatter={(value: number) => `Rs ${value.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expenses" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              ) : null}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative">
                {mounted ? (
                  <PieChart width={200} height={200}>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `Rs ${value.toLocaleString()}`} />
                  </PieChart>
                ) : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">Rs {totalRevenue.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Total Income</span>
                  <span className="text-xs text-muted-foreground">Last Month</span>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-xs text-muted-foreground">COD</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-muted-foreground">Wallet</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6 w-full">
                <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950">
                    <Banknote className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Rs {paymentMethodData[1].value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">COD Top Method</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{totalSalesCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Sale count</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Sales Table */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Weekly sales overview</CardTitle>
            <button className="text-sm text-primary hover:underline">See All</button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Week</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total sales</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Selling</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Customers</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklySalesData.map((row, idx) => (
                    <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium">{row.week}</td>
                      <td className="py-4 px-4 text-sm">{row.orders}</td>
                      <td className="py-4 px-4 text-sm">Rs {row.revenue.toLocaleString()}</td>
                      <td className="py-4 px-4 text-sm">{row.topSelling}</td>
                      <td className="py-4 px-4 text-sm">{row.newCustomers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <button className="text-sm text-primary hover:underline">See All</button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium">{order.customer.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sale #{order.id}</p>
                    <p className="text-xs text-muted-foreground">{order.customer} - {order.date}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  order.status === 'paid' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : order.status === 'partial'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                }`}>
                  {order.status === 'paid' ? 'Paid' : order.status === 'partial' ? 'Partial' : 'Unpaid'}
                </span>
              </div>
            ))}

            {/* Low Stock Alert */}
            <div className="flex items-center justify-between py-2 border-t pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Low Stock Alert</p>
                  <p className="text-xs text-muted-foreground">
                    {lowStockProduct ? lowStockProduct.name : 'No low stock items'} - {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                {lowStockProduct ? 'Low Stock' : 'OK'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
