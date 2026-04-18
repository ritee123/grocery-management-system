from django.contrib import admin

from .models import Customer, Expense, Payment, Product, Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "email", "created_at")
    search_fields = ("name", "phone", "email", "address")
    list_filter = ("created_at",)
    ordering = ("-created_at",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "category", "price", "stock_quantity", "reorder_level")
    search_fields = ("name", "sku", "category")
    list_filter = ("category",)
    ordering = ("name",)


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer_name",
        "total_amount",
        "paid_amount",
        "payment_method",
        "payment_status",
        "date",
    )
    search_fields = ("id", "customer_name", "customer__name")
    list_filter = ("payment_method", "payment_status", "date")
    ordering = ("-date",)
    inlines = [SaleItemInline, PaymentInline]


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ("sale", "product_name", "quantity", "unit_price", "subtotal")
    search_fields = ("product_name", "sale__id", "product__name")
    list_filter = ("product_name",)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("sale", "amount", "method", "date")
    search_fields = ("sale__id",)
    list_filter = ("method", "date")
    ordering = ("-date",)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("category", "amount", "description", "date")
    search_fields = ("description",)
    list_filter = ("category", "date")
    ordering = ("-date",)
