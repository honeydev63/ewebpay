import os, jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin
)
import uuid
from uuid import UUID
import enum

from django.db.models.signals import pre_delete
from django.dispatch import receiver


class Permission(enum.Enum):
    admin = 1001
    agent = 1002
    QA = 1003
    merchant = 1004


class UserManager(BaseUserManager):
    def create_user(self, password, email, mobile, agent_name=None):

        if mobile is None:
            raise TypeError('User must have a Mobile')

        if email is None:
            raise TypeError('User must have an email address.')

        user = self.model(agent_name=agent_name, email=self.normalize_email(email), mobile=mobile)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, password, email, mobile, last_name=None, agent_name=None, agent_id=None):

        user = self.model(agent_name=agent_name, email=self.normalize_email(email), mobile=mobile,
                          agent_id=agent_id)
        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.is_active = True
        user.save()

        return user


class MyUser(AbstractBaseUser, PermissionsMixin):
    agent_id = models.AutoField(primary_key=True)
    password = models.CharField(max_length=128)
    agent_name = models.CharField(max_length=255, blank=True)
    country_code = models.CharField(max_length=10, blank=True)
    mobile = models.CharField(max_length=20, blank=True)
    email = models.EmailField(db_index=True, unique=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_confirmed = models.BooleanField(default=False)
    is_used = models.BooleanField(default=False)
    signup_date = models.DateField(auto_now_add=True)
    jwt_secret = models.UUIDField(default=uuid.uuid4)
    last_login = models.DateTimeField(blank=True, null=True)
    is_agent = models.BooleanField(default=False)
    is_qa_agent = models.BooleanField(default=False)
    is_merchant = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['mobile', 'agent_name']

    objects = UserManager()

    def __str__(self):
        return "{}".format(self.agent_id)

    def __agent_id__(self):
        return self.agent_id

    class Meta:
        db_table = 'MyUser'
        managed = True

    @property
    def token(self):
        return self._generate_jwt_token()

    def _generate_jwt_token(self):
        dt = datetime.now() + timedelta(days=60)

        token = jwt.encode({
            'id': self.pk,
            'exp': int(dt.strftime('%s'))
        }, settings.SECRET_KEY, algorithm='HS256')

        return token.decode('utf-8')


class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    product_name = models.CharField(max_length=100)
    product_type = models.CharField(max_length=100)
    price = models.FloatField()
    created_timestamp = models.DateTimeField(auto_now_add=True, null=True)
    last_updated = models.DateTimeField(auto_now=True, null=True)
    created_by = models.ForeignKey(MyUser, on_delete=models.DO_NOTHING, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'product'
        managed = True


class ProductUpdateHistory(models.Model):
    product_id = models.ForeignKey(Product, on_delete=models.DO_NOTHING)
    update_time = models.DateTimeField(auto_now_add=True)
    updated_by = models.ForeignKey(MyUser, on_delete=1)
    currency = models.CharField(max_length=100, null=True, blank=True)
    updated_price = models.FloatField()

    class Meta:
        db_table = 'product_update_history'
        managed = True


class Customer(models.Model):
    id = models.AutoField(primary_key=True)
    type = models.TextField(blank=True, null=True)
    company_name = models.TextField(blank=True, null=True)
    customer_name = models.TextField(blank=True, null=True)
    account_number = models.TextField(blank=True, null=True)
    routing_number = models.TextField(blank=True, null=True)
    bank_name = models.TextField(blank=True, null=True)
    card_number = models.TextField(blank=True, null=True)
    expiry_date = models.TextField(blank=True, null=True)
    cvv = models.TextField(blank=True, null=True)
    first_name = models.TextField(blank=True, null=True)
    last_name = models.TextField(blank=True, null=True)
    mobile = models.TextField(null=True, blank=True)
    email = models.TextField(blank=True, null=True)
    address1 = models.TextField(blank=True, null=True)
    address2 = models.TextField(blank=True, null=True)
    country = models.TextField(blank=True, null=True)
    state = models.TextField(blank=True, null=True)
    city = models.TextField(blank=True, null=True)
    zip_code = models.TextField(blank=True, null=True)
    s_mobile = models.TextField(blank=True, null=True)
    s_email = models.TextField(blank=True, null=True)
    s_address1 = models.TextField(blank=True, null=True)
    s_address2 = models.TextField(blank=True, null=True)
    s_country = models.TextField(blank=True, null=True)
    s_state = models.TextField(blank=True, null=True)
    s_city = models.TextField(blank=True, null=True)
    s_zip_code = models.TextField(blank=True, null=True)
    is_card_payment = models.BooleanField(default=False)
    is_bank_payment = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_timestamp = models.DateTimeField(auto_now_add=True)
    agent = models.ForeignKey(MyUser, models.DO_NOTHING, blank=True, null=True, db_column='agent')
    is_mobile_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    is_anyone_verified = models.BooleanField(default=False)
    code = models.TextField(blank=True, null=True)
    verified_timestamp = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'app_customer'


class SalesOrder(models.Model):
    qa_choices = (
        ('not_verified', 'Not Verified'),
        ('verified', 'Verified'),
        ('fraud', 'Fraud'),
        ('suspicious', 'Suspicious'),
        ('other', 'Other'),
    )
    agent_choices = (
        ('resolved', 'Resolved'),
        ('not_resolved', 'Not Resolved'),
    )
    work_order_choices = (
        ('doc_sent', 'Doc Sent'),
        ('signed', 'signed'),
        ('re_sent', 'Re Sent'),
        ('not_required', 'Not Required'),
        ('other', 'Other'),
    )
    id = models.AutoField(primary_key=True)
    type_value = models.TextField(blank=True, null=True)
    mobile = models.TextField(blank=True, null=True)
    email = models.TextField(blank=True, null=True)
    total_price = models.FloatField(blank=True, null=True)
    is_card_payment = models.BooleanField(default=False)
    is_bank_payment = models.BooleanField(default=False)
    created_timestamp = models.DateTimeField(auto_now_add=True)
    agent = models.ForeignKey(MyUser, models.DO_NOTHING, blank=True, null=True, )
    customer = models.ForeignKey(Customer, models.DO_NOTHING, db_column='customer', blank=True, null=True, related_name='order_customer')
    address1 = models.TextField(blank=True, null=True)
    address2 = models.TextField(blank=True, null=True)
    country = models.TextField(blank=True, null=True)
    state = models.TextField(blank=True, null=True)
    city = models.TextField(blank=True, null=True)
    zip_code = models.TextField(blank=True, null=True)
    s_address1 = models.TextField(blank=True, null=True)
    s_address2 = models.TextField(blank=True, null=True)
    s_country = models.TextField(blank=True, null=True)
    s_state = models.TextField(blank=True, null=True)
    s_city = models.TextField(blank=True, null=True)
    s_zip_code = models.TextField(blank=True, null=True)
    product_id = models.IntegerField(blank=True, null=True)
    product_name = models.CharField(max_length=100)
    quantity = models.IntegerField(blank=True, null=True)
    unit_price = models.FloatField(blank=True, null=True)
    card_number = models.TextField(blank=True, null=True)
    expiry_date = models.TextField(blank=True, null=True)
    cvv = models.TextField(blank=True, null=True)
    account_number = models.TextField(blank=True, null=True)
    routing_number = models.TextField(blank=True, null=True)
    bank_name = models.TextField(blank=True, null=True)
    is_draft = models.BooleanField(default=True)
    verified_timestamp = models.DateTimeField(null=True, blank=True)
    work_order_status = models.TextField(default="doc_sent", choices=work_order_choices)
    qa_agent = models.ForeignKey(MyUser, models.DO_NOTHING, blank=True, null=True, related_name="qa_agent_order")
    qa_orderstatus = models.TextField(default='not_verified', choices=qa_choices)
    qa_reason = models.TextField(null=True, blank=True)
    qa_status_updated_timestamp = models.DateTimeField(null=True, blank=True)
    agent_updated_status = models.TextField(default='not_resolved', choices=agent_choices, null=True, blank=True)
    agent_reason = models.TextField(null=True, blank=True)
    agent_status_updated_timestamp = models.DateTimeField(null=True, blank=True)
    ip_address = models.TextField(blank=True, null=True)
    browser = models.TextField(blank=True, null=True)
    latitude = models.TextField(blank=True, null=True)
    longitude = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'sales_order'


class CardDetail(models.Model):
    id = models.AutoField(primary_key=True)
    first_name = models.TextField(blank=True, null=True)
    last_name = models.TextField(blank=True, null=True)
    s_mobile = models.TextField(blank=True, null=True)
    s_email = models.TextField(blank=True, null=True)
    s_address1 = models.TextField(blank=True, null=True)
    s_address2 = models.TextField(blank=True, null=True)
    s_country = models.TextField(blank=True, null=True)
    s_state = models.TextField(blank=True, null=True)
    s_city = models.TextField(blank=True, null=True)
    s_zip_code = models.TextField(blank=True, null=True)
    product_id = models.IntegerField(blank=True, null=True)
    product_name = models.CharField(max_length=100)
    quantity = models.IntegerField(blank=True, null=True)
    unit_price = models.FloatField(blank=True, null=True)
    card_number = models.TextField(blank=True, null=True)
    expiry_date = models.TextField(blank=True, null=True)
    cvv = models.TextField(blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    agent = models.ForeignKey(MyUser, models.DO_NOTHING, blank=True, null=True)
    order = models.ForeignKey(SalesOrder, models.DO_NOTHING, db_column='order', blank=True, null=True, related_name='order_card')
    created_timestamp = models.DateTimeField(auto_now_add=True)
    is_draft = models.BooleanField(default=True)

    class Meta:
        managed = True
        db_table = 'card_detail'


class BankDetail(models.Model):
    id = models.AutoField(primary_key=True)
    type = models.TextField(blank=True, null=True)
    company_name = models.TextField(blank=True, null=True)
    customer_name = models.TextField(blank=True, null=True)
    account_number = models.TextField(blank=True, null=True)
    routing_number = models.TextField(blank=True, null=True)
    bank_name = models.TextField(blank=True, null=True)
    email = models.TextField(blank=True, null=True)
    amount = models.FloatField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    agent = models.ForeignKey(MyUser, models.DO_NOTHING, blank=True, null=True)
    order = models.ForeignKey(SalesOrder, models.DO_NOTHING, db_column='order', blank=True, null=True, related_name='order_bank')
    created_timestamp = models.DateTimeField(auto_now_add=True)
    is_draft = models.BooleanField(default=True)

    class Meta:
        managed = True
        db_table = 'bank_detail'


class Incentive(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField(blank=True, null=True)
    type = models.CharField(max_length=20, blank=True, null=True)
    is_suspended = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    target_amount = models.IntegerField(blank=True, null=True)
    created_timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'incentive'


class AgentIncentive(models.Model):
    id = models.AutoField(primary_key=True)
    created_timestamp = models.DateTimeField(auto_now_add=True)
    end_timestamp = models.DateTimeField(null=True, blank=True)
    incentive = models.ForeignKey(Incentive, models.DO_NOTHING, blank=True, null=True)
    agent = models.ForeignKey(MyUser, models.DO_NOTHING, blank=True, null=True, related_name="agent_incentive")
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = True
        db_table = 'agent_incentive'


class Otp(models.Model):
    otp_id = models.AutoField(primary_key=True)
    input = models.TextField(blank=True, null=True)
    request_id = models.TextField(blank=True, null=True)
    service_id = models.TextField(blank=True, null=True)
    created_time = models.DateTimeField(auto_now_add=True)
    expiry_time = models.DateTimeField()
    otp = models.IntegerField(blank=True, null=True)
    attempts = models.IntegerField(default=0)
    input2 = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'otp'


class Attendance(models.Model):
    id = models.AutoField(primary_key=True)
    clock_in = models.DateTimeField(blank=True, null=True)
    clock_out = models.DateTimeField(blank=True, null=True)
    agent = models.ForeignKey(MyUser, models.DO_NOTHING, blank=True, null=True, related_name="agent_attendance")

    class Meta:
        managed = True
        db_table = 'attendance'


class AgentQaReasons(models.Model):
    status_choices = (
        ('not_verified', 'Not Verified'),
        ('verified', 'Verified'),
        ('fraud', 'Fraud'),
        ('suspicious', 'Suspicious'),
        ('not_satisfied', 'Not Satisfied'),
        ('other', 'Other'),
        ('resolved', 'Resolved'),
        ('not_resolved', 'Not Resolved'),
        (None, None),
    )
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(SalesOrder, models.DO_NOTHING, db_column='order', blank=True, null=True)
    agent = models.ForeignKey(MyUser, models.DO_NOTHING, blank=True, null=True, )
    orderstatus = models.TextField(default=None, choices=status_choices, blank=True, null=True,)
    reason = models.TextField(null=True, blank=True)
    created_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'agent_qa_reason'


class UnProcessedOrder(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, unique=True)
    agent = models.ForeignKey(MyUser, models.DO_NOTHING, blank=True, null=True, )
    customer = models.ForeignKey(Customer, models.DO_NOTHING, db_column='customer', blank=True, null=True, related_name='un_processed_order_customer')
    product_id = models.IntegerField(blank=True, null=True)
    product_name = models.CharField(max_length=100)
    quantity = models.IntegerField(blank=True, null=True)
    unit_price = models.FloatField(blank=True, null=True)
    total_price = models.FloatField(blank=True, null=True)
    created_time = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    expiry_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'un_processed_order'

class DocusignMapping(models.Model):
    id = models.AutoField(primary_key=True)
    agent = models.ForeignKey(MyUser, models.DO_NOTHING)
    access_token = models.CharField(max_length=255)
    refresh_token = models.CharField(max_length=255)
    expires_in = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'docusign_mapping'

class Merchant(models.Model):
    id = models.AutoField(primary_key=True)
    # agent = models.ForeignKey(MyUser, models.DO_NOTHING)
    legal_entity_name = models.CharField(max_length=255)
    address_line1 = models.CharField(max_length=255, blank=True, null=True)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    address_city = models.CharField(max_length=255, blank=True, null=True)
    address_state = models.CharField(max_length=255, blank=True, null=True)
    address_zipcode = models.CharField(max_length=10, blank=True, null=True)
    payment_gateway = models.CharField(max_length=255, blank=True, null=True)
    provider_name = models.CharField(max_length=255, blank=True, null=True)
    descriptor = models.CharField(max_length=255, blank=True, null=True)
    alias = models.CharField(max_length=255, blank=True, null=True)
    credential = models.CharField(max_length=255, blank=True, null=True)
    profile_id = models.CharField(max_length=50, blank=True, null=True)
    profile_key = models.CharField(max_length=255, blank=True, null=True)
    currency = models.CharField(max_length=50, blank=True, null=True)
    merchant_id = models.CharField(max_length=50, blank=True, null=True)
    limit_n_fees = models.CharField(max_length=255, blank=True, null=True)
    global_monthly_cap = models.CharField(max_length=255, blank=True, null=True)
    daily_cap = models.CharField(max_length=255, blank=True, null=True)
    weekly_cap = models.CharField(max_length=255, blank=True, null=True)
    account_details = models.CharField(max_length=255, blank=True, null=True)
    customer_service_email = models.CharField(max_length=255, blank=True, null=True)
    customer_service_email_from = models.CharField(max_length=255, blank=True, null=True)
    gateway_url = models.CharField(max_length=255, blank=True, null=True)
    transaction_fee = models.FloatField(blank=True, null=True)
    batch_fee = models.FloatField(blank=True, null=True)
    monthly_fee = models.FloatField(blank=True, null=True)
    chargeback_fee = models.FloatField(blank=True, null=True)
    refund_processing_fee = models.FloatField(blank=True, null=True)
    reserve_percentage = models.FloatField(blank=True, null=True)
    reserve_term_rolling = models.CharField(max_length=255, blank=True, null=True)
    reserve_term_days = models.CharField(max_length=255, blank=True, null=True)
    email = models.CharField(max_length=255, blank=True, null=True)
    mobile = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'merchant'
