from rest_framework import viewsets, status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
import os
from django.db.models.deletion import RestrictedError
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Customer, Product, Sale, SaleItem, Payment, Expense, CustomerProfile, UnpaidAmount
from .serializers import (
    CustomerSerializer, ProductSerializer, SaleSerializer,
    SaleItemSerializer, PaymentSerializer, ExpenseSerializer, UnpaidAmountSerializer
)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        username = data.get('username')
        password = data.get('password')
        
        # Create Django User if username and password are provided
        if username and password:
            # Check if username already exists
            if User.objects.filter(username=username).exists():
                return Response(
                    {"detail": "Username already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create Django User
            user = User.objects.create_user(
                username=username,
                password=password,
                email=data.get('email', ''),
                is_staff=False
            )
            
            # Link user to customer
            data['user'] = user.id
        
        # Create customer
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        customer = self.get_object()
        data = request.data.copy()
        username = data.get('username')
        password = data.get('password')
        
        # Handle login credentials update
        if username is not None:
            if username == '':
                # Remove login credentials
                if customer.user:
                    customer.user.delete()
                    customer.user = None
                    customer.username = None
            else:
                # Update or create login credentials
                if customer.user:
                    # Update existing user
                    if customer.user.username != username:
                        if User.objects.filter(username=username).exclude(id=customer.user.id).exists():
                            return Response(
                                {"detail": "Username already exists"},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        customer.user.username = username
                    
                    if password:
                        customer.user.set_password(password)
                    
                    customer.user.save()
                    customer.username = username
                else:
                    # Create new user
                    if User.objects.filter(username=username).exists():
                        return Response(
                            {"detail": "Username already exists"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    user = User.objects.create_user(
                        username=username,
                        password=password or 'defaultpassword123',  # Set a default if no password provided
                        email=data.get('email', ''),
                        is_staff=False
                    )
                    
                    customer.user = user
                    customer.username = username
        
        # Update other customer fields
        serializer = self.get_serializer(customer, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        customer = self.get_object()
        force_delete = request.query_params.get("force", "false").lower() == "true"

        if force_delete:
            # Delete related sales first so RESTRICT foreign key doesn't block customer removal.
            Sale.objects.filter(customer=customer).delete()
            customer.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        try:
            customer.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except RestrictedError:
            return Response(
                {
                    "detail": "This customer has sales records. Delete with force=true to remove customer and related sales."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

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

class UnpaidAmountViewSet(viewsets.ModelViewSet):
    queryset = UnpaidAmount.objects.all()
    serializer_class = UnpaidAmountSerializer

    def get_queryset(self):
        # Filter by customer if customer_id is provided
        customer_id = self.request.GET.get('customer_id')
        if customer_id:
            return UnpaidAmount.objects.filter(customer_id=customer_id)
        return super().get_queryset()

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


def _user_role(user):
    admin_usernames = [
        x.strip()
        for x in os.environ.get("ADMIN_USERNAMES", "").split(",")
        if x.strip()
    ]
    if user.is_staff or user.is_superuser or user.username in admin_usernames:
        return "admin"
    return "customer"


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    """
    Create a new customer account (Django User + store Customer + profile) and return an auth token.
    """
    payload = request.data or {}
    username = (payload.get("username") or "").strip()
    email = (payload.get("email") or "").strip()
    password = payload.get("password") or ""
    name = (payload.get("name") or username or "").strip()
    phone = (payload.get("phone") or "").strip()
    address = (payload.get("address") or "").strip()

    if not username or not email or not password:
        return Response({"detail": "username, email, and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"detail": "username already exists"}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({"detail": "email already exists"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)

    customer = Customer.objects.create(
        name=name,
        phone=phone,
        email=email,
        address=address,
    )
    CustomerProfile.objects.create(user=user, customer=customer)

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            "token": token.key,
            "role": _user_role(user),
            "user": {"id": user.id, "username": user.username, "email": user.email},
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    payload = request.data or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    user = authenticate(username=username, password=password)
    if not user:
        return Response({"detail": "Invalid username or password"}, status=status.HTTP_400_BAD_REQUEST)
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            "token": token.key,
            "role": _user_role(user),
            "user": {"id": user.id, "username": user.username, "email": user.email},
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"detail": "logged out"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    data = {
        "role": _user_role(user),
        "user": {"id": user.id, "username": user.username, "email": user.email},
    }
    if hasattr(user, "customer_profile") and user.customer_profile.customer_id:
        data["customer_id"] = user.customer_profile.customer_id
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_sales(request):
    """
    Customer portal: returns sales for the logged-in customer only.
    """
    user = request.user
    if not hasattr(user, "customer") or not user.customer:
        return Response({"detail": "No customer account linked to this user."}, status=status.HTTP_400_BAD_REQUEST)
    sales = (
        Sale.objects.filter(customer=user.customer)
        .prefetch_related("items", "payments")
        .order_by("-date")
    )
    return Response(SaleSerializer(sales, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_unpaid(request):
    """
    Customer portal: returns unpaid amounts for the logged-in customer.
    Includes both sales unpaid amounts and tracked previous unpaid amounts.
    """
    user = request.user
    if not hasattr(user, "customer") or not user.customer:
        return Response({"detail": "No customer account linked to this user."}, status=status.HTTP_400_BAD_REQUEST)
    
    customer = user.customer
    
    # Calculate sales unpaid amount
    sales = Sale.objects.filter(customer=customer)
    total_sales = sales.aggregate(total=Sum('totalAmount'))['total'] or 0
    total_paid = sales.aggregate(paid=Sum('paidAmount'))['paid'] or 0
    sales_unpaid = total_sales - total_paid
    
    # Calculate tracked unpaid amounts from UnpaidAmount model
    unpaid_amounts = UnpaidAmount.objects.filter(customer=customer)
    tracked_unpaid = unpaid_amounts.aggregate(total=Sum('amount'))['total'] or 0
    
    total_unpaid = sales_unpaid + tracked_unpaid
    
    return Response({
        "sales_unpaid": sales_unpaid,
        "tracked_unpaid": tracked_unpaid,
        "total_unpaid": total_unpaid,
        "sales_total": total_sales,
        "sales_paid": total_paid,
        "unpaid_amounts": UnpaidAmountSerializer(unpaid_amounts, many=True).data
    })
