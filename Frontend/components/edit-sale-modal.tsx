'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Edit, Plus, Trash2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Sale, SaleItem } from '@/lib/store'

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
  const [items, setItems] = useState<Array<{ id: string; name: string; price: number; quantity: number }>>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (sale) {
      setSaleDate(new Date(sale.date))
      setItems(sale.items.map((item, index) => ({
        id: `${index + 1}`,
        name: item.productName,
        price: item.unitPrice,
        quantity: item.quantity,
      })))
    }
  }, [sale])

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

  const addItem = () => {
    setItems([
      ...items,
      { id: `${items.length + 1}`, name: '', price: 0, quantity: 1 },
    ])
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleSave = async () => {
    if (!sale) return

    const validItems = items.filter(
      (item) => item.name && item.price > 0 && item.quantity > 0
    )

    if (validItems.length === 0) {
      alert('Please add at least one valid item')
      return
    }

    setSaving(true)
    try {
      await onUpdateSale({
        date: saleDate.toISOString(),
        items: validItems.map((item) => ({
          productName: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        totalAmount: calculateSubtotal(),
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
    onOpenChange(false)
  }

  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <div className="px-6 pt-6 pb-2 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <Edit className="w-5 h-5" />
              Edit Sale
            </DialogTitle>
            <DialogDescription>
              Edit sale date and items. Current date: {format(new Date(sale.date), 'PPP')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-6 overflow-y-auto min-h-0">
          {/* Sale Date */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-base mb-4">Sale Date</h3>
            <div className="max-w-sm">
              <label className="text-sm font-medium mb-2 block">New Sale Date</label>
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

          {/* Edit Items */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-base mb-4">Edit Items</h3>
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
                            -
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

          {/* Summary */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-base mb-4">Summary</h3>
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{sale.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <span className="font-medium">{sale.paymentStatus}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-lg font-bold text-green-600">Rs {calculateSubtotal().toFixed(2)}</span>
                </div>
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
