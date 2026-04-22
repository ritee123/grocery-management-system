'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Trash2,
  Calendar,
  X,
  ShoppingCart,
  DollarSign,
  Clock,
  CreditCard,
  Banknote,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { createPayment, createSale, createSaleItem, deleteSale, fetchBootstrapData, fetchSales } from '@/lib/api'
import { Sale, SaleItem, Product, Customer } from '@/lib/store'
import { CreateSaleModal } from '@/components/create-sale-modal'

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'all' | 'cash' | 'online'>('all')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchBootstrapData()
      .then((data) => {
        if (cancelled) return
        setSales(data.sales)
        setCustomers(data.customers)
        setProducts(data.products)
      })
      .catch((error) => {
        console.error('Failed to load sales data:', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesSearch =
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.includes(searchTerm)
      const matchesStatus =
        filterStatus === 'all' || 
        sale.paymentStatus === filterStatus ||
        (filterStatus === 'unpaid' && sale.paymentStatus === 'partial')
      const matchesPaymentMethod =
        filterPaymentMethod === 'all' || sale.paymentMethod === filterPaymentMethod
      const matchesDate = !selectedDate || (
        new Date(sale.date).toDateString() === selectedDate.toDateString()
      )
      return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDate
    })
  }, [sales, searchTerm, filterStatus, filterPaymentMethod, selectedDate])

  const filteredTotals = useMemo(() => {
    const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const paidAmount = filteredSales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0)
    const unpaidAmount = totalAmount - paidAmount
    const cashAmount = filteredSales
      .filter((sale) => sale.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + sale.totalAmount, 0)
    const onlineAmount = filteredSales
      .filter((sale) => sale.paymentMethod === 'online')
      .reduce((sum, sale) => sum + sale.totalAmount, 0)
    return { totalAmount, paidAmount, unpaidAmount, cashAmount, onlineAmount }
  }, [filteredSales])

  const weeklyRevenueData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      const key = date.toDateString()
      return {
        key,
        label: format(date, 'dd MMM'),
        cash: 0,
        online: 0,
        unpaid: 0,
      }
    })

    const revenueMap = new Map(days.map((day) => [day.key, { ...day }]))

    sales.forEach((sale) => {
      const saleDate = new Date(sale.date)
      const key = saleDate.toDateString()
      const entry = revenueMap.get(key)
      if (!entry) return

      const amount = sale.totalAmount || 0
      if (sale.paymentStatus === 'paid') {
        if (sale.paymentMethod === 'cash') {
          entry.cash += amount
        } else {
          entry.online += amount
        }
      } else {
        entry.unpaid += amount
      }
    })

    return Array.from(revenueMap.values())
  }, [sales])

  const handleCreateSale = async (saleData: any) => {
    const total = Number(saleData.total) || 0
    const paidAmount = saleData.paymentStatus === 'paid' ? total : 0

    const createdSale = await createSale({
      customer: saleData.customerId,
      customer_name: saleData.customerName,
      total_amount: total,
      paid_amount: paidAmount,
      payment_method: saleData.paymentMethod as 'cash' | 'online',
      payment_status: saleData.paymentStatus as 'paid' | 'unpaid' | 'partial',
      date: saleData.date.toISOString(),
    })

    await Promise.all(
      (saleData.items || []).map((item: any) =>
        createSaleItem({
          sale: createdSale.id,
          product: null,
          product_name: item.name,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.price) || 0,
          subtotal: Number(item.total) || 0,
        })
      )
    )

    if (paidAmount > 0) {
      await createPayment({
        sale: createdSale.id,
        amount: paidAmount,
        method: saleData.paymentMethod as 'cash' | 'online',
        date: new Date().toISOString(),
      })
    }

    const updatedSales = await fetchSales()
    setSales(updatedSales)
    setIsCreateModalOpen(false)
  }

  const handleDeleteSale = async (id: string) => {
    if (confirm('Are you sure you want to delete this sale?')) {
      try {
        await deleteSale(id)
        const updatedSales = await fetchSales()
        setSales(updatedSales)
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete sale')
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales</h1>
          <p className="text-sm text-muted-foreground">Manage sales and track payments</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Sale
        </Button>
      </div>

      <CreateSaleModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        customers={customers}
        products={products}
        onCreateSale={handleCreateSale}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="text-lg font-bold">{filteredSales.length.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold">Rs {filteredTotals.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-lg font-bold text-green-600">Rs {filteredTotals.paidAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unpaid</p>
                <p className="text-lg font-bold text-orange-600">Rs {filteredTotals.unpaidAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cash</p>
                <p className="text-lg font-bold">Rs {filteredTotals.cashAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Online</p>
                <p className="text-lg font-bold">Rs {filteredTotals.onlineAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Sale Form */}
      {/* This is now handled by CreateSaleModal component above */}

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-lg font-semibold">Weekly Revenue Breakdown</h3>
              <p className="text-sm text-muted-foreground">Daily revenue by payment method over the last 7 days</p>
            </div>

            <div className="w-full h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    stroke="var(--muted-foreground)"
                    style={{ fontSize: '12px' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    style={{ fontSize: '12px' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `Rs ${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value, name) => [`Rs ${value.toLocaleString()}`, name]}
                    labelStyle={{ color: 'var(--foreground)', fontWeight: '600' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={36}
                    wrapperStyle={{ paddingBottom: '10px' }}
                    iconType="rect"
                  />
                  <Bar
                    dataKey="cash"
                    name="Cash"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                  <Bar
                    dataKey="online"
                    name="Online"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                  <Bar
                    dataKey="unpaid"
                    name="Unpaid"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Cash</p>
                  <p className="text-xs text-emerald-600">Direct payments</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Online</p>
                  <p className="text-xs text-blue-600">Digital payments</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="w-4 h-4 rounded bg-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Unpaid</p>
                  <p className="text-xs text-amber-600">Outstanding amounts</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sales..."
                className="pl-10 bg-muted/50 border-0"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}>
                <X className="w-4 h-4" />
              </Button>
            )}

            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'paid' | 'unpaid')}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPaymentMethod} onValueChange={(value) => setFilterPaymentMethod(value as 'all' | 'cash' | 'online')}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sale ID</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Method</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-sm">#{sale.id}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{sale.customerName}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(sale.date), 'dd MMM yyyy')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold">Rs {sale.totalAmount.toLocaleString()}</span>
                      {sale.paymentStatus !== 'paid' && (
                        <p className="text-xs text-orange-600">
                          Due: Rs {(sale.totalAmount - (sale.paidAmount || 0)).toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        sale.paymentMethod === 'cash'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {sale.paymentMethod === 'cash' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                        {sale.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sale.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : sale.paymentStatus === 'partial'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {sale.paymentStatus === 'paid' ? 'Paid' : sale.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredSales.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No sales found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
