'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Trash2,
  Calendar,
  X,
  ShoppingCart,
  DollarSign,
  Clock,
  CreditCard,
  Banknote,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { createPayment, createSale, createSaleItem, deleteSale, fetchBootstrapData, fetchSales } from '@/lib/api'
import { Sale, SaleItem, Product, Customer } from '@/lib/store'

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'all' | 'cash' | 'online'>('all')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ productId: string; quantity: number }>
  >([])
  const [customItems, setCustomItems] = useState<
    Array<{ name: string; quantity: number; unitPrice: number }>
  >([])
  const [itemsMode, setItemsMode] = useState<'inventory' | 'custom'>('inventory')
  const [totalAmountInput, setTotalAmountInput] = useState<string>('0')
  const [paidAmountInput, setPaidAmountInput] = useState<string>('0')
  const [autoTotal, setAutoTotal] = useState(true)
  const [loading, setLoading] = useState(true)
  const [creatingSale, setCreatingSale] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchBootstrapData()
      .then((data) => {
        if (cancelled) return
        setSales(data.sales)
        setCustomers(data.customers)
        setProducts(data.products)
      })
      .catch((error) => {
        console.error('Failed to load sales data:', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesSearch =
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.includes(searchTerm)
      const matchesStatus =
        filterStatus === 'all' || 
        sale.paymentStatus === filterStatus ||
        (filterStatus === 'unpaid' && sale.paymentStatus === 'partial')
      const matchesPaymentMethod =
        filterPaymentMethod === 'all' || sale.paymentMethod === filterPaymentMethod
      const matchesDate = !selectedDate || (
        new Date(sale.date).toDateString() === selectedDate.toDateString()
      )
      return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDate
    })
  }, [sales, searchTerm, filterStatus, filterPaymentMethod, selectedDate])

  const filteredTotals = useMemo(() => {
    const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const paidAmount = filteredSales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0)
    const unpaidAmount = totalAmount - paidAmount
    const cashAmount = filteredSales
      .filter((sale) => sale.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + sale.totalAmount, 0)
    const onlineAmount = filteredSales
      .filter((sale) => sale.paymentMethod === 'online')
      .reduce((sum, sale) => sum + sale.totalAmount, 0)
    return { totalAmount, paidAmount, unpaidAmount, cashAmount, onlineAmount }
  }, [filteredSales])

  const handleCreateSale = async () => {
    if (!selectedCustomer) {
      alert('Please select a registered customer for this sale.')
      return
    }
    if (itemsMode === 'inventory' && selectedProducts.length === 0) {
      alert('Please add at least one inventory item to the sale.')
      return
    }
    if (itemsMode === 'custom' && customItems.length === 0) {
      alert('Please add at least one item to the sale.')
      return
    }

    const customer = customers.find((c) => c.id === selectedCustomer)
    if (!customer) {
      alert('The selected customer is not registered.')
      return
    }

    const items: SaleItem[] =
      itemsMode === 'inventory'
        ? (selectedProducts
            .map((item) => {
              const product = products.find((p) => p.id === item.productId)
              if (!product || item.quantity < 1) return null
              return {
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: product.price,
                subtotal: product.price * item.quantity,
              }
            })
            .filter((item) => item !== null) as SaleItem[])
        : (customItems
            .map((item) => {
              if (!item.name.trim() || item.quantity < 1) return null
              return {
                productId: '',
                productName: item.name.trim(),
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.unitPrice * item.quantity,
              }
            })
            .filter((item) => item !== null) as SaleItem[])

    if (items.length === 0) {
      alert('Please choose valid items and quantities before creating the sale.')
      return
    }

    const computedTotalAmount = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2))
    const totalAmount = autoTotal ? computedTotalAmount : Number(totalAmountInput || 0)
    const paidAmount = Number(paidAmountInput || 0)
    const normalizedPaidAmount = Math.max(0, Math.min(paidAmount, totalAmount))
    const paymentStatus: 'paid' | 'unpaid' | 'partial' =
      normalizedPaidAmount <= 0
        ? 'unpaid'
        : normalizedPaidAmount >= totalAmount
          ? 'paid'
          : 'partial'
    setCreatingSale(true)

    try {
      const createdSale = await createSale({
        customer: customer.id,
        customer_name: customer.name,
        total_amount: totalAmount,
        paid_amount: normalizedPaidAmount,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        date: new Date().toISOString(),
      })

      const saleId = createdSale.id as string

      await Promise.all(
        items.map((item) =>
          createSaleItem({
            sale: saleId,
            product: itemsMode === 'inventory' ? item.productId : null,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            subtotal: item.subtotal,
          })
        )
      )

      if (normalizedPaidAmount > 0) {
        await createPayment({
          sale: saleId,
          amount: normalizedPaidAmount,
          method: paymentMethod,
          date: new Date().toISOString(),
        })
      }

      const updatedSales = await fetchSales()
      setSales(updatedSales)
      resetForm()
    } catch (e) {
      console.error('Failed to create sale:', e)
      const message = e instanceof Error ? e.message : 'Failed to create sale'
      alert(message)
    } finally {
      setCreatingSale(false)
    }
  }

  const resetForm = () => {
    setSelectedCustomer('')
    setPaymentMethod('cash')
    setSelectedProducts([])
    setCustomItems([])
    setItemsMode('inventory')
    setAutoTotal(true)
    setTotalAmountInput('0')
    setPaidAmountInput('0')
    setIsCreateDialogOpen(false)
  }

  const handleDeleteSale = async (id: string) => {
    if (confirm('Are you sure you want to delete this sale?')) {
      try {
        await deleteSale(id)
        const updatedSales = await fetchSales()
        setSales(updatedSales)
      } catch (error) {
        console.error('Failed to delete sale:', error)
        alert(error instanceof Error ? error.message : 'Failed to delete sale')
      }
    }
  }

  const addProductToOrder = () => {
    setSelectedProducts([
      ...selectedProducts,
      { productId: '', quantity: 1 },
    ])
  }

  const updateProductInOrder = (
    index: number,
    field: 'productId' | 'quantity',
    value: string | number
  ) => {
    const updated = [...selectedProducts]
    if (field === 'productId') {
      updated[index].productId = value as string
    } else {
      updated[index].quantity = value as number
    }
    setSelectedProducts(updated)
  }

  const removeProductFromOrder = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index))
  }

  const orderTotal = selectedProducts.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)
    return sum + (product ? product.price * item.quantity : 0)
  }, 0)

  const customTotal = customItems.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0), 0)

  useEffect(() => {
    const computed = itemsMode === 'inventory' ? orderTotal : customTotal
    if (autoTotal) {
      setTotalAmountInput(String(Math.round(computed * 100) / 100))
      setPaidAmountInput(String(Math.round(computed * 100) / 100))
    }
  }, [orderTotal, customTotal, autoTotal, itemsMode])

  const addCustomItem = () => {
    setCustomItems([...customItems, { name: '', quantity: 1, unitPrice: 0 }])
  }

  const updateCustomItem = (
    index: number,
    field: 'name' | 'quantity' | 'unitPrice',
    value: string | number
  ) => {
    const updated = [...customItems]
    ;(updated[index] as any)[field] = value
    setCustomItems(updated)
  }

  const removeCustomItem = (index: number) => {
    setCustomItems(customItems.filter((_, i) => i !== index))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales</h1>
          <p className="text-sm text-muted-foreground">Manage sales and track payments</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Sale
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="text-lg font-bold">Rs {filteredTotals.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{filteredSales.length} sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-lg font-bold text-green-600">Rs {filteredTotals.paidAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unpaid</p>
                <p className="text-lg font-bold text-orange-600">Rs {filteredTotals.unpaidAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cash</p>
                <p className="text-lg font-bold">Rs {filteredTotals.cashAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Online</p>
                <p className="text-lg font-bold">Rs {filteredTotals.onlineAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Sale</DialogTitle>
            <DialogDescription>
              Add items either from inventory or by typing ingredients/items. You can also manually set total and paid amount.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Select Customer</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="mt-2 bg-white">
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.length > 0 ? (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.phone})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-customers-available" disabled>
                      No registered customers
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {customers.length === 0 && (
                <p className="text-xs text-red-600 mt-2">No registered customers available yet.</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as 'cash' | 'online')}
              >
                <SelectTrigger className="mt-2 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={itemsMode === 'inventory' ? 'default' : 'outline'}
              onClick={() => setItemsMode('inventory')}
            >
              Inventory items
            </Button>
            <Button
              type="button"
              variant={itemsMode === 'custom' ? 'default' : 'outline'}
              onClick={() => setItemsMode('custom')}
            >
              Type ingredients/items
            </Button>
          </div>

          {itemsMode === 'inventory' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Items</label>
                <span className="text-xs text-muted-foreground">Select from inventory.</span>
              </div>

              {selectedProducts.length === 0 && (
                <div className="rounded-lg border border-dashed border-muted p-4 text-sm text-muted-foreground">
                  Add sale items and quantities to build the order.
                </div>
              )}

              {selectedProducts.map((item, index) => {
                const product = products.find((p) => p.id === item.productId)
                const lineTotal = product ? product.price * item.quantity : 0
                return (
                  <div key={index} className="flex flex-col gap-3 bg-white p-3 rounded-lg border">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Select
                          value={item.productId}
                          onValueChange={(value) => updateProductInOrder(index, 'productId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.length > 0 ? (
                              products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} (Rs {product.price})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-products-available" disabled>
                                No inventory products
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-28">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateProductInOrder(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                          placeholder="Qty"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProductFromOrder(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>{product ? `Unit price: Rs ${product.price.toLocaleString()}` : 'Select a product'}</span>
                      <span>{product ? `Line total: Rs ${lineTotal.toLocaleString()}` : ''}</span>
                      {product && product.stockQuantity !== undefined && <span>{`Stock: ${product.stockQuantity}`}</span>}
                    </div>
                  </div>
                )
              })}

              <Button
                type="button"
                variant="outline"
                onClick={addProductToOrder}
                className="w-full gap-2"
                disabled={products.length === 0}
              >
                <Plus className="w-4 h-4" />
                Add item
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Ingredients / Items</label>
                <span className="text-xs text-muted-foreground">Type items manually.</span>
              </div>

              {customItems.length === 0 && (
                <div className="rounded-lg border border-dashed border-muted p-4 text-sm text-muted-foreground">
                  Add items like “Sugar”, “Oil”, “Spices”, etc, with quantity and unit price.
                </div>
              )}

              {customItems.map((item, idx) => {
                const lineTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0)
                return (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded-lg border">
                    <div className="col-span-6">
                      <label className="text-xs text-muted-foreground">Item name</label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateCustomItem(idx, 'name', e.target.value)}
                        placeholder="e.g. Eggs, Sugar, Oil..."
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground">Qty</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateCustomItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs text-muted-foreground">Unit price</label>
                      <Input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateCustomItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                      <div className="text-xs text-muted-foreground mt-1">Line: Rs {Math.round(lineTotal * 100) / 100}</div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomItem(idx)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}

              <Button type="button" variant="outline" onClick={addCustomItem} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Add item
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg">
            <div className="md:col-span-1">
              <label className="text-sm font-medium">Auto-calculate total</label>
              <div className="mt-2 flex gap-2">
                <Button type="button" variant={autoTotal ? 'default' : 'outline'} onClick={() => setAutoTotal(true)}>
                  On
                </Button>
                <Button type="button" variant={!autoTotal ? 'default' : 'outline'} onClick={() => setAutoTotal(false)}>
                  Off
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                When On, total & paid default to computed total.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Total Amount (Rs)</label>
              <Input
                type="number"
                min="0"
                value={totalAmountInput}
                onChange={(e) => setTotalAmountInput(e.target.value)}
                disabled={autoTotal}
                className="mt-2 bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Paid Amount (Rs)</label>
              <Input
                type="number"
                min="0"
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(e.target.value)}
                className="mt-2 bg-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateSale}
              disabled={
                creatingSale ||
                !selectedCustomer ||
                (itemsMode === 'inventory' ? selectedProducts.length === 0 : customItems.length === 0)
              }
            >
              {creatingSale ? 'Creating...' : 'Create Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sales..."
                className="pl-10 bg-muted/50 border-0"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}>
                <X className="w-4 h-4" />
              </Button>
            )}

            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'paid' | 'unpaid')}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPaymentMethod} onValueChange={(value) => setFilterPaymentMethod(value as 'all' | 'cash' | 'online')}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sale ID</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Method</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-sm">#{sale.id}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{sale.customerName}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(sale.date), 'dd MMM yyyy')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold">Rs {sale.totalAmount.toLocaleString()}</span>
                      {sale.paymentStatus !== 'paid' && (
                        <p className="text-xs text-orange-600">
                          Due: Rs {(sale.totalAmount - (sale.paidAmount || 0)).toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        sale.paymentMethod === 'cash'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {sale.paymentMethod === 'cash' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                        {sale.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
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
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredSales.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No sales found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
