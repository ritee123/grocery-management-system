'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Calendar,
  CreditCard,
  Banknote,
  CheckCircle,
  Clock,
  X,
  Filter,
  Users,
  DollarSign,
  Eye,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  createCustomer,
  createPayment,
  deleteCustomer,
  fetchBootstrapData,
  fetchCustomers,
  fetchSales,
  updateCustomer,
  updateSale,
} from '@/lib/api'
import { Customer, Sale, Payment } from '@/lib/store'
import { format } from 'date-fns'
import { CustomerDetailModal } from '@/components/customer-detail-modal'

interface FormData {
  name: string
  phone: string
  email: string
  address: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchBootstrapData()
      .then((data) => {
        if (cancelled) return
        setCustomers(data.customers)
        setSales(data.sales)
      })
      .catch((error) => {
        console.error('Failed to load customer data:', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null)
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [purchaseDateFilter, setPurchaseDateFilter] = useState<Date | undefined>(undefined)
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'partial'>('all')
  const [purchaseMethodFilter, setPurchaseMethodFilter] = useState<'all' | 'cash' | 'online'>('all')
  const [quickPaymentAmount, setQuickPaymentAmount] = useState('')
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<'cash' | 'online'>('cash')
  const [lastPaymentDeposit, setLastPaymentDeposit] = useState<{
    amount: number
    method: 'cash' | 'online'
    customerId: string
    allocations: { saleId: string; amount: number }[]
    timestamp: Date
  } | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
  })

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate total stats
  const totalStats = useMemo(() => {
    const totalCustomers = customers.length
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const totalUnpaid = sales.reduce((sum, sale) => sum + (sale.totalAmount - (sale.paidAmount || 0)), 0)
    return { totalCustomers, totalSales, totalUnpaid }
  }, [customers, sales])

  const getCustomerStats = (customerId: string, applyFilters: boolean = false) => {
    let customerSales = sales.filter((sale) => sale.customerId === customerId)
    
    const allSalesTotal = customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const allPaidAmount = customerSales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0)
    const allUnpaidAmount = allSalesTotal - allPaidAmount
    const totalOrdersCount = customerSales.length

    if (applyFilters) {
      if (purchaseDateFilter) {
        customerSales = customerSales.filter(
          (sale) => new Date(sale.date).toDateString() === purchaseDateFilter.toDateString()
        )
      }
      if (purchaseStatusFilter !== 'all') {
        if (purchaseStatusFilter === 'unpaid') {
          customerSales = customerSales.filter((sale) => sale.paymentStatus === 'unpaid' || sale.paymentStatus === 'partial')
        } else {
          customerSales = customerSales.filter((sale) => sale.paymentStatus === purchaseStatusFilter)
        }
      }
      if (purchaseMethodFilter !== 'all') {
        customerSales = customerSales.filter((sale) => sale.paymentMethod === purchaseMethodFilter)
      }
    }

