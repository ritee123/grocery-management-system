'use client'

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Customer, Sale } from '@/lib/store'
import {
  Phone,
  Mail,
  MapPin,
  X,
  Edit,
  Trash2,
  ShoppingBag,
  Calendar,
  DollarSign,
  Banknote,
  CreditCard,
  User,
} from 'lucide-react'
import { format } from 'date-fns'
import { useMemo, useState } from 'react'

interface CustomerDetailModalProps {
  customer: Customer | null
  sales: Sale[]
  isOpen: boolean
  onClose: () => void
  onEditCustomer: (customer: Customer) => void
  onRecordPayment: (customerId: string, amount: number, method: 'cash' | 'online') => Promise<void>
  onUpdatePaymentRecord: (
    paymentId: string,
    saleId: string,
    payload: { amount: number; method: 'cash' | 'online'; date: string }
  ) => Promise<void>
  onDeletePaymentRecord: (paymentId: string, saleId: string) => Promise<void>
  savingPayment?: boolean
}

export function CustomerDetailModal({
  customer,
  sales,
  isOpen,
  onClose,
  onEditCustomer,
  onRecordPayment,
  onUpdatePaymentRecord,
  onDeletePaymentRecord,
  savingPayment = false,
}: CustomerDetailModalProps) {
  if (!customer) return null

  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editingAmount, setEditingAmount] = useState('')
  const [editingMethod, setEditingMethod] = useState<'cash' | 'online'>('cash')
  const [editingDate, setEditingDate] = useState('')
  const customerSales = sales.filter((sale) => sale.customerId === customer.id)
  const totalSpent = customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalPaid = customerSales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0)
  const totalUnpaid = totalSpent - totalPaid
  const totalOrders = customerSales.length
  const hasOutstanding = totalUnpaid > 0
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
    const amount = Number(paymentAmount)
    if (!Number.isFinite(amount) || amount <= 0) return
    await onRecordPayment(customer.id, amount, paymentMethod)
    setPaymentAmount('')
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(95vw,56rem)] max-w-5xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 rounded-xl"
      >
        <DialogTitle className="sr-only">Customer Details - {customer.name}</DialogTitle>
        <DialogDescription className="sr-only">
          View complete information about {customer.name} including contact details, purchase history, and spending summary.
        </DialogDescription>

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-5 pr-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold truncate">{customer.name}</h2>
              <p className="text-emerald-50 text-sm">Member since {format(customer.createdAt, 'MMM yyyy')}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 flex-shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6 space-y-6 overflow-y-auto min-h-0 overflow-x-hidden">
          {/* Contact Information Section */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-xl font-semibold text-foreground">Contact information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditCustomer(customer)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    Full name
                  </label>
                  <div className="mt-2 rounded-md border bg-white px-3 py-2 text-sm font-medium break-words">
                    {customer.name}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    Phone
                  </label>
                  <div className="mt-2 rounded-md border bg-white px-3 py-2 text-sm font-medium break-words">
                    {customer.phone || '—'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    Email
                  </label>
                  <div className="mt-2 rounded-md border bg-white px-3 py-2 text-sm font-medium break-words">
                    {customer.email?.trim() ? customer.email : 'Not provided'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    Address
                  </label>
                  <div className="mt-2 rounded-md border bg-white px-3 py-2 text-sm font-medium break-words">
                    {customer.address?.trim() ? customer.address : 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Spending Summary Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">Spending Summary</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Total Spent */}
              <Card className="border shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-green-200 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-3.5 h-3.5 text-green-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">
                        Total spent
                      </p>
                      <p className="text-base sm:text-lg font-bold text-green-600 leading-tight mt-0.5 truncate">
                        Rs {totalSpent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total sales */}
              <Card className="border shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-blue-200 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">
                        Sales
                      </p>
                      <p className="text-base sm:text-lg font-bold text-blue-600 leading-tight mt-0.5">
                        {totalOrders}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Paid Amount */}
              <Card className="border shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-emerald-200 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">
                        Paid
                      </p>
                      <p className="text-base sm:text-lg font-bold text-emerald-600 leading-tight mt-0.5 truncate">
                        Rs {totalPaid.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Outstanding */}
              <Card className="border shadow-sm bg-gradient-to-br from-orange-50 to-red-50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-orange-200 flex items-center justify-center flex-shrink-0">
                      <Banknote className="w-3.5 h-3.5 text-orange-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">
                        Outstanding
                      </p>
                      <p className="text-base sm:text-lg font-bold text-orange-600 leading-tight mt-0.5 truncate">
                        Rs {totalUnpaid.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Record Payment Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">Due Payment</h3>
            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Outstanding amount</p>
                <p className="text-base font-semibold text-orange-600">Rs {totalUnpaid.toLocaleString()}</p>
              </div>

              {hasOutstanding ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter paid amount"
                    className="bg-white"
                  />
                  <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cash' | 'online')}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleSubmitPayment}
                    disabled={savingPayment || !Number.isFinite(enteredAmount) || enteredAmount <= 0}
                  >
                    {savingPayment ? 'Recording...' : 'Record Payment'}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  All dues are cleared for this customer.
                </p>
              )}
            </div>
          </section>

          {/* Due Ledger Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">Due Ledger by Month</h3>
            <div className="bg-muted/30 p-4 rounded-lg">
              {monthlyDueSummary.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 pr-3">Month</th>
                        <th className="py-2 pr-3 text-right">Opening Due</th>
                        <th className="py-2 pr-3 text-right">New Sales</th>
                        <th className="py-2 pr-3 text-right">Payments</th>
                        <th className="py-2 text-right">Closing Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyDueSummary.map((row) => (
                        <tr key={row.monthKey} className="border-b last:border-b-0">
                          <td className="py-2 pr-3 font-medium">{row.monthLabel}</td>
                          <td className="py-2 pr-3 text-right">Rs {row.openingDue.toLocaleString()}</td>
                          <td className="py-2 pr-3 text-right">Rs {row.monthSales.toLocaleString()}</td>
                          <td className="py-2 pr-3 text-right">Rs {row.monthPaid.toLocaleString()}</td>
                          <td className="py-2 text-right font-semibold text-orange-600">Rs {row.closingDue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No monthly due records yet.</p>
              )}
            </div>
          </section>

          {/* Payment Transactions Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">Payment Transactions</h3>
            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
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
          </section>

          {/* Purchase History Section */}
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-4">Purchase History</h3>

            {customerSales.length > 0 ? (
              <div className="space-y-4">
                {customerSales
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((sale) => (
                    <Card key={sale.id} className="border shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        {/* Sale header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-foreground">Sale #{sale.id}</span>
                              <Badge variant="outline" className="text-xs font-medium">
                                <Calendar className="w-3 h-3 mr-1" />
                                {format(new Date(sale.date), 'dd MMM yyyy')}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{format(new Date(sale.date), 'hh:mm a')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-foreground">Rs {sale.totalAmount.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="py-4 border-b">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Items</p>
                          <div className="space-y-2">
                            {sale.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-start gap-3 p-2 bg-slate-50 rounded">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-foreground truncate">{item.productName}</p>
                                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-semibold text-sm text-foreground">Rs {item.subtotal.toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Payment Details */}
                        <div className="py-4 grid grid-cols-3 gap-3">
                          {/* Payment Method */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Method</p>
                            <Badge
                              variant="secondary"
                              className={`w-full justify-center py-1 text-xs font-medium ${
                                sale.paymentMethod === 'cash'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {sale.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                            </Badge>
                          </div>

                          {/* Payment Status */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Status</p>
                            <Badge
                              variant="secondary"
                              className={`w-full justify-center py-1 text-xs font-medium ${
                                sale.paymentStatus === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : sale.paymentStatus === 'partial'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {sale.paymentStatus === 'paid' ? '✓ Paid' : sale.paymentStatus === 'partial' ? '◐ Partial' : 'Unpaid'}
                            </Badge>
                          </div>

                          {/* Outstanding Amount */}
                          {sale.paymentStatus !== 'paid' && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Due</p>
                              <div className="p-2 bg-orange-50 rounded border border-orange-200 text-center">
                                <p className="text-sm font-bold text-orange-600">Rs {(sale.totalAmount - (sale.paidAmount || 0)).toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Payment History */}
                        {sale.payments && sale.payments.length > 0 && (
                          <div className="pt-4 border-t">
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Payments</p>
                            <div className="space-y-2">
                              {sale.payments.map((payment, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200 text-sm">
                                  <p className="text-foreground font-medium">{format(new Date(payment.date), 'dd MMM')} • {payment.method}</p>
                                  <p className="font-bold text-green-600">+ Rs {payment.amount.toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card className="border shadow-sm">
                <CardContent className="p-8 text-center">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground font-medium">No purchase history yet</p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
