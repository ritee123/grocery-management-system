import { Customer, Product, Sale, SaleItem, Expense, Payment } from './store'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function parseCustomer(customer: any): Customer {
  return {
    ...customer,
    createdAt: new Date(customer.createdAt ?? customer.created_at),
  }
}

function parseProduct(product: any): Product {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: Number(product.price),
    category: product.category,
    stockQuantity: product.stockQuantity ?? product.stock_quantity,
    reorderLevel: product.reorderLevel ?? product.reorder_level,
  }
}

function parseSaleItem(item: any): SaleItem {
  return {
    productId: item.productId ?? item.product_id,
    productName: item.productName ?? item.product_name,
    quantity: item.quantity,
    // Backend uses `unit_price` (snake_case), frontend model uses `unitPrice` (camelCase)
    unitPrice: Number(item.unitPrice ?? item.unit_price),
    subtotal: Number(item.subtotal),
  }
}

function parsePayment(payment: any): Payment {
  return {
    id: payment.id,
    amount: Number(payment.amount),
    method: payment.method,
    date: new Date(payment.date),
  }
}

function parseSale(sale: any): Sale {
  return {
    id: sale.id,
    customerId: sale.customerId ?? sale.customer_id,
    customerName: sale.customerName ?? sale.customer_name,
    totalAmount: Number(sale.totalAmount ?? sale.total_amount),
    paidAmount: Number(sale.paidAmount ?? sale.paid_amount),
    paymentMethod: sale.paymentMethod ?? sale.payment_method,
    paymentStatus: sale.paymentStatus ?? sale.payment_status,
    date: new Date(sale.date),
    items: (sale.items || []).map(parseSaleItem),
    payments: (sale.payments || []).map(parsePayment),
  }
}

function parseExpense(expense: any): Expense {
  return {
    id: expense.id,
    category: expense.category,
    amount: Number(expense.amount),
    description: expense.description,
    date: new Date(expense.date),
  }
}

async function fetchJson(path: string) {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  return await response.json()
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    // Try to include backend validation details in the error
    const text = await response.text().catch(() => '')
    throw new Error(`API request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`)
  }

  return await response.json()
}

async function patchJson(path: string, body: unknown) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`API request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`)
  }

  return await response.json()
}

async function deleteJson(path: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`API request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`)
  }
}

export async function fetchBootstrapData() {
  const data = await fetchJson('/api/bootstrap/')
  return {
    customers: (data.customers || []).map(parseCustomer),
    products: (data.products || []).map(parseProduct),
    sales: (data.sales || []).map(parseSale),
    expenses: (data.expenses || []).map(parseExpense),
  }
}

export async function fetchCustomers() {
  const data = await fetchJson('/api/customers/')
  return (data || []).map(parseCustomer)
}

export async function fetchProducts() {
  const data = await fetchJson('/api/products/')
  return (data || []).map(parseProduct)
}

export async function fetchSales() {
  const data = await fetchJson('/api/sales/')
  return (data || []).map(parseSale)
}

export async function fetchExpenses() {
  const data = await fetchJson('/api/expenses/')
  return (data || []).map(parseExpense)
}

// --- Mutations (create operations) ---

export async function createCustomer(payload: {
  name: string
  phone: string
  email: string
  address: string
}) {
  return await postJson('/api/customers/', payload)
}

export async function updateCustomer(
  id: string,
  payload: Partial<{
    name: string
    phone: string
    email: string
    address: string
  }>
) {
  return await patchJson(`/api/customers/${id}/`, payload)
}

export async function deleteCustomer(id: string) {
  await deleteJson(`/api/customers/${id}/`)
}

export async function createProduct(payload: {
  name: string
  sku: string
  price: number
  category: string
  stock_quantity: number
  reorder_level: number
}) {
  return await postJson('/api/products/', payload)
}

export async function updateProduct(
  id: string,
  payload: Partial<{
    name: string
    sku: string
    price: number
    category: string
    stock_quantity: number
    reorder_level: number
  }>
) {
  return await patchJson(`/api/products/${id}/`, payload)
}

export async function deleteProduct(id: string) {
  await deleteJson(`/api/products/${id}/`)
}

export async function createSale(payload: {
  customer: string
  customer_name: string
  total_amount: number
  paid_amount: number
  payment_method: 'cash' | 'online'
  payment_status: 'paid' | 'unpaid' | 'partial'
  date: string
}) {
  return await postJson('/api/sales/', payload)
}

export async function createSaleItem(payload: {
  sale: string
  product?: string | null
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}) {
  return await postJson('/api/sale-items/', payload)
}

export async function createPayment(payload: {
  sale: string
  amount: number
  method: 'cash' | 'online'
  date: string
}) {
  return await postJson('/api/payments/', payload)
}

export async function updateSale(
  id: string,
  payload: Partial<{
    paid_amount: number
    payment_status: 'paid' | 'unpaid' | 'partial'
  }>
) {
  return await patchJson(`/api/sales/${id}/`, payload)
}

export async function deleteSale(id: string) {
  await deleteJson(`/api/sales/${id}/`)
}
