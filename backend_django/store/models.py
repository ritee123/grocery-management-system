from django.db import models
from django.utils import timezone
import uuid
from django.conf import settings

class Customer(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.CharField(max_length=255, blank=True, default='')
    address = models.TextField(blank=True, default='')
    username = models.CharField(max_length=150, blank=True, null=True, unique=True)
    user = models.OneToOneField('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='customer')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'customers'

    def __str__(self):
        return self.name

class Product(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=100, blank=True, default='')
    stock_quantity = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=0)

    class Meta:
        db_table = 'products'

    def __str__(self):
        return self.name

class Sale(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('online', 'Online'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('unpaid', 'Unpaid'),
        ('partial', 'Partial'),
    ]

    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.RESTRICT, related_name='sales')
    customer_name = models.CharField(max_length=255)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES)
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'sales'
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"Sale {self.id}"

class SaleItem(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False)
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'sale_items'
        indexes = [
            models.Index(fields=['sale']),
        ]

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('online', 'Online'),
    ]

    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False)
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'payments'
        indexes = [
            models.Index(fields=['sale']),
        ]

    def __str__(self):
        return f"Payment {self.amount}"

class Expense(models.Model):
    EXPENSE_CATEGORY_CHOICES = [
        ('fixed', 'Fixed'),
        ('operational', 'Operational'),
        ('variable', 'Variable'),
    ]

    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False)
    category = models.CharField(max_length=20, choices=EXPENSE_CATEGORY_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField()
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'expenses'

    def __str__(self):
        return f"{self.category} - {self.description}"


class CustomerProfile(models.Model):
    """
    Links a Django auth user to a store Customer record for the customer portal.
    Admin users are determined via is_staff / is_superuser and may not need a profile.
    """

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer_profile")
    customer = models.OneToOneField(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="profile")

    class Meta:
        db_table = "customer_profiles"

    def __str__(self):
        return f"Profile({self.user_id})"
