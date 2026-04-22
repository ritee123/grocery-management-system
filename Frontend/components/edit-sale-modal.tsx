'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Edit } from 'lucide-react'
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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (sale) {
      setSaleDate(new Date(sale.date))
    }
  }, [sale])

  const handleSave = async () => {
    if (!sale) return

    setSaving(true)
    try {
      await onUpdateSale({
        date: saleDate.toISOString(),
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
    onOpenChange(false)
  }

  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Sale Date
          </DialogTitle>
          <DialogDescription>
            Change the date for this sale. Current date: {format(new Date(sale.date), 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">New Sale Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
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

          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Sale Details:</strong><br />
              Customer: {sale.customerName}<br />
              Amount: Rs {sale.totalAmount.toLocaleString()}<br />
              Status: {sale.paymentStatus}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Updating...' : 'Update Date'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
