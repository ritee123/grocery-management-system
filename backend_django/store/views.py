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
from .models import Customer, Product, Sale, SaleItem, Payment, Expense, CustomerProfile
from .serializers import (
    CustomerSerializer, ProductSerializer, SaleSerializer,
    SaleItemSerializer, PaymentSerializer, ExpenseSerializer
)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

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
    if not hasattr(user, "customer_profile") or not user.customer_profile.customer_id:
        return Response({"detail": "No customer profile linked to this user."}, status=status.HTTP_400_BAD_REQUEST)
    sales = (
        Sale.objects.filter(customer_id=user.customer_profile.customer_id)
        .prefetch_related("items", "payments")
        .order_by("-date")
    )
    return Response(SaleSerializer(sales, many=True).data)
