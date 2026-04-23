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
  Edit,
  ShoppingBag,
  Calendar,
  DollarSign,
  Banknote,
  CreditCard,
  User,
} from 'lucide-react'
import { format } from 'date-fns'

interface CustomerDetailModalProps {
  customer: Customer | null
  sales: Sale[]
  isOpen: boolean
  onClose: () => void
  onEditCustomer: (customer: Customer) => void
}

export function CustomerDetailModal({
  customer,
  sales,
  isOpen,
  onClose,
  onEditCustomer,
}: CustomerDetailModalProps) {
  if (!customer) return null

  const customerSales = sales.filter((sale) => sale.customerId === customer.id)
  const totalSpent = customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalPaid = customerSales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0)
  const totalUnpaid = totalSpent - totalPaid
  const totalOrders = customerSales.length

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
