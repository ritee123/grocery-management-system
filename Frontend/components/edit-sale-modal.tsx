'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Edit, Plus, Trash2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Sale } from '@/lib/store'

interface EditSaleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: Sale | null
  onUpdateSale: (saleData: any) => Promise<void>
}

export function EditSaleModal({
  open,
  onOpenChange,
  sale,
  onUpdateSale,
}: EditSaleModalProps) {
  const [saleDate, setSaleDate] = useState<Date>(new Date())
  const [items, setItems] = useState<Array<{ localId: string; id?: string; name: string; price: number; quantity: number }>>([])
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('paid')
  const [paidAmount, setPaidAmount] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (sale) {
      setSaleDate(new Date(sale.date))
      
      const mappedItems = sale.items.map(item => ({
        localId: item.id,
        id: item.id,
        name: item.productName,
        price: item.unitPrice,
        quantity: item.quantity
      }))
      setItems(mappedItems)
      setPaymentStatus(sale.paymentStatus)
      setPaidAmount(sale.paidAmount || 0)
    }
  }, [sale])

  const updateItem = (
    localId: string,
    field: 'name' | 'price' | 'quantity',
    value: any
  ) => {
    setItems(
      items.map((item) =>
        item.localId === localId ? { ...item, [field]: value } : item
      )
    )
  }

  const addItem = () => {
    const localId = `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setItems((prev) => [
      ...prev,
      { localId, name: '', price: 0, quantity: 1 },
    ])
  }

  const removeItem = (localId: string) => {
    setItems((prev) => prev.filter((item) => item.localId !== localId))
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleSave = async () => {
    if (!sale) return

    setSaving(true)
    try {
      const updatedItems = items.map(item => ({
        id: item.id,
        productName: item.name,
        unitPrice: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }))

      const totalAmount = calculateTotal()
      const updatedPaidAmount = paymentStatus === 'paid' ? totalAmount : paymentStatus === 'unpaid' ? 0 : paidAmount

      await onUpdateSale({
        date: saleDate.toISOString(),
        items: updatedItems,
        totalAmount,
        paymentStatus,
        paidAmount: updatedPaidAmount
      })
      handleClose()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update sale')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setSaleDate(new Date())
    setItems([])
    setPaymentStatus('paid')
    setPaidAmount(0)
    onOpenChange(false)
  }

  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <div className="px-6 pt-6 pb-2 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Sale
            </DialogTitle>
            <DialogDescription>
              Edit the date, items, and payment status for this sale.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-6 overflow-y-auto min-h-0">
          {/* Date Section */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-base mb-4">Sale Date</h3>
            <div className="max-w-sm">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-white"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {saleDate ? format(saleDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={saleDate}
                    onSelect={(date) => date && setSaleDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold text-base">Edit Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden bg-white">
              {/* Header Row */}
              <div className="hidden md:grid md:grid-cols-6 gap-3 bg-slate-100 px-4 py-3 font-semibold text-sm border-b">
                <div className="md:col-span-2">Item Name</div>
                <div className="md:col-span-1 text-right">Price (Rs)</div>
                <div className="md:col-span-1 text-center">Quantity</div>
                <div className="md:col-span-1 text-right">Total</div>
                <div className="md:col-span-1 text-right">Action</div>
              </div>

              {/* Item Rows */}
              <div>
                {items.map((item) => {
                  const itemTotal = item.price * item.quantity
                  return (
                    <div
                      key={item.localId}
                      className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 border-b hover:bg-slate-50 transition-colors items-end"
                    >
                      {/* Item Name */}
                      <div className="md:col-span-2">
                        <label className="text-xs text-muted-foreground md:hidden">Item name</label>
                        <Input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(item.localId, 'name', e.target.value)
                          }
                          className="h-10 w-full mt-1 md:mt-0"
                          placeholder="Enter item name"
                        />
                      </div>

                      {/* Price */}
                      <div className="md:col-span-1">
                        <label className="text-xs text-muted-foreground md:hidden">Price (Rs)</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.localId, 'price', parseFloat(e.target.value) || 0)
                          }
                          className="h-10 text-right w-full mt-1 md:mt-0"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-1">
                        <label className="text-xs text-muted-foreground md:hidden">Quantity</label>
                        <div className="flex items-center justify-center gap-1 bg-white border rounded-lg mt-1 md:mt-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateItem(item.localId, 'quantity', Math.max(1, item.quantity - 1))
                            }
                            className="h-10 w-8 p-0 text-lg"
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.localId, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className="h-10 text-center border-0 flex-1 text-sm w-full"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateItem(item.localId, 'quantity', item.quantity + 1)}
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

                      {/* Action */}
                      <div className="md:col-span-1 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.localId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-base mb-4">Payment Status</h3>
            <div className="bg-white rounded-lg p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">Payment Status</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment-status-edit"
                      value="paid"
                      checked={paymentStatus === 'paid'}
                      onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'unpaid' | 'partial')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Paid</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment-status-edit"
                      value="unpaid"
                      checked={paymentStatus === 'unpaid'}
                      onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'unpaid' | 'partial')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Unpaid</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment-status-edit"
                      value="partial"
                      checked={paymentStatus === 'partial'}
                      onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'unpaid' | 'partial')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Partial Payment</span>
                  </label>
                </div>
              </div>

              {paymentStatus === 'partial' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Paid Amount</label>
                  <Input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Enter paid amount"
                    className="bg-white"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: Rs {(calculateTotal() - paidAmount).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-base mb-4">Summary</h3>
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount</span>
                <span className="text-lg font-bold text-green-600">Rs {calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Paid Amount</span>
                <span className="font-semibold text-blue-600">
                  Rs {paymentStatus === 'paid' ? calculateTotal() : paymentStatus === 'unpaid' ? 0 : paidAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Due Amount</span>
                <span className="font-semibold text-orange-600">
                  Rs {paymentStatus === 'paid' ? 0 : paymentStatus === 'unpaid' ? calculateTotal() : (calculateTotal() - paidAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Updating...' : 'Update Sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
