
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ShoppingCart, Plus, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Customer, Product } from '@/lib/store'

interface CreateSaleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
  products: Product[]
  onCreateSale: (saleData: any) => void
}

export function CreateSaleModal({
  open,
  onOpenChange,
  customers,
  products,
  onCreateSale,
}: CreateSaleModalProps) {
  const [customerName, setCustomerName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [items, setItems] = useState<Array<{ id: string; name: string; price: number; quantity: number }>>([
    { id: '1', name: '', price: 0, quantity: 1 },
  ])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentStatus, setPaymentStatus] = useState('paid')
  const [notes, setNotes] = useState('')

  const addItem = () => {
    setItems([
      ...items,
      { id: `${items.length + 1}`, name: '', price: 0, quantity: 1 },
    ])
  }

  const updateItem = (
    id: string,
    field: 'name' | 'price' | 'quantity',
    value: any
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const subtotal = calculateSubtotal()
  const total = Math.max(0, subtotal - discount)

  const handleSave = () => {
    const customer = customers.find((c) => c.id === selectedCustomerId)
    if (!selectedCustomerId || !customer) {
      alert('Please select a customer')
      return
    }

    const validItems = items.filter(
      (item) => item.name && item.price > 0 && item.quantity > 0
    )

    if (validItems.length === 0) {
      alert('Please add at least one item')
      return
    }

    const saleData = {
      customerId: selectedCustomerId,
      customerName: customer.name,
      items: validItems.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      })),
      subtotal,
      discount,
      total,
      paymentMethod,
      paymentStatus,
      notes,
    }

    onCreateSale(saleData)
    handleClose()
  }

  const handleClose = () => {
    setCustomerName('')
    setPhoneNumber('')
    setSelectedCustomerId('')
    setItems([{ id: '1', name: '', price: 0, quantity: 1 }])
    setDiscount(0)
    setPaymentMethod('cash')
    setPaymentStatus('paid')
    setNotes('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <div className="px-6 pt-6 pb-2 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <ShoppingCart className="w-5 h-5" />
              Create Sale
            </DialogTitle>
            <DialogDescription>Enter sale details, items, and payment information.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-6 overflow-y-auto min-h-0">
          {/* Customer Information */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-base mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Customer</label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number</label>
                <Input
                  placeholder="Enter phone number (optional)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={!!selectedCustomerId}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Add Items - Table Layout */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-base mb-4">Add Items</h3>
            <div className="border rounded-lg overflow-hidden bg-white">
              {/* Header Row */}
              <div className="hidden md:grid md:grid-cols-12 gap-3 bg-slate-100 px-4 py-3 font-semibold text-sm border-b">
                <div className="md:col-span-5">Item name</div>
                <div className="md:col-span-2 text-right">Price (Rs)</div>
                <div className="md:col-span-3 text-center">Quantity</div>
                <div className="md:col-span-1 text-right">Total</div>
                <div className="md:col-span-1 text-center"> </div>
              </div>

              {/* Item Rows */}
              <div>
                {items.map((item, idx) => {
                  const itemTotal = item.price * item.quantity
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border-b hover:bg-slate-50 transition-colors items-end"
                    >
                      {/* Item Name */}
                      <div className="md:col-span-5">
                        <label className="text-xs text-muted-foreground md:hidden">Item name</label>
                        <Input
                          placeholder="Enter item name"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          className="h-10 w-full mt-1 md:mt-0"
                        />
                      </div>

                      {/* Price */}
                      <div className="md:col-span-2">
                        <label className="text-xs text-muted-foreground md:hidden">Price (Rs)</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.id, 'price', parseFloat(e.target.value) || 0)
                          }
                          className="h-10 text-right w-full mt-1 md:mt-0"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-3">
                        <label className="text-xs text-muted-foreground md:hidden">Quantity</label>
                        <div className="flex items-center justify-center gap-1 bg-white border rounded-lg mt-1 md:mt-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))
                            }
                            className="h-10 w-8 p-0 text-lg"
                          >
                            −
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className="h-10 text-center border-0 flex-1 text-sm w-full"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                            className="h-10 w-8 p-0 text-lg"
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="md:col-span-1 text-right font-semibold">
                        <label className="text-xs text-muted-foreground md:hidden">Total (Rs)</label>
                        <div className="mt-1 md:mt-0">Rs {itemTotal.toFixed(2)}</div>
                      </div>

                      {/* Delete Button */}
                      <div className="md:col-span-1 flex justify-end md:justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="h-10 w-10 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={addItem}
              className="mt-4 w-full gap-2 h-10"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summary */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-base mb-4">Summary</h3>
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">Rs {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-muted-foreground">Discount</label>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-28 h-9 text-right"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-lg font-bold text-green-600">Rs {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-base mb-4">Payment Details</h3>
              <div className="bg-white rounded-lg p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-3 block">Payment Method</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payment-method"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Cash</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payment-method"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Online</span>
                    </label>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="text-sm font-medium mb-3 block">Payment Status</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payment-status"
                        value="paid"
                        checked={paymentStatus === 'paid'}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Paid</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payment-status"
                        value="unpaid"
                        checked={paymentStatus === 'unpaid'}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Unpaid</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
            <textarea
              placeholder="Enter any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              rows={3}
            />
          </div>

        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background">
          <Button variant="outline" onClick={handleClose} className="h-10 px-6">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 h-10 px-6 text-white">
            Save Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
