'use client'

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Customer, Sale } from '@/lib/store'
import {
  Phone,
  Mail,
  MapPin,
  X,
  ShoppingBag,
  Calendar,
  DollarSign,
  Banknote,
  CreditCard,
} from 'lucide-react'
import { format } from 'date-fns'

interface CustomerDetailModalProps {
  customer: Customer | null
  sales: Sale[]
  isOpen: boolean
  onClose: () => void
}

export function CustomerDetailModal({
  customer,
  sales,
  isOpen,
  onClose,
}: CustomerDetailModalProps) {
  if (!customer) return null

  const customerSales = sales.filter((sale) => sale.customerId === customer.id)
  const totalSpent = customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalPaid = customerSales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0)
  const totalUnpaid = totalSpent - totalPaid
  const totalOrders = customerSales.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogTitle className="sr-only">Customer Details - {customer.name}</DialogTitle>
        <DialogDescription className="sr-only">
          View complete information about {customer.name} including contact details, purchase history, and spending summary.
        </DialogDescription>

        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-16 h-16 rounded-xl bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold border border-white border-opacity-30 flex-shrink-0">
              {customer.name.charAt(0)}
            </div>
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
        <div className="px-6 py-6 space-y-6">
          {/* Contact Information Section */}
          <section>
            <h3 className="text-2xl font-bold text-foreground mb-6">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Phone */}
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Phone</p>
                      <p className="text-sm font-medium text-foreground mt-1 truncate">{customer.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email */}
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Email</p>
                      <p className="text-sm font-medium text-foreground mt-1 truncate">{customer.email || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card className="border shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Address</p>
                      <p className="text-sm font-medium text-foreground mt-1 line-clamp-2">{customer.address || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Spending Summary Section */}
          <section>
            <h3 className="text-2xl font-bold text-foreground mb-6">Spending Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Spent */}
              <Card className="border shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded bg-green-200 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-4 h-4 text-green-700" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Total Spent</p>
                  <p className="text-xl lg:text-2xl font-bold text-green-600">Rs {totalSpent.toLocaleString()}</p>
                </CardContent>
              </Card>

              {/* Total sales */}
              <Card className="border shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded bg-blue-200 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-4 h-4 text-blue-700" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Sales</p>
                  <p className="text-xl lg:text-2xl font-bold text-blue-600">{totalOrders}</p>
                </CardContent>
              </Card>

              {/* Paid Amount */}
              <Card className="border shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded bg-emerald-200 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Paid</p>
                  <p className="text-xl lg:text-2xl font-bold text-emerald-600">Rs {totalPaid.toLocaleString()}</p>
                </CardContent>
              </Card>

              {/* Outstanding */}
              <Card className="border shadow-sm bg-gradient-to-br from-orange-50 to-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded bg-orange-200 flex items-center justify-center flex-shrink-0">
                      <Banknote className="w-4 h-4 text-orange-700" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Outstanding</p>
                  <p className="text-xl lg:text-2xl font-bold text-orange-600">Rs {totalUnpaid.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Purchase History Section */}
          <section>
            <h3 className="text-2xl font-bold text-foreground mb-6">Purchase History</h3>

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
