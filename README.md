# Grocery Management System

A comprehensive grocery store management system with customer portal, sales tracking, payment management, and unpaid amount tracking.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [User Roles](#-user-roles)
- [Features Overview](#-features-overview)

## 🚀 Features

### Admin Dashboard
- **Customer Management**: Create, edit, and manage customer profiles
- **Sales Management**: Track sales, edit items, manage payments
- **Product Management**: Add and manage grocery products
- **Payment Tracking**: Record and track customer payments
- **Unpaid Amount Tracking**: Monitor outstanding dues from previous months
- **Customer Login Credentials**: Create and manage customer portal access
- **Analytics Dashboard**: View sales statistics and customer insights

### Customer Portal
- **Login System**: Secure customer authentication
- **Purchase History**: View all past purchases and transactions
- **Unpaid Amounts Display**: See outstanding dues and payment status
- **Profile Management**: View and update personal information
- **Inquiry System**: Submit inquiries and track responses

### Payment & Financial Management
- **Multi-method Payments**: Support for cash and online payments
- **Due Payment Tracking**: Track current and previous month dues
- **Unpaid Amount Persistence**: Store and retrieve unpaid amounts permanently
- **Payment History**: Complete transaction records

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: React hooks and context
- **Charts**: Recharts for analytics
- **Icons**: Lucide React
- **Forms**: Custom form components with validation

### Backend
- **Framework**: Django REST Framework
- **Database**: SQLite (development), PostgreSQL (production ready)
- **Authentication**: Django Token Authentication
- **API**: RESTful API endpoints
- **File Storage**: Django default storage

### DevOps & Tools
- **Version Control**: Git
- **Package Management**: npm (frontend), pip (backend)
- **Development**: Hot reload, debugging tools

## 📁 Project Structure

```
grocery-management-system/
├── Frontend/                          # Next.js frontend application
│   ├── app/                          # Next.js app router pages
│   │   ├── auth/                     # Authentication pages
│   │   ├── customers/                # Customer management
│   │   ├── sales/                    # Sales management
│   │   ├── products/                 # Product management
│   │   ├── portal/                   # Customer portal
│   │   └── reports/                  # Analytics and reports
│   ├── components/                   # Reusable React components
│   │   ├── ui/                       # Base UI components
│   │   ├── edit-customer-modal.tsx   # Customer editing modal
│   │   ├── edit-sale-modal.tsx       # Sale editing modal
│   │   └── ...                       # Other components
│   ├── lib/                          # Utility libraries
│   │   ├── api.ts                    # API functions
│   │   ├── auth.ts                   # Authentication utilities
│   │   └── store.ts                  # Type definitions
│   └── public/                       # Static assets
├── backend_django/                   # Django backend application
│   ├── store/                        # Main Django app
│   │   ├── models.py                 # Database models
│   │   ├── views.py                  # API views
│   │   ├── serializers.py            # Data serializers
│   │   ├── urls.py                   # URL routing
│   │   └── migrations/               # Database migrations
│   ├── manage.py                     # Django management script
│   └── requirements.txt             # Python dependencies
└── README.md                         # This file
```

## 🛠️ Installation

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Git

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file** (optional)
   ```bash
   cp .env.example .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:3000`

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend_django
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

   Backend API will be available at `http://localhost:8000`

## ⚙️ Configuration

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

#### Backend (settings.py)
```python
# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

# Admin usernames
ADMIN_USERNAMES = "admin,superuser"
```

## 📖 Usage

### Getting Started

1. **Start both servers** (frontend and backend)
2. **Access admin panel** at `http://localhost:3000`
3. **Login as admin** (use superuser credentials)
4. **Add customers** with login credentials
5. **Create products** and manage inventory
6. **Record sales** and track payments
7. **Customers can login** at `http://localhost:3000/login`

### Admin Workflow

1. **Customer Management**
   - Add new customers with username/password
   - Edit existing customer information
   - Manage login credentials
   - Track unpaid amounts

2. **Sales Management**
   - Create new sales records
   - Edit sale items and prices
   - Record payments (cash/online)
   - Track outstanding amounts

3. **Unpaid Amount Tracking**
   - Add unpaid amounts for previous months
   - Track customer dues
   - Generate payment reminders

### Customer Portal Workflow

1. **Customer Login**
   - Use credentials provided by admin
   - Access personal dashboard

2. **View Purchase History**
   - See all past purchases
   - Track payment status
   - View outstanding amounts

3. **Account Management**
   - View profile information
   - Submit inquiries

## 🔌 API Documentation

### Authentication Endpoints

#### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "customer_username",
  "password": "customer_password"
}
```

#### Logout
```http
POST /api/auth/logout/
Authorization: Token <token>
```

### Customer Endpoints

#### Get All Customers
```http
GET /api/customers/
Authorization: Token <token>
```

#### Create Customer
```http
POST /api/customers/
Authorization: Token <token>
Content-Type: application/json

{
  "name": "Customer Name",
  "phone": "1234567890",
  "email": "customer@example.com",
  "address": "Customer Address",
  "username": "customer_username",
  "password": "customer_password"
}
```

#### Update Customer
```http
PATCH /api/customers/{id}/
Authorization: Token <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "username": "new_username",
  "password": "new_password"
}
```

### Sales Endpoints

#### Get All Sales
```http
GET /api/sales/
Authorization: Token <token>
```

#### Create Sale
```http
POST /api/sales/
Authorization: Token <token>
Content-Type: application/json

