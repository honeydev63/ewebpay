import datetime
from django.db.models import FloatField
from django.db.models import Q, Sum
from rest_framework import serializers

from app.models import Product, MyUser, SalesOrder, Customer, BankDetail, CardDetail, Incentive, AgentIncentive, \
    Attendance, AgentQaReasons, Merchant


class ProductListingSerializer(serializers.ModelSerializer):
    serial = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('serial', 'product_id', 'product_name', 'product_type', 'price')

    def get_serial(self, ob):
        self.context['serial'] += 1
        serial1 = self.context['serial']
        return serial1


class ProductDetailSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = ('product_id', 'product_name', 'product_type', 'price')


class IncentiveAgentDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incentive
        fields = ('id', 'name', 'type', 'target_amount')


class IncentiveAgent1ListingSerializer(serializers.ModelSerializer):
    incentive = IncentiveAgentDetailSerializer()

    class Meta:
        model = AgentIncentive
        fields = ('id', 'incentive')


class MyUserListingSerializer(serializers.ModelSerializer):
    incentive_data = serializers.SerializerMethodField()
    revenue = serializers.SerializerMethodField()
    is_present = serializers.SerializerMethodField()

    class Meta:
        model = MyUser
        fields = ('agent_id', 'agent_name', 'mobile', 'email', 'incentive_data', 'revenue', 'is_present')

    def get_incentive_data(self, ob):
        incentive_obj = ob.agent_incentive.filter(Q(is_active=True) & Q(end_timestamp__gte=datetime.datetime.now()))
        data_obj1 = IncentiveAgent1ListingSerializer(incentive_obj, many=True)
        return data_obj1.data

    def get_revenue(self, ob):
        total_revenue = SalesOrder.objects.filter(agent=ob.agent_id).aggregate(sum=Sum('total_price', output_field=FloatField()))
        return total_revenue['sum']

    def get_is_present(self, ob):
        try:
            Attendance.objects.get(Q(agent=ob.agent_id) & Q(clock_in__date=datetime.date.today()))
            return True
        except Attendance.DoesNotExist:
            return False


class PasswordResetSerializer(serializers.ModelSerializer):

    class Meta:
        model = MyUser
        fields = ('agent_id', 'agent_name', 'mobile', 'email')


class OrderListingSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    first_name = serializers.SerializerMethodField()

    class Meta:
        model = SalesOrder
        fields = ('id', 'agent_name', 'total_price', 'first_name', 'is_card_payment', 'is_bank_payment',
                  'qa_orderstatus')

    def get_agent_name(self, ob):
        return ob.agent.agent_name

    def get_first_name(self, ob):
        return ob.customer.first_name


class MarkedOrderListingSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    first_name = serializers.SerializerMethodField()

    class Meta:
        model = SalesOrder
        fields = ('id', 'agent_name', 'total_price', 'first_name', 'is_card_payment', 'is_bank_payment',
                  'qa_orderstatus', 'qa_reason', 'qa_status_updated_timestamp')

    def get_agent_name(self, ob):
        return ob.agent.agent_name

    def get_first_name(self, ob):
        return ob.customer.first_name


class QaOrderListingSerializer(serializers.ModelSerializer):
    qa_agent_name = serializers.SerializerMethodField()
    first_name = serializers.SerializerMethodField()

    class Meta:
        model = SalesOrder
        fields = ('id', 'qa_agent_name', 'total_price', 'first_name', 'is_card_payment', 'is_bank_payment',
                  'qa_orderstatus', 'agent_updated_status')

    def get_qa_agent_name(self, ob):
        if ob.qa_agent:
            return ob.qa_agent.agent_name
        else:
            return None

    def get_first_name(self, ob):
        return ob.customer.first_name


class WorkOrderListingSerializer(serializers.ModelSerializer):
    customer_id = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = SalesOrder
        fields = ('id', 'customer_id', 'customer_name', 'work_order_status')

    def get_customer_id(self, ob):
        return ob.customer.id

    def get_customer_name(self, ob):
        return ob.customer.first_name


class CardDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardDetail
        fields = '__all__'


class IncentiveListingSerializer(serializers.ModelSerializer):
    agent_count = serializers.SerializerMethodField()

    class Meta:
        model = Incentive
        fields = ('id', 'name', 'type', 'target_amount', 'agent_count')

    def get_agent_count(self, ob):
        count = AgentIncentive.objects.filter(Q(incentive=ob.id) & Q(end_timestamp__gte=datetime.datetime.now()) & Q(is_active=True)).count()
        return count


class IncentiveAgentListingSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    incentive_name = serializers.SerializerMethodField()
    target_amount = serializers.SerializerMethodField()

    class Meta:
        model = AgentIncentive
        fields = ('id', 'end_timestamp', 'agent_name', 'target_amount', 'incentive_name')

    def get_agent_name(self, ob):
        return ob.agent.agent_name

    def get_incentive_name(self, ob):
        return ob.incentive.name

    def get_target_amount(self, ob):
        return ob.incentive.target_amount


class IncentiveDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incentive
        fields = '__all__'


class IncentiveAgentDetailSerializer(serializers.ModelSerializer):
    agent = MyUserListingSerializer()
    incentive = IncentiveDetailSerializer()
    
    class Meta:
        model = AgentIncentive
        fields = '__all__'


class BankDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankDetail
        fields = '__all__'


class OrderDetailSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    qa_agent_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = SalesOrder
        fields = '__all__'

    def get_agent_name(self, ob):
        return ob.agent.agent_name

    def get_qa_agent_name(self, ob):
        if ob.qa_agent:
            return ob.qa_agent.agent_name
        else:
            return None

    def get_customer_name(self, ob):
        if ob.customer.first_name:
            return ob.customer.first_name
        else:
            return ob.customer.customer_name


class AgentQareasonSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = AgentQaReasons
        fields = ('name', 'orderstatus', 'reason', 'created_time')

    def get_name(self, ob):
        return ob.agent.agent_name


class AgentOrderDetailSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    previous_reasons = serializers.SerializerMethodField()

    class Meta:
        model = SalesOrder
        fields = ('id', 'agent_name', 'mobile', 'email', 'total_price', 'is_card_payment', 'is_bank_payment',
                  'created_timestamp', 'qa_orderstatus', 'qa_reason', 'qa_status_updated_timestamp',
                  'agent_updated_status', 'agent_reason', 'agent_status_updated_timestamp', 'previous_reasons')

    def get_agent_name(self, ob):
        return ob.agent.agent_name

    def get_previous_reasons(self, ob):
        data_obj = AgentQaReasons.objects.filter(order=ob.id)
        serializer = AgentQareasonSerializer(data_obj, many=True)
        return serializer.data


class DraftOrderDetailSerializer(serializers.ModelSerializer):
    first_name = serializers.SerializerMethodField()

    class Meta:
        model = SalesOrder
        fields = ('mobile', 'email', 'id', 'first_name', 'total_price', 'is_card_payment', 'is_bank_payment')

    def get_first_name(self, ob):
        return ob.customer.first_name


class CustomerListingSerializer(serializers.ModelSerializer):
    first_name = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ('id', 'type', 'first_name', 'mobile', 'email', 'is_card_payment', 'is_bank_payment')

    def get_first_name(self, ob):
        if ob.first_name:
            return ob.first_name
        else:
            return ob.customer_name



class CustomerDetailSerializer(serializers.ModelSerializer):
    orders = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = '__all__'

    def get_orders(self, ob):
        order_obj = ob.order_customer.all()
        serializer = OrderDetailSerializer(order_obj, many=True)
        return serializer.data


class CustomerSearchSerializer(serializers.ModelSerializer):

    class Meta:
        model = Customer
        # fields = '__all__'
        exclude = ('agent', 'is_mobile_verified', 'is_email_verified', 'is_anyone_verified', 'code',
                   'created_timestamp', 'is_active')


class CustomerAllListingSerializer(serializers.ModelSerializer):

    class Meta:
        model = Customer
        fields = ('id', 'first_name')


class ProductAllDetailSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = ('product_id', 'product_name', 'product_type', 'price')

class MerchantAllListingSerializer(serializers.ModelSerializer):

    class Meta:
        model = Merchant
        fields = ('id', 'legal_entity_name', 'merchant_id','email', 'mobile', 'descriptor')


class AgentAllListingSerializer(serializers.ModelSerializer):

    class Meta:
        model = MyUser
        fields = ('agent_id', 'agent_name')


class IncentiveAllListingSerializer(serializers.ModelSerializer):

    class Meta:
        model = Incentive
        fields = ('id', 'name', 'type', 'target_amount')


class QaUserListingSerializer(serializers.ModelSerializer):
    is_present = serializers.SerializerMethodField()

    class Meta:
        model = MyUser
        fields = ('agent_id', 'agent_name', 'mobile', 'email', 'is_present')

    def get_is_present(self, ob):
        try:
            Attendance.objects.get(Q(agent=ob.agent_id) & Q(clock_in__date=datetime.date.today()))
            return True
        except Attendance.DoesNotExist:
            return False