    const totalSpent = customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const paidAmount = customerSales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0)
    const unpaidAmount = totalSpent - paidAmount
    const cashAmount = customerSales.filter((sale) => sale.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.totalAmount, 0)
    const onlineAmount = customerSales.filter((sale) => sale.paymentMethod === 'online').reduce((sum, sale) => sum + sale.totalAmount, 0)
    
    return {
      totalSpent,
      paidAmount,
      unpaidAmount,
      cashAmount,
      onlineAmount,
      totalOrders: customerSales.length,
      allSalesTotal,
      allUnpaidAmount,
      totalOrdersCount,
      sales: customerSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }
  }

  const handleAddCustomer = async () => {
    if (formData.name && formData.phone) {
      setSavingCustomer(true)
      try {
        if (editingId) {
          await updateCustomer(editingId, formData)
          setEditingId(null)
        } else {
          await createCustomer(formData)
        }

        const updatedCustomers = await fetchCustomers()
        setCustomers(updatedCustomers)
        setFormData({ name: '', phone: '', email: '', address: '' })
        setIsAddingCustomer(false)
      } catch (error) {
        console.error('Failed to save customer:', error)
        alert(error instanceof Error ? error.message : 'Failed to save customer')
      } finally {
        setSavingCustomer(false)
      }
    }
  }

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
    })
    setEditingId(customer.id)
    setIsAddingCustomer(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id)
        const updatedCustomers = await fetchCustomers()
        setCustomers(updatedCustomers)
      } catch (error) {
        console.error('Failed to delete customer:', error)
        alert(error instanceof Error ? error.message : 'Failed to delete customer')
      }
    }
  }

  const handleCancel = () => {
    setIsAddingCustomer(false)
    setEditingId(null)
    setFormData({ name: '', phone: '', email: '', address: '' })
  }

  const toggleCustomerExpand = (customerId: string) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null)
    } else {
      setExpandedCustomerId(customerId)
      setPurchaseDateFilter(undefined)
      setPurchaseStatusFilter('all')
      setPurchaseMethodFilter('all')
      setQuickPaymentAmount('')
      setQuickPaymentMethod('cash')
      setLastPaymentDeposit(null)
    }
  }

  const openCustomerDetail = (customer: Customer) => {
    setSelectedCustomerForDetail(customer)
    setIsDetailModalOpen(true)
  }

  const clearPurchaseFilters = () => {
    setPurchaseDateFilter(undefined)
    setPurchaseStatusFilter('all')
    setPurchaseMethodFilter('all')
  }

  const handleQuickPayment = async (customerId: string) => {
    const amount = parseFloat(quickPaymentAmount)
    if (isNaN(amount) || amount <= 0) return
    
    const customerUnpaidSales = sales
      .filter((sale) => sale.customerId === customerId && sale.paymentStatus !== 'paid')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    if (customerUnpaidSales.length === 0) return
    
    let remainingPayment = amount
    const paymentAllocations: { saleId: string; amount: number }[] = []
    
    for (const sale of customerUnpaidSales) {
      if (remainingPayment <= 0) break
      const saleDue = sale.totalAmount - (sale.paidAmount || 0)
      const paymentForThisSale = Math.min(remainingPayment, saleDue)
      if (paymentForThisSale > 0) {
        paymentAllocations.push({ saleId: sale.id, amount: paymentForThisSale })
        remainingPayment -= paymentForThisSale
      }
    }
    
    setSavingPayment(true)
    try {
      await Promise.all(
        paymentAllocations.map(async (allocation) => {
          const sale = customerUnpaidSales.find((item) => item.id === allocation.saleId)
          if (!sale) return

          const newPaidAmount = (sale.paidAmount || 0) + allocation.amount
          const newStatus: Sale['paymentStatus'] = newPaidAmount >= sale.totalAmount ? 'paid' : 'partial'

          await createPayment({
            sale: sale.id,
            amount: allocation.amount,
            method: quickPaymentMethod,
            date: new Date().toISOString(),
          })

          await updateSale(sale.id, {
            paid_amount: newPaidAmount,
            payment_status: newStatus,
          })
        })
      )

      const updatedSales = await fetchSales()
      setSales(updatedSales)
      setLastPaymentDeposit({
        amount,
        method: quickPaymentMethod,
        customerId,
        allocations: paymentAllocations,
        timestamp: new Date(),
      })
      setQuickPaymentAmount('')
    } catch (error) {
      console.error('Failed to record payment:', error)
      alert(error instanceof Error ? error.message : 'Failed to record payment')
    } finally {
      setSavingPayment(false)
    }
  }

  return (
    <>
      <CustomerDetailModal
        customer={selectedCustomerForDetail}
        sales={sales}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage your customer database</p>
        </div>
        <Button onClick={() => setIsAddingCustomer(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{totalStats.totalCustomers}</p>
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
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">Rs {totalStats.totalSales.toLocaleString()}</p>
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
                <p className="text-xs text-muted-foreground">Total Unpaid</p>
                <p className="text-2xl font-bold text-orange-600">Rs {totalStats.totalUnpaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isAddingCustomer}
        onOpenChange={(open) => {
          if (!open) handleCancel()
          else setIsAddingCustomer(true)
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? '✏️ Edit Customer' : '👤 Add New Customer'}
            </DialogTitle>
            <DialogDescription>
              Enter customer details. Name and phone are required.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                  className="mt-2 bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="03001234567"
                  className="mt-2 bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@email.com"
                  type="email"
                  className="mt-2 bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, Country"
                  className="mt-2 bg-white"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddCustomer}
              disabled={savingCustomer || !formData.name || !formData.phone}
            >
              {savingCustomer ? 'Saving...' : editingId ? 'Update Customer' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers..."
              className="pl-10 bg-muted/50 border-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <div className="grid gap-4">
        {filteredCustomers.map((customer) => {
          const basicStats = getCustomerStats(customer.id, false)
          const filteredStats = getCustomerStats(customer.id, true)
          const isExpanded = expandedCustomerId === customer.id
          return (
            <Card key={customer.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-slate-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {customer.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">{customer.name}</h3>
                        <p className="text-xs text-muted-foreground">Member since {format(customer.createdAt, 'MMM yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{customer.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4" />
                        <span>{basicStats.totalOrdersCount} sales</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                      <p className="text-xl font-bold text-green-600">Rs {basicStats.allSalesTotal.toLocaleString()}</p>
                    </div>
                    {basicStats.allUnpaidAmount > 0 && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                        Rs {basicStats.allUnpaidAmount.toLocaleString()} Pending
                      </Badge>
                    )}
                    <div className="flex gap-1.5 mt-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openCustomerDetail(customer)} 
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Purchase History */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 items-center bg-muted/30 p-4 rounded-lg">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter:
                      </span>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Calendar className="w-4 h-4" />
                            {purchaseDateFilter ? format(purchaseDateFilter, 'dd MMM yyyy') : 'Date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={purchaseDateFilter} onSelect={setPurchaseDateFilter} initialFocus />
                        </PopoverContent>
                      </Popover>

                      <Select value={purchaseStatusFilter} onValueChange={(value) => setPurchaseStatusFilter(value as 'all' | 'paid' | 'unpaid')}>
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={purchaseMethodFilter} onValueChange={(value) => setPurchaseMethodFilter(value as 'all' | 'cash' | 'online')}>
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Methods</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                        </SelectContent>
                      </Select>

                      {(purchaseDateFilter || purchaseStatusFilter !== 'all' || purchaseMethodFilter !== 'all') && (
                        <Button variant="ghost" size="sm" onClick={clearPurchaseFilters} className="text-muted-foreground">
                          <X className="w-4 h-4 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>

                    {/* Quick Payment */}
                    {basicStats.allUnpaidAmount > 0 && (
                      <div className="flex flex-wrap gap-3 items-center bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Record Payment:</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Rs</span>
                          <Input
                            type="number"
                            value={quickPaymentAmount}
                            onChange={(e) => setQuickPaymentAmount(e.target.value)}
                            placeholder="Amount"
                            className="w-28 h-8 bg-white"
                          />
                        </div>

                        <Select value={quickPaymentMethod} onValueChange={(value) => setQuickPaymentMethod(value as 'cash' | 'online')}>
                          <SelectTrigger className="w-24 h-8 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleQuickPayment(customer.id)
                          }}
                          disabled={savingPayment || !quickPaymentAmount || parseFloat(quickPaymentAmount) <= 0}
                          className="bg-green-600 hover:bg-green-700 text-white h-8"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {savingPayment ? 'Saving...' : 'Add'}
                        </Button>

                        <div className="ml-auto text-right">
                          <p className="text-xs text-muted-foreground">Outstanding</p>
                          <p className="text-lg font-bold text-orange-600">Rs {basicStats.allUnpaidAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    {/* Payment Confirmation */}
                    {lastPaymentDeposit && lastPaymentDeposit.customerId === customer.id && (
                      <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-green-800">Payment Deposited</h4>
                              <p className="text-sm text-green-600">{format(lastPaymentDeposit.timestamp, 'dd MMM yyyy, hh:mm a')}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setLastPaymentDeposit(null)} className="text-green-700">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="bg-white rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Amount</span>
                            <span className="font-bold text-green-600">Rs {lastPaymentDeposit.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Method</span>
                            <span className="flex items-center gap-1 font-medium">
                              {lastPaymentDeposit.method === 'cash' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                              {lastPaymentDeposit.method === 'cash' ? 'Cash' : 'Online'}
                            </span>
                          </div>
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Applied to:</p>
                            {lastPaymentDeposit.allocations.map((a, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span>Sale #{a.saleId}</span>
                                <span className="text-green-600">Rs {a.amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Sales</p>
                        <p className="text-lg font-bold">{filteredStats.totalOrders}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600">Paid</p>
                        <p className="text-lg font-bold text-green-600">Rs {filteredStats.paidAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-xs text-orange-600">Unpaid</p>
                        <p className="text-lg font-bold text-orange-600">Rs {filteredStats.unpaidAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="text-xs text-emerald-600">Cash</p>
                        <p className="text-lg font-bold text-emerald-600">Rs {filteredStats.cashAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600">Online</p>
                        <p className="text-lg font-bold text-blue-600">Rs {filteredStats.onlineAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Purchase History */}
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Purchase History
                        {(purchaseDateFilter || purchaseStatusFilter !== 'all' || purchaseMethodFilter !== 'all') && (
                          <Badge variant="secondary" className="ml-2">Filtered</Badge>
                        )}
                      </h4>
                      {filteredStats.sales.length > 0 ? (
                        <div className="space-y-3">
                          {filteredStats.sales.map((sale) => (
                            <div key={sale.id} className="bg-muted/30 rounded-lg p-4 border">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">{format(new Date(sale.date), 'dd MMM yyyy, hh:mm a')}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">Sale #{sale.id}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold">Rs {sale.totalAmount.toLocaleString()}</p>
                                  {sale.paymentStatus !== 'paid' && (
                                    <p className="text-xs text-orange-600">Due: Rs {(sale.totalAmount - (sale.paidAmount || 0)).toLocaleString()}</p>
                                  )}
                                  <div className="flex gap-2 mt-2 justify-end">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sale.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {sale.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : sale.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
                                      {sale.paymentStatus === 'paid' ? 'Paid' : sale.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded p-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Items:</p>
                                <div className="space-y-1">
                                  {sale.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span>{item.productName} x {item.quantity}</span>
                                      <span className="font-medium">Rs {item.subtotal.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {sale.payments && sale.payments.length > 0 && (
                                <div className="bg-green-50 rounded p-3 mt-2">
                                  <p className="text-xs font-semibold text-green-700 mb-1">Payments:</p>
                                  <div className="space-y-1">
                                    {sale.payments.map((payment, idx) => (
                                      <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{format(new Date(payment.date), 'dd MMM yyyy')} - {payment.method}</span>
                                        <span className="font-medium text-green-600">+ Rs {payment.amount.toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No purchases yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No customers found. Add one to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  )
}
