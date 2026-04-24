'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit, Phone, Mail, MapPin, Calendar, DollarSign, Trash2 } from 'lucide-react'
import { Customer, Sale } from '@/lib/store'
import { format } from 'date-fns'
import { fetchUnpaidAmounts, createUnpaidAmount, deleteUnpaidAmount } from '@/lib/api'
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
                    </tr>
                  </thead>
                  <tbody>
                    {customerSales.slice(0, 5).map((sale) => (
                      <tr key={sale.id} className="border-b last:border-b-0">
                        <td className="p-2 pr-3 font-medium">{format(new Date(sale.date), 'dd MMM yyyy')}</td>
                        <td className="p-2 pr-3 text-right">Rs {sale.totalAmount.toLocaleString()}</td>
                        <td className="p-2 pr-3 text-right">
                          {sale.paidAmount > 0 ? (
                            <span className="text-green-600">Paid</span>
                          ) : (
                            <span className="text-orange-600">Unpaid</span>
                          )}
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
