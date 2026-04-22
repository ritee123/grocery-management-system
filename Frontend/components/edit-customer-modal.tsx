'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit, User, Phone, Mail, MapPin } from 'lucide-react'
import { Customer } from '@/lib/store'

interface EditCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onUpdateCustomer: (customerData: any) => Promise<void>
}

export function EditCustomerModal({
  open,
  onOpenChange,
  customer,
  onUpdateCustomer,
}: EditCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
      })
    }
  }, [customer])

  const handleSave = async () => {
    if (!customer) return

    if (!formData.name.trim()) {
      alert('Customer name is required')
      return
    }

    setSaving(true)
    try {
      await onUpdateCustomer(formData)
      handleClose()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
    })
    onOpenChange(false)
  }

  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Customer Information
          </DialogTitle>
          <DialogDescription>
            Update customer details. Only name is required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Basic Information */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-base mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, Country"
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Current Information Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Current Information</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Name:</strong> {customer.name}</p>
              <p><strong>Phone:</strong> {customer.phone || 'Not provided'}</p>
              <p><strong>Email:</strong> {customer.email || 'Not provided'}</p>
              <p><strong>Address:</strong> {customer.address || 'Not provided'}</p>
              <p><strong>Customer ID:</strong> {customer.id}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Updating...' : 'Update Customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
