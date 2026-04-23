// Type definitions for Sanu Groceries Store
export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  createdAt: Date
}

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  category: string
  stockQuantity: number
  reorderLevel: number
}

export interface SaleItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Sale {
  id: string
  customerId: string
  customerName: string
  totalAmount: number
  paidAmount: number // Amount already paid (for partial payments)
  paymentMethod: 'cash' | 'online'
  paymentStatus: 'paid' | 'unpaid' | 'partial'
  items: SaleItem[]
  date: Date
  payments?: Payment[] // Track individual payments
}

export interface Payment {
  id: string
  amount: number
  method: 'cash' | 'online'
  date: Date
}

export interface Expense {
  id: string
  category: 'fixed' | 'operational' | 'variable'
  amount: number
  description: string
  date: Date
}

// Initial mock data
export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Ahmed Khan',
    phone: '03001234567',
    email: 'ahmed@example.com',
    address: 'Karachi, Pakistan',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Fatima Ali',
    phone: '03019876543',
    email: 'fatima@example.com',
    address: 'Lahore, Pakistan',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'Hassan Malik',
    phone: '03051234567',
    email: 'hassan@example.com',
    address: 'Islamabad, Pakistan',
    createdAt: new Date('2024-03-10'),
  },
]

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Fresh Milk',
    sku: 'SKU-001',
    price: 150,
    category: 'Dairy',
    stockQuantity: 45,
    reorderLevel: 20,
  },
  {
    id: '2',
    name: 'Wheat Bread',
    sku: 'SKU-002',
    price: 80,
    category: 'Bakery',
    stockQuantity: 32,
    reorderLevel: 15,
  },
  {
    id: '3',
    name: 'Fresh Vegetables Bundle',
    sku: 'SKU-003',
    price: 300,
    category: 'Produce',
    stockQuantity: 18,
    reorderLevel: 10,
  },
  {
    id: '4',
    name: 'Chicken Breast',
    sku: 'SKU-004',
    price: 450,
    category: 'Meat',
    stockQuantity: 25,
    reorderLevel: 10,
  },
  {
    id: '5',
    name: 'Eggs (Dozen)',
    sku: 'SKU-005',
    price: 200,
    category: 'Dairy',
    stockQuantity: 8,
    reorderLevel: 15,
  },
]

// Helper function to get date with offset
const getDateWithOffset = (daysOffset: number, hours: number = 10, minutes: number = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  date.setHours(hours, minutes, 0, 0)
  return date
}

