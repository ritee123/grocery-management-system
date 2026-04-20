'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { fetchBootstrapData } from '@/lib/api'
import type { Customer, Expense, Product, Sale } from '@/lib/store'
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
  CalendarDays,
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
  BarChart,
  Bar,
} from 'recharts'
import { addDays, endOfDay, format, startOfDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'

// Stat Card Component matching the design
interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  iconBg: string
}

type SalesPerformanceGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly'

function startOfLocalDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfLocalMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfLocalYear(date: Date) {
  const d = new Date(date.getFullYear(), 0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function addLocalMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function addLocalYears(date: Date, years: number) {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d
}

function defaultSalesPerformanceWindow(
  granularity: SalesPerformanceGranularity,
  now: Date,
): { start: Date; end: Date } {
  const end = endOfDay(now)

  if (granularity === 'daily') {
    return { start: startOfLocalDay(addDays(now, -13)), end }
  }

  if (granularity === 'weekly') {
    return { start: startOfLocalDay(addDays(now, -7 * 7 + 1)), end }
  }

  if (granularity === 'monthly') {
    return { start: startOfLocalMonth(addLocalMonths(now, -5)), end }
  }

  // yearly
  return { start: startOfLocalYear(addLocalYears(now, -2)), end }
}

function buildSalesPerformanceBuckets(
  granularity: SalesPerformanceGranularity,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const buckets: { key: string; label: string; start: Date; end: Date }[] = []

  let cursor = new Date(rangeStart)
  const hardEnd = new Date(rangeEnd)

  const pushBucket = (start: Date, end: Date, label: string, key: string) => {
    buckets.push({ key, label, start, end })
  }

  if (granularity === 'daily') {
    let day = startOfLocalDay(cursor)
    const endDay = startOfLocalDay(hardEnd)
    while (day <= endDay) {
      const start = startOfLocalDay(day)
      const end = endOfDay(day)
      pushBucket(start, end, format(start, 'MMM d'), format(start, 'yyyy-MM-dd'))
      day = addDays(day, 1)
    }
    return buckets
  }

  if (granularity === 'weekly') {
    let weekStart = startOfLocalDay(cursor)
    while (weekStart <= hardEnd) {
      const start = startOfLocalDay(weekStart)
      const end = endOfDay(addDays(start, 6))
      pushBucket(start, end, `Week of ${format(start, 'MMM d')}`, format(start, 'yyyy-MM-dd'))
      weekStart = addDays(weekStart, 7)
    }
    return buckets
  }

  if (granularity === 'monthly') {
    let monthStart = startOfLocalMonth(cursor)
    const endMonth = startOfLocalMonth(hardEnd)
    while (monthStart <= endMonth) {
      const start = startOfLocalMonth(monthStart)
      const nextMonthStart = addLocalMonths(start, 1)
      const end = new Date(nextMonthStart.getTime() - 1)
      pushBucket(start, end, format(start, 'MMM yyyy'), format(start, 'yyyy-MM'))
      monthStart = addLocalMonths(monthStart, 1)
    }
    return buckets
  }

  // yearly
  let yearStart = startOfLocalYear(cursor)
  const endYear = startOfLocalYear(hardEnd)
  while (yearStart <= endYear) {
    const start = startOfLocalYear(yearStart)
    const end = endOfDay(addLocalYears(start, 1))
    const end2 = new Date(end.getTime() - 1)
    pushBucket(start, end2, format(start, 'yyyy'), format(start, 'yyyy'))
    yearStart = addLocalYears(yearStart, 1)
  }

  return buckets
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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [salesRange, setSalesRange] = useState<'last_month' | 'last_3_months' | 'last_year'>('last_month')
  const [salesPerformanceGranularity, setSalesPerformanceGranularity] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly'
  >('daily')
  const [salesPerformanceRange, setSalesPerformanceRange] = useState<DateRange | undefined>(undefined)
  const [salesPerformanceRangeOpen, setSalesPerformanceRangeOpen] = useState(false)

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

  const salesPerformanceData = useMemo(() => {
    const now = new Date()

    const from = salesPerformanceRange?.from
    const to = salesPerformanceRange?.to

    const window =
      from && to
        ? { start: startOfLocalDay(from), end: endOfDay(to) }
        : from && !to
          ? { start: startOfLocalDay(from), end: endOfDay(from) }
          : defaultSalesPerformanceWindow(salesPerformanceGranularity, now)

    const buckets = buildSalesPerformanceBuckets(salesPerformanceGranularity, window.start, window.end)

    return buckets.map((b) => {
      const salesInBucket = sales.filter((s) => {
        const d = new Date(s.date)
        return !Number.isNaN(d.getTime()) && d >= b.start && d <= b.end
      })

      let closedCount = 0
      let partialCount = 0
      let unpaidCount = 0

      let closedRevenue = 0
      let partialRevenue = 0
      let unpaidRevenue = 0

      for (const s of salesInBucket) {
        const gross = Number(s.totalAmount) || 0
        const paid = Number(s.paidAmount) || 0

        if (s.paymentStatus === 'paid') {
          closedCount += 1
          closedRevenue += gross
        } else if (s.paymentStatus === 'partial') {
          partialCount += 1
          partialRevenue += paid
        } else {
          unpaidCount += 1
          unpaidRevenue += gross
        }
      }

      const openCount = partialCount + unpaidCount
      const openRevenue = partialRevenue + unpaidRevenue
      const totalCount = salesInBucket.length
      const totalRevenue = closedRevenue + openRevenue
      const successRate = totalRevenue > 0 ? (closedRevenue / totalRevenue) * 100 : totalCount > 0 && openCount === 0 ? 100 : 0

      return {
        ...b,
        closedCount,
        openCount,
        partialCount,
        unpaidCount,
        closedRevenue,
        openRevenue,
        partialRevenue,
        unpaidRevenue,
        totalCount,
        totalRevenue,
        successRate,
      }
    })
  }, [sales, salesPerformanceGranularity, salesPerformanceRange])

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

  const salesPerformanceRangeLabel = useMemo(() => {
    const from = salesPerformanceRange?.from
    const to = salesPerformanceRange?.to

    if (from && to) {
      return `${format(startOfLocalDay(from), 'MMM d, yyyy')} – ${format(endOfDay(to), 'MMM d, yyyy')}`
    }

    if (from && !to) {
      return `${format(startOfLocalDay(from), 'MMM d, yyyy')}`
    }

    const now = new Date()
    const w = defaultSalesPerformanceWindow(salesPerformanceGranularity, now)
    return `${format(w.start, 'MMM d, yyyy')} – ${format(w.end, 'MMM d, yyyy')}`
  }, [salesPerformanceGranularity, salesPerformanceRange])

  const SalesPerformanceTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload?.length) return null
    const row = payload[0]?.payload as any
    if (!row) return null

    const totalOrders = row.totalCount ?? 0
    const netRevenue = row.totalRevenue ?? 0
    const successRate = row.successRate ?? 0

    return (
      <div className="rounded-xl border bg-white shadow-lg p-4 w-[min(92vw,520px)]">
        <div className="font-semibold text-sm mb-3">{row.label}</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="inline-block size-2 rounded-full bg-emerald-500" />
              Closed orders
            </div>
            <div className="mt-2 text-2xl font-bold">{row.closedCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">Revenue</div>
            <div className="text-sm font-semibold text-emerald-700">Rs {Number(row.closedRevenue || 0).toLocaleString()}</div>
            <div className="mt-3 text-xs font-semibold text-muted-foreground">Breakdown</div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium">{row.closedCount}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="inline-block size-2 rounded-full bg-red-500" />
              Open orders
            </div>
            <div className="mt-2 text-2xl font-bold">{row.openCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">At-risk / unpaid total</div>
            <div className="text-sm font-semibold text-red-700">Rs {Number(row.openRevenue || 0).toLocaleString()}</div>
            <div className="mt-3 text-xs font-semibold text-muted-foreground">Breakdown</div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Partial</span>
                <span className="font-medium">{row.partialCount}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Unpaid</span>
                <span className="font-medium">{row.unpaidCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-3">
          <div>
            <div className="text-[11px] text-muted-foreground">Total orders</div>
            <div className="text-lg font-bold">{totalOrders}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Net revenue</div>
            <div className="text-lg font-bold text-emerald-700">Rs {Number(netRevenue || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Paid share</div>
            <div className="text-lg font-bold text-emerald-700">{successRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    )
  }

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
        {/* Sales performance (weekly overview replacement) */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-white">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
            <CardTitle className="text-lg font-semibold">Sales performance</CardTitle>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end w-full sm:w-auto">
              <ToggleGroup
                type="single"
                value={salesPerformanceGranularity}
                onValueChange={(value) => {
                  if (!value) return
                  setSalesPerformanceGranularity(value as SalesPerformanceGranularity)
                  setSalesPerformanceRange(undefined)
                }}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <ToggleGroupItem value="daily" className="text-xs sm:text-sm">
                  Daily
                </ToggleGroupItem>
                <ToggleGroupItem value="weekly" className="text-xs sm:text-sm">
                  Weekly
                </ToggleGroupItem>
                <ToggleGroupItem value="monthly" className="text-xs sm:text-sm">
                  Monthly
                </ToggleGroupItem>
                <ToggleGroupItem value="yearly" className="text-xs sm:text-sm">
                  Yearly
                </ToggleGroupItem>
              </ToggleGroup>

              <Popover open={salesPerformanceRangeOpen} onOpenChange={setSalesPerformanceRangeOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto justify-center">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Date range</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarPicker
                    mode="range"
                    selected={salesPerformanceRange}
                    onSelect={(range) => setSalesPerformanceRange(range)}
                    numberOfMonths={2}
                    initialFocus
                  />
                  <div className="flex items-center justify-between gap-2 p-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSalesPerformanceRange(undefined)
                        setSalesPerformanceRangeOpen(false)
                      }}
                    >
                      Reset
                    </Button>
                    <Button size="sm" onClick={() => setSalesPerformanceRangeOpen(false)}>
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
              <div className="text-xs text-muted-foreground">{salesPerformanceRangeLabel}</div>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="inline-block size-2 rounded-sm bg-emerald-500" />
                  Closed orders
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block size-2 rounded-sm bg-red-500" />
                  Open orders
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              {mounted ? (
                <BarChart data={salesPerformanceData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    interval={
                      salesPerformanceGranularity === 'daily' && salesPerformanceData.length > 14
                        ? Math.max(0, Math.ceil(salesPerformanceData.length / 12) - 1)
                        : 0
                    }
                    height={48}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    tickMargin={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                    content={<SalesPerformanceTooltip />}
                  />
                  <Bar dataKey="closedCount" name="Closed orders" stackId="orders" fill="#22C55E" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="openCount" name="Open orders" stackId="orders" fill="#EF4444" radius={[0, 0, 6, 6]} />
                </BarChart>
              ) : null}
            </ResponsiveContainer>
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
