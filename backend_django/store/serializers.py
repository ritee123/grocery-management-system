from rest_framework import serializers
from .models import Customer, Product, Sale, SaleItem, Payment, Expense, UnpaidAmount

class CustomerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ('user',)  # Make user field read-only as it's managed in the viewset

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class SaleItemSerializer(serializers.ModelSerializer):
    product_id = serializers.CharField(source='product.id', read_only=True)
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = SaleItem
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class SaleSerializer(serializers.ModelSerializer):
    customer_id = serializers.CharField(source='customer.id', read_only=True)
    items = SaleItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Sale
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

class UnpaidAmountSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnpaidAmount
        fields = '__all__'