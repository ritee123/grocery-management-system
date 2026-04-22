'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit, Phone, Mail, MapPin, Calendar, DollarSign } from 'lucide-react'
import { Customer, Sale } from '@/lib/store'
import { format } from 'date-fns'

interface EditCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  customerSales: Sale[]
  onUpdateCustomer: (customerData: any) => Promise<void>
}

export function EditCustomerModal({
  open,
  onOpenChange,
  customer,
  customerSales,
  onUpdateCustomer,
}: EditCustomerModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (customer) {
      setName(customer.name)
      setPhone(customer.phone)
      setEmail(customer.email)
      setAddress(customer.address)
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

  if (!customer) return null

  const stats = calculateStats()

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
