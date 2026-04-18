'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchExpenses, fetchSales } from '@/lib/api'
import { Expense, Sale } from '@/lib/store'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchSales(), fetchExpenses()])
      .then(([salesData, expenseData]) => {
        if (cancelled) return
        setSales(salesData)
        setExpenses(expenseData)
      })
      .catch((error) => {
        console.error('Failed to load report data:', error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Calculate last 7 days data
  const last7DaysData = useMemo(() => {
    const data: Array<{
      date: string
      sales: number
      paid: number
      unpaid: number
      expenses: number
      profit: number
    }> = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStart = new Date(date)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(date)
      dateEnd.setHours(23, 59, 59, 999)

      const daySales = sales
        .filter((sale) => new Date(sale.date) >= dateStart && new Date(sale.date) <= dateEnd)
        .reduce((sum, sale) => sum + sale.totalAmount, 0)

      const dayPaid = sales
        .filter(
          (sale) =>
            new Date(sale.date) >= dateStart && new Date(sale.date) <= dateEnd && sale.paymentStatus === 'paid'
        )
        .reduce((sum, sale) => sum + sale.totalAmount, 0)

      const dayUnpaid = sales
        .filter(
          (sale) =>
            new Date(sale.date) >= dateStart && new Date(sale.date) <= dateEnd && sale.paymentStatus === 'unpaid'
        )
        .reduce((sum, sale) => sum + sale.totalAmount, 0)

      const dayExpenses = expenses
        .filter((expense) => new Date(expense.date) >= dateStart && new Date(expense.date) <= dateEnd)
        .reduce((sum, expense) => sum + expense.amount, 0)

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: daySales,
        paid: dayPaid,
        unpaid: dayUnpaid,
        expenses: dayExpenses,
        profit: daySales - dayExpenses,
      })
    }

    return data
  }, [sales, expenses])

  // Payment method breakdown (all time)
  const paymentMethodData = useMemo(() => {
    const cash = sales
      .filter((s) => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.totalAmount, 0)
    const online = sales
      .filter((s) => s.paymentMethod === 'online')
      .reduce((sum, s) => sum + s.totalAmount, 0)

    return [
      { name: 'Cash', value: cash, color: '#10B981' },
      { name: 'Online', value: online, color: '#3B82F6' },
    ]
  }, [sales])

  // Customer payment status
  const paymentStatusData = useMemo(() => {
    const paid = sales
      .filter((s) => s.paymentStatus === 'paid')
      .reduce((sum, s) => sum + s.totalAmount, 0)
    const unpaid = sales
      .filter((s) => s.paymentStatus === 'unpaid')
      .reduce((sum, s) => sum + s.totalAmount, 0)

    return [
      { name: 'Paid', value: paid, color: '#10B981' },
      { name: 'Unpaid', value: unpaid, color: '#F59E0B' },
    ]
  }, [sales])

  // Expense breakdown
  const expenseBreakdownData = useMemo(() => {
    return [
      {
        category: 'Fixed',
        amount: expenses
          .filter((e) => e.category === 'fixed')
          .reduce((sum, e) => sum + e.amount, 0),
        color: '#3B82F6',
      },
      {
        category: 'Operational',
        amount: expenses
          .filter((e) => e.category === 'operational')
          .reduce((sum, e) => sum + e.amount, 0),
        color: '#8B5CF6',
      },
      {
        category: 'Variable',
        amount: expenses
          .filter((e) => e.category === 'variable')
          .reduce((sum, e) => sum + e.amount, 0),
        color: '#F59E0B',
      },
    ]
  }, [expenses])

  // Calculate totals
  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0)
  const totalPaid = sales
    .filter((s) => s.paymentStatus === 'paid')
    .reduce((sum, s) => sum + s.totalAmount, 0)
  const totalUnpaid = sales
    .filter((s) => s.paymentStatus === 'unpaid')
    .reduce((sum, s) => sum + s.totalAmount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalProfit = totalSales - totalExpenses

  const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0'

  const handleExportPDF = () => {
    console.log('Exporting to PDF...')
    alert('PDF export functionality would be implemented here')
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Financial insights and performance metrics</p>
        </div>
        <Button
          onClick={handleExportPDF}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="text-2xl font-bold mt-2">Rs {totalSales.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Paid Amount
            </p>
            <p className="text-2xl font-bold mt-2 text-green-600">Rs {totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Unpaid Amount
            </p>
            <p className="text-2xl font-bold mt-2 text-orange-600">Rs {totalUnpaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold mt-2 text-red-600">Rs {totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={totalProfit >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p className={`text-2xl font-bold mt-2 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rs {Math.abs(totalProfit).toLocaleString()}
            </p>
            <p className={`text-xs mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Trend */}
        <Card>
          <CardHeader>
            <CardTitle>7-Day Sales vs Expenses Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7DaysData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `Rs ${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#3B82F6"
                  name="Total Sales"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#EF4444"
                  name="Expenses"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444' }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  name="Profit"
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Paid vs Unpaid */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `Rs ${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `Rs ${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `Rs ${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="amount" name="Amount" radius={[8, 8, 0, 0]}>
                  {expenseBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-right p-4 font-semibold">Sales</th>
                  <th className="text-right p-4 font-semibold">Paid</th>
                  <th className="text-right p-4 font-semibold">Unpaid</th>
                  <th className="text-right p-4 font-semibold">Expenses</th>
                  <th className="text-right p-4 font-semibold">Profit/Loss</th>
                  <th className="text-right p-4 font-semibold">Margin</th>
                </tr>
              </thead>
              <tbody>
                {last7DaysData.map((row) => {
                  const margin = row.sales > 0 ? ((row.profit / row.sales) * 100).toFixed(1) : '0'
                  return (
                    <tr key={row.date} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4 font-medium">{row.date}</td>
                      <td className="p-4 text-right">Rs {row.sales.toLocaleString()}</td>
                      <td className="p-4 text-right text-green-600">Rs {row.paid.toLocaleString()}</td>
                      <td className="p-4 text-right text-orange-600">Rs {row.unpaid.toLocaleString()}</td>
                      <td className="p-4 text-right text-red-600">Rs {row.expenses.toLocaleString()}</td>
                      <td className={`p-4 text-right font-semibold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Rs {row.profit.toLocaleString()}
                      </td>
                      <td className={`p-4 text-right font-semibold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {margin}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
