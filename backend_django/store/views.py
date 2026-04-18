from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
from .models import Customer, Product, Sale, SaleItem, Payment, Expense
from .serializers import (
    CustomerSerializer, ProductSerializer, SaleSerializer,
    SaleItemSerializer, PaymentSerializer, ExpenseSerializer
)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer

class SaleItemViewSet(viewsets.ModelViewSet):
    queryset = SaleItem.objects.all()
    serializer_class = SaleItemSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

@api_view(['GET'])
def bootstrap(request):
    """Get all data for the frontend"""
    customers = Customer.objects.all()
    products = Product.objects.all()
    sales = Sale.objects.all().prefetch_related('items', 'payments')
    expenses = Expense.objects.all()

    customer_serializer = CustomerSerializer(customers, many=True)
    product_serializer = ProductSerializer(products, many=True)
    sale_serializer = SaleSerializer(sales, many=True)
    expense_serializer = ExpenseSerializer(expenses, many=True)

    data = {
        'customers': customer_serializer.data,
        'products': product_serializer.data,
        'sales': sale_serializer.data,
        'expenses': expense_serializer.data,
    }

    return Response(data)
