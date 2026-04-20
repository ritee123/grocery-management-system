'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, AlertTriangle, Package, DollarSign, Box } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  createProduct,
  deleteProduct,
  fetchBootstrapData,
  fetchProducts,
  updateProduct,
} from '@/lib/api'
import { Product } from '@/lib/store'

interface FormData {
  name: string
  sku: string
  price: number
  category: string
  stockQuantity: number
  reorderLevel: number
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProduct, setSavingProduct] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    sku: '',
    price: 0,
    category: '',
    stockQuantity: 0,
    reorderLevel: 0,
  })

  useEffect(() => {
    let cancelled = false

    fetchBootstrapData()
      .then((data) => {
        if (cancelled) return
        setProducts(data.products)
      })
      .catch((error) => {
        console.error('Failed to load inventory data:', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.reorderLevel).length
  const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0)

  const handleAddProduct = async () => {
    if (formData.name && formData.sku && formData.price > 0) {
      setSavingProduct(true)
      try {
        const payload = {
          name: formData.name,
          sku: formData.sku,
          price: formData.price,
          category: formData.category,
          stock_quantity: formData.stockQuantity,
          reorder_level: formData.reorderLevel,
        }

        if (editingId) {
          await updateProduct(editingId, payload)
          setEditingId(null)
        } else {
          await createProduct(payload)
        }

        const updatedProducts = await fetchProducts()
        setProducts(updatedProducts)
        setFormData({ name: '', sku: '', price: 0, category: '', stockQuantity: 0, reorderLevel: 0 })
        setIsAddingProduct(false)
      } catch (error) {
        console.error('Failed to save product:', error)
        alert(error instanceof Error ? error.message : 'Failed to save product')
      } finally {
        setSavingProduct(false)
      }
    }
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price,
      category: product.category,
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
    })
    setEditingId(product.id)
    setIsAddingProduct(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteProduct(id)
        const updatedProducts = await fetchProducts()
        setProducts(updatedProducts)
      } catch (error) {
        console.error('Failed to delete product:', error)
        alert(error instanceof Error ? error.message : 'Failed to delete product')
      }
    }
  }

  const handleUpdateStock = async (id: string, newQuantity: number) => {
    try {
      const quantity = Math.max(0, newQuantity)
      const updatedProduct = await updateProduct(id, { stock_quantity: quantity })
      setProducts(products.map((p) => (p.id === id ? {
        ...p,
        stockQuantity: updatedProduct.stock_quantity ?? quantity,
      } : p)))
    } catch (error) {
      console.error('Failed to update stock:', error)
      alert(error instanceof Error ? error.message : 'Failed to update stock')
    }
  }

  const handleCancel = () => {
    setIsAddingProduct(false)
    setEditingId(null)
    setFormData({ name: '', sku: '', price: 0, category: '', stockQuantity: 0, reorderLevel: 0 })
  }

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) {
      return { label: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' }
    }
    if (product.stockQuantity <= product.reorderLevel) {
      return { label: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-100' }
    }
    return { label: 'In Stock', color: 'text-green-600', bg: 'bg-green-100' }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage your inventory</p>
        </div>
        <Button onClick={() => setIsAddingProduct(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Box className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total items</p>
                <p className="text-2xl font-bold">{products.length}</p>
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
                <p className="text-xs text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold text-green-600">Rs {totalInventoryValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isAddingProduct}
        onOpenChange={(open) => {
          if (!open) handleCancel()
          else setIsAddingProduct(true)
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? '✏️ Edit item' : '📦 Add new item'}</DialogTitle>
            <DialogDescription>
              Add inventory product details. Name, SKU, and price are required.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="text-sm font-medium">
                  Item name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                  className="mt-2 bg-white"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-sm font-medium">
                  SKU <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-001"
                  className="mt-2 bg-white"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Dairy, Produce, etc."
                  className="mt-2 bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Unit Price (Rs) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-2 bg-white"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stock Quantity</label>
                <Input
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-2 bg-white"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reorder Level</label>
                <Input
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-2 bg-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddProduct}
              disabled={savingProduct || !formData.name || !formData.sku || formData.price <= 0}
            >
              {savingProduct ? 'Saving...' : editingId ? 'Update item' : 'Add item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search inventory..."
              className="pl-10 bg-muted/50 border-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Item</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">SKU</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Stock</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Value</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product)
                  const productValue = product.price * product.stockQuantity
                  return (
                    <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-sm">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{product.sku}</td>
                      <td className="p-4 text-sm">{product.category}</td>
                      <td className="p-4 text-right font-medium">Rs {product.price.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <Input
                          type="number"
                          value={product.stockQuantity}
                          onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                          className="w-20 h-8 text-center"
                          min="0"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-green-600">
                        Rs {productValue.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredProducts.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No inventory items found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
