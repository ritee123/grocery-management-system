'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, Filter, TrendingDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Expense } from '@/lib/store'
import { fetchExpenses } from '@/lib/api'

interface FormData {
  category: 'fixed' | 'operational' | 'variable'
  amount: number
  description: string
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  fixed: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-600',
    icon: '🏢',
  },
  operational: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    text: 'text-purple-600',
    icon: '🔧',
  },
  variable: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    text: 'text-orange-600',
    icon: '📦',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  fixed: 'Fixed Costs',
  operational: 'Operational',
  variable: 'Variable Costs',
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<'all' | 'fixed' | 'operational' | 'variable'>('all')
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    category: 'operational',
    amount: 0,
    description: '',
  })

  useEffect(() => {
    let cancelled = false

    fetchExpenses()
      .then((data) => {
        if (cancelled) return
        setExpenses(data)
      })
      .catch((error) => {
        console.error('Failed to load expense data:', error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterCategory === 'all' || expense.category === filterCategory
    return matchesSearch && matchesFilter
  })

  // Calculate today's expenses
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todaysExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      expenseDate.setHours(0, 0, 0, 0)
      return expenseDate.getTime() === today.getTime()
    })
  }, [expenses])

  const todayTotal = todaysExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate by category
  const expensesByCategory = useMemo(() => {
    return {
      fixed: expenses
        .filter((e) => e.category === 'fixed')
        .reduce((sum, e) => sum + e.amount, 0),
      operational: expenses
        .filter((e) => e.category === 'operational')
        .reduce((sum, e) => sum + e.amount, 0),
      variable: expenses
        .filter((e) => e.category === 'variable')
        .reduce((sum, e) => sum + e.amount, 0),
    }
  }, [expenses])

  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0)

  const handleAddExpense = () => {
    if (formData.description && formData.amount > 0) {
      if (editingId) {
        setExpenses(
          expenses.map((e) =>
            e.id === editingId
              ? {
                  ...e,
                  ...formData,
                }
              : e
          )
        )
        setEditingId(null)
      } else {
        const newExpense: Expense = {
          id: Date.now().toString(),
          ...formData,
          date: new Date(),
        }
        setExpenses([newExpense, ...expenses])
      }
      setFormData({
        category: 'operational',
        amount: 0,
        description: '',
      })
      setIsAddingExpense(false)
    }
  }

  const handleEdit = (expense: Expense) => {
    setFormData({
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
    })
    setEditingId(expense.id)
    setIsAddingExpense(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter((e) => e.id !== id))
    }
  }

  const handleCancel = () => {
    setIsAddingExpense(false)
    setEditingId(null)
    setFormData({
      category: 'operational',
      amount: 0,
      description: '',
    })
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track and manage store expenses</p>
        </div>
        <Button
          onClick={() => setIsAddingExpense(true)}
          className="gap-2 bg-primary hover:bg-primary/90"
          disabled={isAddingExpense}
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Today&apos;s Expenses</p>
            <p className="text-3xl font-bold mt-2 text-red-600">Rs {todayTotal.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={CATEGORY_COLORS.fixed.bg}>
          <CardContent className="p-6">
            <p className={`text-sm font-medium ${CATEGORY_COLORS.fixed.text}`}>
              {CATEGORY_LABELS.fixed}
            </p>
            <p className={`text-2xl font-bold mt-2 ${CATEGORY_COLORS.fixed.text}`}>
              Rs {expensesByCategory.fixed.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className={CATEGORY_COLORS.operational.bg}>
          <CardContent className="p-6">
            <p className={`text-sm font-medium ${CATEGORY_COLORS.operational.text}`}>
              {CATEGORY_LABELS.operational}
            </p>
            <p className={`text-2xl font-bold mt-2 ${CATEGORY_COLORS.operational.text}`}>
              Rs {expensesByCategory.operational.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className={CATEGORY_COLORS.variable.bg}>
          <CardContent className="p-6">
            <p className={`text-sm font-medium ${CATEGORY_COLORS.variable.text}`}>
              {CATEGORY_LABELS.variable}
            </p>
            <p className={`text-2xl font-bold mt-2 ${CATEGORY_COLORS.variable.text}`}>
              Rs {expensesByCategory.variable.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Expense Form */}
      {isAddingExpense && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category *</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as 'fixed' | 'operational' | 'variable',
                    })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">
                      Fixed Costs (Rent, Salaries, Insurance)
                    </SelectItem>
                    <SelectItem value="operational">
                      Operational (Delivery, Utilities, Maintenance)
                    </SelectItem>
                    <SelectItem value="variable">
                      Variable Costs (Inventory, Restocking)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Amount (Rs) *</label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description *</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Daily utilities bill"
                className="mt-2"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleAddExpense} className="bg-primary hover:bg-primary/90">
                {editingId ? 'Update Expense' : 'Add Expense'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by description..."
            className="pl-10"
          />
        </div>
        <Select
          value={filterCategory}
          onValueChange={(value) =>
            setFilterCategory(value as 'all' | 'fixed' | 'operational' | 'variable')
          }
        >
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="fixed">Fixed Costs</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="variable">Variable Costs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense) => {
            const color = CATEGORY_COLORS[expense.category]
            return (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`text-2xl ${color.bg} p-3 rounded-lg`}>
                        {CATEGORY_COLORS[expense.category].icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{expense.description}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${color.bg} ${color.text}`}
                          >
                            {CATEGORY_LABELS[expense.category]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(expense.date).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">
                          Rs {expense.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No expenses found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