{
  "customer": "customer_id",
  "date": "2024-01-01",
  "items": [
    {
      "productName": "Product Name",
      "quantity": 5,
      "unitPrice": 100.00
    }
  ]
}
```

### Unpaid Amounts Endpoints

#### Get Customer Unpaid Amounts
```http
GET /api/unpaid-amounts/?customer_id={customer_id}
Authorization: Token <token>
```

#### Create Unpaid Amount
```http
POST /api/unpaid-amounts/
Authorization: Token <token>
Content-Type: application/json

{
  "customer": "customer_id",
  "month": "2024-01",
  "amount": 500.00,
  "notes": "Previous month due"
}
```

### Customer Portal Endpoints

#### Get Customer Sales
```http
GET /api/my/sales/
Authorization: Token <token>
```

#### Get Customer Unpaid Amounts
```http
GET /api/my/unpaid/
Authorization: Token <token>
```

## 🗄️ Database Schema

### Core Models

#### Customer
```python
class Customer(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.CharField(max_length=255)
    address = models.TextField()
    username = models.CharField(max_length=150, unique=True)
    user = models.OneToOneField('auth.User', on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### Product
```python
class Product(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### Sale
```python
class Sale(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    date = models.DateTimeField()
    totalAmount = models.DecimalField(max_digits=12, decimal_places=2)
    paidAmount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### SaleItem
```python
class SaleItem(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE)
    productName = models.CharField(max_length=255)
    quantity = models.IntegerField()
    unitPrice = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
```

#### Payment
```python
class Payment(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=10, choices=[('cash', 'Cash'), ('online', 'Online')])
    date = models.DateTimeField()
    notes = models.TextField(blank=True)
```

#### UnpaidAmount
```python
class UnpaidAmount(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    month = models.CharField(max_length=20)  # Format: "2024-01"
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True)
    recorded_date = models.DateTimeField(auto_now_add=True)
```

## 👥 User Roles

### Admin User
- **Full system access**
- **Customer management**
- **Sales and product management**
- **Payment tracking**
- **Analytics and reporting**
- **Customer credential management**

### Customer User
- **Portal access only**
- **View purchase history**
- **Check payment status**
- **View outstanding amounts**
- **Submit inquiries**
- **Update profile information**

## 🎯 Features Overview

### Customer Management
- ✅ Create customer profiles with contact information
- ✅ Assign login credentials for portal access
- ✅ Edit customer details and credentials
- ✅ Track customer purchase history
- ✅ Manage customer payment status

### Sales Management
- ✅ Create and manage sales records
- ✅ Add/edit sale items with pricing
- ✅ Track payment status per sale
- ✅ Record partial and full payments
- ✅ Support multiple payment methods

### Unpaid Amount Tracking
- ✅ Track outstanding amounts from previous months
- ✅ Persistent storage in database
- ✅ Customer portal visibility
- ✅ Admin management interface
- ✅ Monthly tracking capabilities

### Customer Portal
- ✅ Secure login system
- ✅ Personal dashboard
- ✅ Purchase history viewing
- ✅ Outstanding amount display
- ✅ Profile management
- ✅ Inquiry submission

### Security Features
- ✅ Token-based authentication
- ✅ Role-based access control
- ✅ Password visibility toggles
- ✅ Secure API endpoints
- ✅ Customer data isolation

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS settings include frontend URL
   - Check both servers are running

2. **Authentication Issues**
   - Verify admin usernames in settings
   - Check token storage in browser
   - Ensure proper login credentials

3. **Database Issues**
   - Run migrations after model changes
   - Check database file permissions
   - Verify SQLite file exists

4. **Payment Tracking Issues**
   - Ensure customers have linked user accounts
   - Check unpaid amount API endpoints
   - Verify database records

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **Database Resets**: Use `python manage.py flush` for clean slate
3. **API Testing**: Use Django admin interface for API testing
4. **Debug Mode**: Enable debug mode for detailed error messages

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Grocery Management System** - Built with ❤️ using Next.js and Django