export const mockSales: Sale[] = [
  // Today's sales
  {
    id: '1',
    customerId: '1',
    customerName: 'Ahmed Khan',
    totalAmount: 630,
    paidAmount: 630,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    payments: [{ id: 'p1', amount: 630, method: 'cash', date: getDateWithOffset(0, 10, 30) }],
    items: [
      {
        id: 'si-1-1',
        productId: '1',
        productName: 'Fresh Milk',
        quantity: 2,
        unitPrice: 150,
        subtotal: 300,
      },
      {
        id: 'si-1-2',
        productId: '2',
        productName: 'Wheat Bread',
        quantity: 2,
        unitPrice: 80,
        subtotal: 160,
      },
      {
        id: 'si-1-3',
        productId: '5',
        productName: 'Eggs (Dozen)',
        quantity: 1,
        unitPrice: 200,
        subtotal: 200,
      },
    ],
    date: getDateWithOffset(0, 10, 30),
  },
  {
    id: '2',
    customerId: '2',
    customerName: 'Fatima Ali',
    totalAmount: 900,
    paidAmount: 900,
    paymentMethod: 'online',
    paymentStatus: 'paid',
    payments: [{ id: 'p2', amount: 900, method: 'online', date: getDateWithOffset(0, 14, 15) }],
    items: [
      {
        id: 'si-2-1',
        productId: '3',
        productName: 'Fresh Vegetables Bundle',
        quantity: 2,
        unitPrice: 300,
        subtotal: 600,
      },
      {
        id: 'si-2-2',
        productId: '4',
        productName: 'Chicken Breast',
        quantity: 1,
        unitPrice: 450,
        subtotal: 450,
      },
    ],
    date: getDateWithOffset(0, 14, 15),
  },
  {
    id: '3',
    customerId: '3',
    customerName: 'Hassan Malik',
    totalAmount: 500,
    paidAmount: 0,
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    payments: [],
    items: [
      {
        id: 'si-3-1',
        productId: '1',
        productName: 'Fresh Milk',
        quantity: 2,
        unitPrice: 150,
        subtotal: 300,
      },
      {
        id: 'si-3-2',
        productId: '5',
        productName: 'Eggs (Dozen)',
        quantity: 1,
        unitPrice: 200,
        subtotal: 200,
      },
    ],
    date: getDateWithOffset(0, 9, 45),
  },
  // Yesterday's sales
  {
    id: '4',
    customerId: '1',
    customerName: 'Ahmed Khan',
    totalAmount: 450,
    paidAmount: 450,
    paymentMethod: 'online',
    paymentStatus: 'paid',
    payments: [{ id: 'p4', amount: 450, method: 'online', date: getDateWithOffset(-1, 11, 0) }],
    items: [
      {
        id: 'si-4-1',
        productId: '4',
        productName: 'Chicken Breast',
        quantity: 1,
        unitPrice: 450,
        subtotal: 450,
      },
    ],
    date: getDateWithOffset(-1, 11, 0),
  },
  {
    id: '5',
    customerId: '2',
    customerName: 'Fatima Ali',
    totalAmount: 380,
    paidAmount: 200,
    paymentMethod: 'cash',
    paymentStatus: 'partial',
    payments: [{ id: 'p5', amount: 200, method: 'cash', date: getDateWithOffset(-1, 17, 0) }],
    items: [
      {
        id: 'si-5-1',
        productId: '1',
        productName: 'Fresh Milk',
        quantity: 1,
        unitPrice: 150,
        subtotal: 150,
      },
      {
        id: 'si-5-2',
        productId: '2',
        productName: 'Wheat Bread',
        quantity: 1,
        unitPrice: 80,
        subtotal: 80,
      },
      {
        id: 'si-5-3',
        productId: '1',
        productName: 'Fresh Milk',
        quantity: 1,
        unitPrice: 150,
        subtotal: 150,
      },
    ],
    date: getDateWithOffset(-1, 16, 30),
  },
  // 2 days ago
  {
    id: '6',
    customerId: '3',
    customerName: 'Hassan Malik',
    totalAmount: 750,
    paidAmount: 750,
    paymentMethod: 'online',
    paymentStatus: 'paid',
    payments: [{ id: 'p6', amount: 750, method: 'online', date: getDateWithOffset(-2, 13, 0) }],
    items: [
      {
        id: 'si-6-1',
        productId: '3',
        productName: 'Fresh Vegetables Bundle',
        quantity: 1,
        unitPrice: 300,
        subtotal: 300,
      },
      {
        id: 'si-6-2',
        productId: '4',
        productName: 'Chicken Breast',
        quantity: 1,
        unitPrice: 450,
        subtotal: 450,
      },
    ],
    date: getDateWithOffset(-2, 13, 0),
  },
  {
    id: '7',
    customerId: '1',
    customerName: 'Ahmed Khan',
    totalAmount: 280,
    paidAmount: 280,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    payments: [{ id: 'p7', amount: 280, method: 'cash', date: getDateWithOffset(-2, 9, 15) }],
    items: [
      {
        id: 'si-7-1',
        productId: '2',
        productName: 'Wheat Bread',
        quantity: 1,
        unitPrice: 80,
        subtotal: 80,
      },
      {
        id: 'si-7-2',
        productId: '5',
        productName: 'Eggs (Dozen)',
        quantity: 1,
        unitPrice: 200,
        subtotal: 200,
      },
    ],
    date: getDateWithOffset(-2, 9, 15),
  },
  // 3 days ago
  {
    id: '8',
    customerId: '2',
    customerName: 'Fatima Ali',
    totalAmount: 600,
    paidAmount: 600,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    payments: [{ id: 'p8', amount: 600, method: 'cash', date: getDateWithOffset(-3, 10, 45) }],
    items: [
      {
        id: 'si-8-1',
        productId: '3',
        productName: 'Fresh Vegetables Bundle',
        quantity: 2,
        unitPrice: 300,
        subtotal: 600,
      },
    ],
    date: getDateWithOffset(-3, 10, 45),
  },
  // 5 days ago
  {
    id: '9',
    customerId: '3',
    customerName: 'Hassan Malik',
    totalAmount: 350,
    paidAmount: 100,
    paymentMethod: 'online',
    paymentStatus: 'partial',
    payments: [{ id: 'p9', amount: 100, method: 'cash', date: getDateWithOffset(-3, 11, 0) }],
    items: [
      {
        id: 'si-9-1',
        productId: '1',
        productName: 'Fresh Milk',
        quantity: 1,
        unitPrice: 150,
        subtotal: 150,
      },
      {
        id: 'si-9-2',
        productId: '5',
        productName: 'Eggs (Dozen)',
        quantity: 1,
        unitPrice: 200,
        subtotal: 200,
      },
    ],
    date: getDateWithOffset(-5, 15, 0),
  },
  {
    id: '10',
    customerId: '1',
    customerName: 'Ahmed Khan',
    totalAmount: 530,
    paidAmount: 530,
    paymentMethod: 'online',
    paymentStatus: 'paid',
    payments: [{ id: 'p10', amount: 530, method: 'online', date: getDateWithOffset(-5, 12, 30) }],
    items: [
      {
        id: 'si-10-1',
        productId: '2',
        productName: 'Wheat Bread',
        quantity: 1,
        unitPrice: 80,
        subtotal: 80,
      },
      {
        id: 'si-10-2',
        productId: '4',
        productName: 'Chicken Breast',
        quantity: 1,
        unitPrice: 450,
        subtotal: 450,
      },
    ],
    date: getDateWithOffset(-5, 12, 30),
  },
]

export const mockExpenses: Expense[] = [
  {
    id: '1',
    category: 'fixed',
    amount: 5000,
    description: 'Store Rent',
    date: new Date(new Date().setHours(0, 0)),
  },
  {
    id: '2',
    category: 'operational',
    amount: 800,
    description: 'Daily Delivery Fee',
    date: new Date(new Date().setHours(8, 0)),
  },
  {
    id: '3',
    category: 'variable',
    amount: 1500,
    description: 'Inventory Restocking - Dairy',
    date: new Date(new Date().setHours(11, 0)),
  },
  {
    id: '4',
    category: 'operational',
    amount: 200,
    description: 'Utilities (Water & Electricity)',
    date: new Date(new Date().setHours(15, 0)),
  },
]
