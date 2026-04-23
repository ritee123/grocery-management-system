'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit, Phone, Mail, MapPin, Calendar, DollarSign, Trash2 } from 'lucide-react'
import { Customer, Sale } from '@/lib/store'
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EditCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  customerSales: Sale[]
  onUpdateCustomer: (customerData: any) => Promise<void>
  onRecordPayment: (customerId: string, amount: number, method: 'cash' | 'online') => Promise<void>
  onUpdatePaymentRecord: (
    paymentId: string,
    saleId: string,
    payload: { amount: number; method: 'cash' | 'online'; date: string }
  ) => Promise<void>
  onDeletePaymentRecord: (paymentId: string, saleId: string) => Promise<void>
  savingPayment?: boolean
}

export function EditCustomerModal({
  open,
  onOpenChange,
  customer,
  customerSales,
  onUpdateCustomer,
  onRecordPayment,
  onUpdatePaymentRecord,
  onDeletePaymentRecord,
  savingPayment = false,
}: EditCustomerModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editingAmount, setEditingAmount] = useState('')
  const [editingMethod, setEditingMethod] = useState<'cash' | 'online'>('cash')
  const [editingDate, setEditingDate] = useState('')
  
  // Previous month due payment state
  const [previousDueAmount, setPreviousDueAmount] = useState('')
  const [previousDueMethod, setPreviousDueMethod] = useState<'cash' | 'online'>('cash')
  const [previousDueMonth, setPreviousDueMonth] = useState('')
  const [previousDueNotes, setPreviousDueNotes] = useState('')
  
  // Unpaid amounts tracking state
  const [unpaidAmounts, setUnpaidAmounts] = useState<Array<{
    month: string
    amount: number
    notes: string
    recordedDate: string
  }>>([])
  const [newUnpaidMonth, setNewUnpaidMonth] = useState('')
  const [newUnpaidAmount, setNewUnpaidAmount] = useState('')
  const [newUnpaidNotes, setNewUnpaidNotes] = useState('')
  
  // Login credentials state
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [hasLoginCredentials, setHasLoginCredentials] = useState(false)

  useEffect(() => {
    if (customer) {
      setName(customer.name)
      setPhone(customer.phone)
      setEmail(customer.email)
      setAddress(customer.address)
      
      // Check if customer has login credentials
      setHasLoginCredentials(!!customer.username)
      setLoginUsername(customer.username || '')
      setLoginPassword('') // Don't pre-fill password for security
    }
  }, [customer])

  const calculateStats = () => {
    const sales = customerSales || []
    const totalSales = sales.length
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const paidAmount = sales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0)
    const unpaidAmount = totalAmount - paidAmount
    const lastSale = sales.length > 0 ? sales[0] : null

    return {
      totalSales,
      totalAmount,
      paidAmount,
      unpaidAmount,
      lastSale,
    }
  }

  const handleSave = async () => {
    if (!customer) return

    setSaving(true)
    try {
      await onUpdateCustomer({
        name,
        phone,
        email,
        address,
      })
      handleClose()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setName('')
    setPhone('')
    setEmail('')
    setAddress('')
    onOpenChange(false)
  }

  const stats = calculateStats()
  const hasOutstanding = stats.unpaidAmount > 0
  const enteredAmount = useMemo(() => Number(paymentAmount), [paymentAmount])
  const paymentTransactions = useMemo(
    () =>
      customerSales.flatMap((sale) =>
        (sale.payments || []).map((payment) => ({
          ...payment,
          saleId: sale.id,
        }))
      ),
    [customerSales]
  )
  const sortedPaymentTransactions = useMemo(
    () => [...paymentTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [paymentTransactions]
  )
  const monthlyDueSummary = useMemo(() => {
    const monthMap = new Map<string, { monthKey: string; monthLabel: string; monthSales: number; monthPaid: number }>()

    customerSales.forEach((sale) => {
      const saleDate = new Date(sale.date)
      const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = format(saleDate, 'MMM yyyy')
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { monthKey, monthLabel, monthSales: 0, monthPaid: 0 })
      }
      const bucket = monthMap.get(monthKey)!
      bucket.monthSales += sale.totalAmount
      bucket.monthPaid += (sale.payments || []).reduce((sum, payment) => sum + payment.amount, 0)
    })

    const monthlyRows = Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    let carryForwardDue = 0
    return monthlyRows.map((row) => {
      const openingDue = carryForwardDue
      const closingDue = Math.max(0, openingDue + row.monthSales - row.monthPaid)
      carryForwardDue = closingDue
      return { ...row, openingDue, closingDue }
    })
  }, [customerSales])

  const handleSubmitPayment = async () => {
    if (!customer) return
    const amount = Number(paymentAmount)
    if (!Number.isFinite(amount) || amount <= 0) return
    await onRecordPayment(customer.id, amount, paymentMethod)
    setPaymentAmount('')
  }

  const handlePreviousDuePayment = async () => {
    if (!customer) return
    const amount = Number(previousDueAmount)
    if (!Number.isFinite(amount) || amount <= 0 || !previousDueMonth) {
      alert('Please enter valid amount and select month')
      return
    }
    
    try {
      // Create a payment record for previous month due
      await onRecordPayment(customer.id, amount, previousDueMethod)
      
      // Show success message with details
      alert(`Previous due payment recorded successfully!\n\nAmount: Rs ${amount}\nMonth: ${previousDueMonth}\nMethod: ${previousDueMethod}\n${previousDueNotes ? `Notes: ${previousDueNotes}` : ''}`)
      
      // Reset form
      setPreviousDueAmount('')
      setPreviousDueMethod('cash')
      setPreviousDueMonth('')
      setPreviousDueNotes('')
    } catch (error) {
      alert('Failed to record previous due payment. Please try again.')
    }
  }

  const handleAddUnpaidAmount = () => {
    const amount = Number(newUnpaidAmount)
    if (!Number.isFinite(amount) || amount <= 0 || !newUnpaidMonth) {
      alert('Please enter valid amount and select month')
      return
    }
    
    const newUnpaid = {
      month: newUnpaidMonth,
      amount: amount,
      notes: newUnpaidNotes,
      recordedDate: new Date().toISOString()
    }
    
    setUnpaidAmounts([...unpaidAmounts, newUnpaid])
    
    // Reset form
    setNewUnpaidMonth('')
    setNewUnpaidAmount('')
    setNewUnpaidNotes('')
    
    alert(`Unpaid amount recorded for ${newUnpaidMonth}: Rs ${amount}`)
  }

  const handleRemoveUnpaidAmount = (index: number) => {
    const unpaidToRemove = unpaidAmounts[index]
    setUnpaidAmounts(unpaidAmounts.filter((_, i) => i !== index))
    alert(`Removed unpaid amount for ${unpaidToRemove.month}: Rs ${unpaidToRemove.amount}`)
  }

  const getTotalUnpaidAmount = () => {
    return unpaidAmounts.reduce((sum, unpaid) => sum + unpaid.amount, 0)
  }

  const handleUpdateLoginCredentials = async () => {
    if (!customer) return
    
    if (!loginUsername || !loginPassword) {
      alert('Please enter both username and password')
      return
    }
    
    try {
      await onUpdateCustomer({
        name,
        phone,
        email,
        address,
        username: loginUsername,
        password: loginPassword
      })
      
      setHasLoginCredentials(true)
      alert('Login credentials updated successfully!')
    } catch (error) {
      alert('Failed to update login credentials: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleRemoveLoginCredentials = async () => {
    if (!customer) return
    
    if (!confirm('Are you sure you want to remove login credentials for this customer? They will no longer be able to access the portal.')) {
      return
    }
    
    try {
      await onUpdateCustomer({
        name,
        phone,
        email,
        address,
        username: null
      })
      
      setHasLoginCredentials(false)
      setLoginUsername('')
      setLoginPassword('')
      alert('Login credentials removed successfully!')
    } catch (error) {
      alert('Failed to remove login credentials: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const startEditPayment = (payment: (typeof sortedPaymentTransactions)[number]) => {
    setEditingPaymentId(payment.id)
    setEditingAmount(String(payment.amount))
    setEditingMethod(payment.method)
    setEditingDate(new Date(payment.date).toISOString().slice(0, 10))
  }

  const cancelEditPayment = () => {
    setEditingPaymentId(null)
    setEditingAmount('')
    setEditingMethod('cash')
    setEditingDate('')
  }

  const savePaymentEdit = async (saleId: string) => {
    if (!editingPaymentId) return
    const amount = Number(editingAmount)
    if (!Number.isFinite(amount) || amount <= 0 || !editingDate) return
    await onUpdatePaymentRecord(editingPaymentId, saleId, {
      amount,
      method: editingMethod,
      date: new Date(editingDate).toISOString(),
    })
    cancelEditPayment()
  }

  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <div className="px-6 pt-6 pb-2 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Customer
            </DialogTitle>
            <DialogDescription>
              Edit customer information and view sales history.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-6 overflow-y-auto min-h-0">
          {/* Customer Information */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-base mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter customer name"
                  className="bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03001234567"
                  className="bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Country"
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Login Credentials Section */}
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-base text-purple-800">Customer Login Credentials</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-purple-700">Manage customer portal access</p>
              <div className={`text-xs px-2 py-1 rounded ${
                hasLoginCredentials 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {hasLoginCredentials ? 'Portal Enabled' : 'No Portal Access'}
              </div>
            </div>

            {hasLoginCredentials ? (
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-800">Current Username:</p>
                    <p className="text-lg font-bold text-purple-900">{loginUsername}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLoginCredentials}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                  >
                    Remove Access
                  </Button>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs text-purple-600 mb-2">Update credentials:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">New Username</label>
                      <Input
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="Enter new username"
                        className="bg-white border-purple-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">New Password</label>
                      <Input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="bg-white border-purple-300"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button
                      onClick={handleUpdateLoginCredentials}
                      disabled={!loginUsername || !loginPassword}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Update Credentials
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">This customer does not have portal access yet.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">Username</label>
                    <Input
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Enter username for login"
                      className="bg-white border-purple-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">Password</label>
                    <Input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password for login"
                      className="bg-white border-purple-300"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button
                    onClick={handleUpdateLoginCredentials}
                    disabled={!loginUsername || !loginPassword}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Enable Portal Access
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Customer Statistics */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-base mb-4">Sales Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalSales}</div>
                <div className="text-xs text-muted-foreground">Total Orders</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">Rs {stats.totalAmount.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Sales</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">Rs {stats.unpaidAmount.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Unpaid Amount</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-sm font-semibold text-gray-600">
                  {stats.lastSale ? format(new Date(stats.lastSale.date), 'dd MMM yyyy') : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Last Purchase</div>
              </div>
            </div>
          </div>

          {/* Current Due Payment Section */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-base text-blue-800">Current Due Payment</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700">Outstanding amount for current purchases</p>
              <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                Current dues
              </div>
            </div>

            {hasOutstanding ? (
              <>
                <div className="flex items-center justify-between bg-white rounded-lg p-3">
                  <p className="text-sm text-blue-700">Total Outstanding:</p>
                  <p className="text-lg font-bold text-blue-800">Rs {stats.unpaidAmount.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Amount (Rs)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter paid amount"
                      className="bg-white border-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Payment Method</label>
                    <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cash' | 'online')}>
                      <SelectTrigger className="bg-white border-blue-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="lg:col-span-2 flex items-end">
                    <Button
                      onClick={handleSubmitPayment}
                      disabled={savingPayment || !Number.isFinite(enteredAmount) || enteredAmount <= 0}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {savingPayment ? 'Recording...' : 'Record Current Payment'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-700 font-medium">
                  ✅ All current dues are cleared for this customer.
                </p>
              </div>
            )}
          </div>

          {/* Previous Month Due Payment Section */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-base text-amber-800">Previous Month Due Payment</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-700">Record payments for previous month outstanding amounts</p>
              <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                For old dues
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">Amount (Rs)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={previousDueAmount}
                  onChange={(e) => setPreviousDueAmount(e.target.value)}
                  placeholder="Enter due amount"
                  className="bg-white border-amber-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">Month</label>
                <Select value={previousDueMonth} onValueChange={setPreviousDueMonth}>
                  <SelectTrigger className="bg-white border-amber-300">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-03">March 2025</SelectItem>
                    <SelectItem value="2025-02">February 2025</SelectItem>
                    <SelectItem value="2025-01">January 2025</SelectItem>
                    <SelectItem value="2024-12">December 2024</SelectItem>
                    <SelectItem value="2024-11">November 2024</SelectItem>
                    <SelectItem value="2024-10">October 2024</SelectItem>
                    <SelectItem value="2024-09">September 2024</SelectItem>
                    <SelectItem value="2024-08">August 2024</SelectItem>
                    <SelectItem value="2024-07">July 2024</SelectItem>
                    <SelectItem value="2024-06">June 2024</SelectItem>
                    <SelectItem value="2024-05">May 2024</SelectItem>
                    <SelectItem value="2024-04">April 2024</SelectItem>
                    <SelectItem value="2024-03">March 2024</SelectItem>
                    <SelectItem value="2024-02">February 2024</SelectItem>
                    <SelectItem value="2024-01">January 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">Payment Method</label>
                <Select value={previousDueMethod} onValueChange={(value) => setPreviousDueMethod(value as 'cash' | 'online')}>
                  <SelectTrigger className="bg-white border-amber-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handlePreviousDuePayment}
                  disabled={savingPayment || !previousDueAmount || !previousDueMonth}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {savingPayment ? 'Recording...' : 'Record Previous Due'}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-amber-700 mb-1">Notes (Optional)</label>
              <Input
                type="text"
                value={previousDueNotes}
                onChange={(e) => setPreviousDueNotes(e.target.value)}
                placeholder="Add notes about this previous due payment..."
                className="bg-white border-amber-300"
              />
            </div>
          </div>

          {/* Unpaid Amounts Tracking Section */}
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-base text-red-800">Unpaid Amounts Tracking</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700">Track unpaid amounts from previous months</p>
              <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                Outstanding dues
              </div>
            </div>

            {/* Total Unpaid Summary */}
            <div className="flex items-center justify-between bg-white rounded-lg p-3">
              <p className="text-sm text-red-700 font-medium">Total Tracked Unpaid:</p>
              <p className="text-lg font-bold text-red-800">Rs {getTotalUnpaidAmount().toLocaleString()}</p>
            </div>

            {/* Add New Unpaid Amount */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-red-800">Add New Unpaid Amount</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-red-700 mb-1">Month</label>
                  <Select value={newUnpaidMonth} onValueChange={setNewUnpaidMonth}>
                    <SelectTrigger className="bg-white border-red-300">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025-03">March 2025</SelectItem>
                      <SelectItem value="2025-02">February 2025</SelectItem>
                      <SelectItem value="2025-01">January 2025</SelectItem>
                      <SelectItem value="2024-12">December 2024</SelectItem>
                      <SelectItem value="2024-11">November 2024</SelectItem>
                      <SelectItem value="2024-10">October 2024</SelectItem>
                      <SelectItem value="2024-09">September 2024</SelectItem>
                      <SelectItem value="2024-08">August 2024</SelectItem>
                      <SelectItem value="2024-07">July 2024</SelectItem>
                      <SelectItem value="2024-06">June 2024</SelectItem>
                      <SelectItem value="2024-05">May 2024</SelectItem>
                      <SelectItem value="2024-04">April 2024</SelectItem>
                      <SelectItem value="2024-03">March 2024</SelectItem>
                      <SelectItem value="2024-02">February 2024</SelectItem>
                      <SelectItem value="2024-01">January 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-red-700 mb-1">Amount (Rs)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newUnpaidAmount}
                    onChange={(e) => setNewUnpaidAmount(e.target.value)}
                    placeholder="Enter unpaid amount"
                    className="bg-white border-red-300"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-red-700 mb-1">Notes (Optional)</label>
                  <Input
                    type="text"
                    value={newUnpaidNotes}
                    onChange={(e) => setNewUnpaidNotes(e.target.value)}
                    placeholder="Add notes about this unpaid amount..."
                    className="bg-white border-red-300"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleAddUnpaidAmount}
                  disabled={!newUnpaidAmount || !newUnpaidMonth}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Add Unpaid Amount
                </Button>
              </div>
            </div>

            {/* Unpaid Amounts List */}
            {unpaidAmounts.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-3">Tracked Unpaid Amounts</h4>
                <div className="space-y-2">
                  {unpaidAmounts.map((unpaid, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-red-800">{unpaid.month}</span>
                          <span className="text-sm font-bold text-red-900">Rs {unpaid.amount.toLocaleString()}</span>
                        </div>
                        {unpaid.notes && (
                          <p className="text-xs text-red-600 mt-1">{unpaid.notes}</p>
                        )}
                        <p className="text-xs text-red-500 mt-1">
                          Recorded: {format(new Date(unpaid.recordedDate), 'dd MMM yyyy, HH:mm')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveUnpaidAmount(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 border-red-300"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unpaidAmounts.length === 0 && (
              <div className="bg-white rounded-lg p-6 text-center">
                <p className="text-sm text-red-600">No unpaid amounts tracked yet.</p>
                <p className="text-xs text-red-500 mt-1">Add unpaid amounts from previous months to track them here.</p>
              </div>
            )}
          </div>

          {/* Due Ledger Section */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-base mb-4">Due Ledger by Month</h3>
            {monthlyDueSummary.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white rounded-lg">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-2 pr-3">Month</th>
                      <th className="p-2 pr-3 text-right">Opening Due</th>
                      <th className="p-2 pr-3 text-right">New Sales</th>
                      <th className="p-2 pr-3 text-right">Payments</th>
                      <th className="p-2 text-right">Closing Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyDueSummary.map((row) => (
                      <tr key={row.monthKey} className="border-b last:border-b-0">
                        <td className="p-2 pr-3 font-medium">{row.monthLabel}</td>
                        <td className="p-2 pr-3 text-right">Rs {row.openingDue.toLocaleString()}</td>
                        <td className="p-2 pr-3 text-right">Rs {row.monthSales.toLocaleString()}</td>
                        <td className="p-2 pr-3 text-right">Rs {row.monthPaid.toLocaleString()}</td>
                        <td className="p-2 text-right font-semibold text-orange-600">Rs {row.closingDue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No monthly due records yet.</p>
            )}
          </div>

          {/* Payment Transactions Section */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-base">Payment Transactions</h3>
            {sortedPaymentTransactions.length > 0 ? (
              sortedPaymentTransactions.map((payment) => {
                const isEditing = editingPaymentId === payment.id
                return (
                  <div key={payment.id} className="border rounded-md bg-white p-3">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground">Sale</p>
                        <p className="text-sm font-medium">#{payment.saleId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingAmount}
                            onChange={(e) => setEditingAmount(e.target.value)}
                            className="h-9"
                          />
                        ) : (
                          <p className="text-sm font-semibold text-green-700">Rs {payment.amount.toLocaleString()}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Method</p>
                        {isEditing ? (
                          <Select value={editingMethod} onValueChange={(value) => setEditingMethod(value as 'cash' | 'online')}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="online">Online</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm">{payment.method}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        {isEditing ? (
                          <Input type="date" value={editingDate} onChange={(e) => setEditingDate(e.target.value)} className="h-9" />
                        ) : (
                          <p className="text-sm">{format(new Date(payment.date), 'dd MMM yyyy')}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button size="sm" onClick={() => savePaymentEdit(payment.saleId)} disabled={savingPayment}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditPayment}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => startEditPayment(payment)}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => onDeletePaymentRecord(payment.id, payment.saleId)}
                              disabled={savingPayment}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">No payment transactions yet.</p>
            )}
          </div>

          {/* Recent Sales */}
          {customerSales && customerSales.length > 0 && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-base mb-4">Recent Sales (Last 5)</h3>
              <div className="border rounded-lg overflow-hidden bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 border-b">
                      <th className="text-left p-3 text-sm font-medium">Date</th>
                      <th className="text-left p-3 text-sm font-medium">Amount</th>
                      <th className="text-center p-3 text-sm font-medium">Status</th>
                      <th className="text-center p-3 text-sm font-medium">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerSales.slice(0, 5).map((sale) => (
                      <tr key={sale.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-sm">
                          {format(new Date(sale.date), 'dd MMM yyyy')}
                        </td>
                        <td className="p-3 text-sm font-semibold">
                          Rs {sale.totalAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
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
                        <td className="p-3 text-center text-sm">
                          {sale.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name}>
            {saving ? 'Updating...' : 'Update Customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
