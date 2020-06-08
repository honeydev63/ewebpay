import datetime
import json
import logging
import math
import re
import sys
import time
import urllib.request
import urllib.parse
import jwt
import requests
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import send_mail
from django.db.models import Q
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.utils.datastructures import MultiValueDictKeyError
from django.utils.html import strip_tags
from rest_framework import status, generics, authentication
from rest_framework.exceptions import ParseError, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_jwt.settings import api_settings
from rest_framework_jwt.utils import jwt_get_secret_key

# change DB Table
from app.serializers import ProductListingSerializer, OrderListingSerializer, CustomerListingSerializer, \
    CustomerDetailSerializer, CustomerSearchSerializer, CustomerAllListingSerializer
from app.utilities import ErrorMessage, pagination, productsearch, ordersearch, orderfilter, customerlistingsearch, \
    customerdaterangefilter, agentfilter, sendotpsave, verifymobileotp, verifyemailotp, sendemailcustomer
from app.models import MyUser, Product, Permission, ProductUpdateHistory, SalesOrder, CardDetail, BankDetail, Customer
from app.permissions import SalesAgentValidation, AdminValidation, AgentAdminValidation
from e_checkout import constant_values
from e_checkout.constant_values import email_check1, regex_3


class Customerlisting(generics.ListAPIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def get_queryset(self):
        sorting_values = ['id', '-id', 'company_name', '-company_name', 'type', '-type', 'is_card_payment',
                          '-is_card_payment', 'is_bank_payment', '-is_bank_payment']

        current_page = int(self.request.query_params.get('currentPage', settings.DEFAULTPAGE))
        per_page = int(self.request.query_params.get('perPage', settings.DEFAULTPRODUCTSPERPGE))
        search = self.request.query_params.get('search')
        order = self.request.query_params.get('order') if self.request.query_params.get(
            'order') in sorting_values else '-id'
        from_date = self.request.query_params.get('from_date', None)
        end_date = self.request.query_params.get('end_date', None)

        pagination_dataset = pagination(current_page, per_page)
        start_index = pagination_dataset[0]
        end_index = pagination_dataset[1]
        if from_date and end_date:
            try:
                datetime.datetime.strptime(from_date, '%Y-%m-%d')
                datetime.datetime.strptime(end_date, '%Y-%m-%d')
            except ValueError:
                from_date = None
                end_date = None
        else:
            from_date = None
            end_date = None
        queryset = Customer.objects.all().filter(Q(is_active=True) & Q(is_anyone_verified=True) & customerlistingsearch(search)
                                                 & customerdaterangefilter(from_date, end_date)).order_by(order).distinct()
        count = len(queryset)
        return queryset[start_index: end_index if self.request.query_params.get(
            'perPage') else count], count, current_page, per_page

    def get(self, request, *args, **kwargs):
        try:
            data_obj, count, current_page, per_page = self.get_queryset()
            response_dict = {"currentPage": current_page, "perPage": per_page, "totalEntries": 0, "totalPages": 0}
            if count:
                if request.user.is_superuser:
                    serializer = CustomerListingSerializer(data_obj, many=True)
                else:
                    serializer = CustomerAllListingSerializer(data_obj, many=True)
                response_dict["totalEntries"] = count
                response_dict["totalPages"] = math.ceil(count / per_page)
                data = serializer.data
            else:
                data = []
            return Response({"data": data, "meta": response_dict}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError,
                ObjectDoesNotExist):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomerDelete(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def delete(self, request):
        try:
            customer_id = request.query_params.get('customer_id')
            try:
                customer_obj = Customer.objects.get(Q(id=customer_id) & Q(is_active=True))
            except Customer.DoesNotExist:
                raise ErrorMessage("Customer id is invalid")
            customer_obj.is_active = False
            customer_obj.save()
            return Response({"data": {"is_customer_deleted": True, 'message': 'Customer Deleted successfully'}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_customer_deleted": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomerDetail(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def get(self, request):
        try:
            customer_id = request.query_params.get('customer_id')
            try:
                customer_obj = Customer.objects.get(Q(id=customer_id) & Q(is_active=True))
            except Customer.DoesNotExist:
                raise ErrorMessage("Customer id is not valid")
            serializer = CustomerDetailSerializer(customer_obj, many=False)
            return Response({"data": {"is_customer_exist": True, 'customer': serializer.data}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_customer_exist": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomerEdit(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def post(self, request):
        try:
            customer_id = request.data['customer_id']
            try:
                customer_obj = Customer.objects.get(Q(id=customer_id) & Q(is_active=True))
            except Customer.DoesNotExist:
                raise ErrorMessage("Customer id is invalid")
            type1 = request.data.get('type')
            # types_list = ["Company", "Individual"]
            # if type1 and type1 not in types_list:
            #     raise ErrorMessage(f"Type must be {types_list}")
            customer_obj.type = type1
            customer_obj.company_name = request.data.get('company_name')
            customer_obj.customer_name = request.data.get('customer_name')
            customer_obj.account_number = request.data.get('account_number')
            routing_number = request.data.get('routing_number')
            if routing_number and len(str(routing_number)) > 9:
                raise ErrorMessage("Routing Number cannot be more 9 digits")
            if routing_number:
                try:
                    int(routing_number)
                except ValueError:
                    raise ErrorMessage("Routing number should be integer")
            customer_obj.routing_number_bank = routing_number
            customer_obj.bank_name_bank = request.data.get('bank_name')
            customer_obj.card_number = request.data.get('card_number')
            customer_obj.expiry_date = request.data.get('expiry_date')
            customer_obj.cvv = request.data.get('cvv')
            customer_obj.first_name = request.data.get('first_name')
            customer_obj.last_name = request.data.get('last_name')
            mobile = int(request.data['mobile'])
            if len(str(mobile)) != 10 or not regex_3(mobile):
                raise ErrorMessage("Mobile number must be 10 digits")
            try:
                customer_obj2 = Customer.objects.get(Q(mobile=mobile) & Q(is_active=True))
                if customer_obj2.id != customer_obj.id:
                    raise ErrorMessage("Mobile number is already registered with another customer")
            except Customer.DoesNotExist:
                pass
            customer_obj.mobile = mobile
            email = request.data.get('email')
            email_check = bool(re.search(r"^[\w\.\+\-]+\@[\w]+\.[a-z]{2,3}$", str(email)))
            if not email_check:
                raise ErrorMessage("Email is not valid")
            try:
                customer_obj2 = Customer.objects.get(Q(email=email) & Q(is_active=True))
                if customer_obj2.id != customer_obj.id:
                    raise ErrorMessage("Email is already Registered with another Customer kindly change the "
                                       "email to place the order")
            except Customer.DoesNotExist:
                pass
            customer_obj.email = email
            customer_obj.address1 = request.data.get('address1')
            customer_obj.is_card_payment = request.data.get('is_card_payment')
            customer_obj.is_bank_payment = request.data.get('is_bank_payment')
            customer_obj.address2 = request.data.get('address2')
            customer_obj.country = request.data.get('country')
            customer_obj.state = request.data.get('state')
            customer_obj.city = request.data.get('city')
            customer_obj.zip_code = request.data.get('zip_code')
            customer_obj.s_mobile = request.data.get('s_mobile')
            customer_obj.s_country_code = request.data.get('s_country_code')
            s_email = request.data.get('s_email')
            if s_email:
                email_check = bool(re.search(r"^[\w\.\+\-]+\@[\w]+\.[a-z]{2,3}$", str(email)))
                if not email_check:
                    raise ErrorMessage("Shipping Email is not valid")

            customer_obj.s_email = s_email
            customer_obj.s_address1 = request.data.get('s_address1')
            customer_obj.s_address2 = request.data.get('s_address2')
            customer_obj.s_country = request.data.get('s_country')
            customer_obj.s_state = request.data.get('s_state')
            customer_obj.s_city = request.data.get('s_city')
            customer_obj.s_zip_code = request.data.get('s_zip_code')
            customer_obj.save()
            return Response({"data": {"is_customer_updated": True, 'message': 'Customer Updated successfully'}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_customer_updated": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AllCustomerDetail1(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def get(self, request):
        try:
            customer_obj = Customer.objects.all().filter(Q(is_active=True) & Q(is_anyone_verified=True))
            serializer = CustomerAllListingSerializer(customer_obj, many=True)
            return Response({"data": {'customer': serializer.data}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AddCustomer(APIView):
    permission_classes = (IsAuthenticated, AdminValidation, )

    def post(self, request):
        try:
            # Mandatory
            mobile = int(request.data['mobile'])
            if len(str(mobile)) != 10 or not regex_3(mobile):
                raise ErrorMessage("Mobile Number must be valid 10 Digits")
            try:
                Customer.objects.get(Q(mobile=mobile) & Q(is_active=True))
                raise ErrorMessage("This mobile number Registered with us")
            except Customer.DoesNotExist:
                pass
            email = str(request.data['email']).strip()
            if not email_check1(email):
                raise ErrorMessage("Email is not Valid")
            address1 = str(request.data['address1']).strip()
            if len(address1) < 4 or len(address1) > 50:
                raise ErrorMessage("address1 should be minimum 4 and maximum 50 characters")
            country = str(request.data['country']).strip()
            if len(country) < 4 or len(country) > 15:
                raise ErrorMessage("Country should be minimum 4 and maximum 15 characters")
            state = str(request.data['state']).strip()
            if len(state) < 4 or len(state) > 15:
                raise ErrorMessage("State should be minimum 4 and maximum 15 characters")
            city = str(request.data['city']).strip()
            if len(city) < 4 or len(city) > 15:
                raise ErrorMessage("City should be minimum 4 and maximum 15 characters")
            zip_code = int(request.data['zip_code'])
            if len(str(zip_code)) != 5:
                raise ErrorMessage("Please Provide valid 5 digit Zip Code")

            boolean_values = [True, False]
            is_card_payment = request.data['is_card_payment']
            if is_card_payment not in boolean_values:
                raise ErrorMessage("Is Card Payment must be True or False")
            is_bank_payment = request.data['is_bank_payment']
            if is_bank_payment not in boolean_values:
                raise ErrorMessage("Is Bank Payment must be True or False")
            if is_card_payment:
                first_name = str(request.data['first_name']).strip()
                if len(first_name) < 4 or len(first_name) > 100:
                    raise ErrorMessage("First Name should be minimum 3 characters and maximum 100 characters")
                s_mobile = int(request.data['s_mobile']) if request.data.get('s_mobile') else None
                if s_mobile and len(str(s_mobile)) != 10:
                    raise ErrorMessage("Shipping Mobile is not Valid")
                s_email = str(request.data['s_email']).strip() if request.data.get('s_email') else None
                if s_email and not email_check1(s_email):
                    raise ErrorMessage("Shipping Email is not Valid")
                s_address1 = str(request.data['s_address1']).strip()
                if len(str(s_address1)) < 3 or len(s_address1) > 50:
                    raise ErrorMessage("Shipping address 1 should be minimum 3 and maximum 50 characters")
                s_country = str(request.data['s_country']).strip()
                if len(s_country) < 3 or len(s_country) > 15:
                    raise ErrorMessage("Shipping Country should be minimum 3 and maximum 15 characters")
                s_state = str(request.data['s_state']).strip()
                if len(s_state) < 3 or len(s_state) > 15:
                    raise ErrorMessage("City should be minimum 3 and maximum 15 characters")
                s_city = str(request.data['s_city']).strip()
                if len(s_city) < 3 or len(s_city) > 15:
                    raise ErrorMessage("Shipping City should be minimum 3 and maximum 15 characters")
                s_zip_code = str(request.data['s_zip_code']).strip()
                if len(str(s_zip_code)) != 5:
                    raise ErrorMessage("Shipping Zip Code must be valid 5 Digits")

                card_number = str(request.data['card_number']).strip()
                expiry_date = str(request.data['expiry_date']).strip()
                cvv = int(request.data['cvv'])

                customer_obj = Customer.objects.create(mobile=mobile, email=email, address1=address1, country=country,
                                                       state=state, city=city, zip_code=zip_code, first_name=first_name,
                                                       s_mobile=s_mobile, s_email=s_email, s_address1=s_address1,
                                                       s_country=s_country, s_state=s_state, s_city=s_city,
                                                       s_zip_code=s_zip_code, card_number=card_number,
                                                       expiry_date=expiry_date, cvv=cvv, is_card_payment=True)
            elif is_bank_payment:
                customer_name = str(request.data['customer_name']).strip()
                if len(customer_name) < 4 or len(customer_name) > 15:
                    raise ErrorMessage("Customer Name should be minimum 4 and maximum 15 characters")
                type1 = str(request.data['type']).strip()
                types_list = ["Company", "Individual"]
                if type1 not in types_list:
                    raise ErrorMessage("Type must be Individual or Company")
                account_number = int(request.data['account_number'])
                if len(str(account_number)) < 6:
                    raise ErrorMessage("Account Number should be minimum 6 Digits")
                routing_number = int(request.data['routing_number'])
                if len(str(routing_number)) > 9:
                    raise ErrorMessage("Routing number cannot be more than 9")
                bank_name = str(request.data['bank_name']).strip()
                if len(bank_name) < 4 or len(bank_name) > 15:
                    raise ErrorMessage("Bank Name should be minimum 4 and maximum 15 characters")

                customer_obj = Customer.objects.create(mobile=mobile, email=email, address1=address1, country=country,
                                                       state=state, city=city, zip_code=zip_code,
                                                       customer_name=customer_name, type=type1, first_name=customer_name,
                                                       account_number=account_number, routing_number=routing_number,
                                                       bank_name=bank_name, is_bank_payment=True)
            else:
                customer_obj = Customer.objects.create(mobile=mobile, email=email, address1=address1, country=country,
                                                       state=state, city=city, zip_code=zip_code)

            # Non Mandatory
            customer_obj.agent = request.user
            customer_obj.last_name = str(request.data['last_name']).strip() if request.data.get('last_name') else None
            customer_obj.address2 = str(request.data['address2']).strip() if request.data.get('address2') else None
            customer_obj.s_address2 = str(request.data['s_address2']).strip() if request.data.get('s_address2') else None
            customer_obj.comment = request.query_params.get('comment', "").strip()
            customer_obj.company_name = str(request.data['company_name']).strip() if request.data.get('company_name') else None
            customer_obj.description = str(request.data['description']).strip() if request.data.get('description') else None
            customer_obj.save()

            return Response({"data": {"is_customer_created": True, "customer_id": customer_obj.id,
                                      'message': 'Customer Created Successfully'}}, status=status.HTTP_201_CREATED)
        except ErrorMessage as e:
            return Response({"data": {"is_customer_created": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomerCreate(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            mobile = int(request.data['mobile'])
            email = request.data['email']
            if len(str(mobile)) != 10:
                raise ErrorMessage("Provide Valid Mobile Number")
            url = f'https://api.kickbox.com/v2/verify?email={email}&apikey={constant_values.KICKBOX_KEY}'
            email_verification = requests.get(url=url)
            if email_verification.json()['result'] != 'deliverable':
                raise ErrorMessage("Email is Not Valid")
            try:
                Customer.objects.get(mobile=mobile)
                raise ErrorMessage("Mobile Number is Already Registered with Other Customer")
            except Customer.DoesNotExist:
                try:
                    Customer.objects.get(email=email)
                    raise ErrorMessage("Email Number is Already Registered with Other Customer")
                except Customer.DoesNotExist:
                    pass

            sendotpsave(mobile, email)

            return Response({"data": {"is_otp_sent": True, 'message': 'OTP Sent Successfully'}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_otp_sent": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomerCreateVerification(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation, )

    def post(self, request):
        try:
            first_name = request.data['first_name']
            mobile_otp = request.data.get('mobile_otp')
            email_otp = request.data.get('email_otp')

            mobile = int(request.data['mobile'])
            email = request.data['email']
            try:
                MyUser.objects.get(mobile=mobile)
                raise ErrorMessage("Mobile Number is Already Registered with Other Customer")
            except MyUser.DoesNotExist:
                try:
                    MyUser.objects.get(email=email)
                    raise ErrorMessage("Email Number is Already Registered with Other Customer")
                except MyUser.DoesNotExist:
                    pass

            url = f'https://api.kickbox.com/v2/verify?email={email}&apikey={constant_values.KICKBOX_KEY}'
            email_verification = requests.get(url=url)
            if email_verification.json()['result'] != 'deliverable':
                raise ErrorMessage("Email is Not Valid")

            if mobile_otp and email_otp:
                verify_mobile = verifymobileotp(mobile, mobile_otp)
                verify_email = verifyemailotp(email, email_otp)
                if verify_mobile['status'] and verify_email['status']:
                    customer_obj = Customer.objects.create(first_name=first_name, mobile=mobile, email=email)
                    customer_obj.is_mobile_verified = True
                    customer_obj.is_email_verified = True
                elif not verify_mobile['status']:
                    raise ErrorMessage(verify_mobile['message'])
                elif not verify_email['status']:
                    raise ErrorMessage(verify_email['message'])

            elif mobile_otp:
                verify_mobile = verifyemailotp(mobile, mobile_otp)
                if verify_mobile['status']:
                    customer_obj = Customer.objects.create(first_name=first_name, mobile=mobile, email=email)
                    customer_obj.is_mobile_verified = True
                else:
                    raise ErrorMessage(verify_mobile['message'])

            elif email_otp:
                verify_email = verifyemailotp(email, email_otp)
                if verify_email['status']:
                    customer_obj = Customer.objects.create(first_name=first_name, mobile=mobile, email=email)
                    customer_obj.is_email_verified = True
                else:
                    raise ErrorMessage(verify_email['message'])
            else:
                raise ErrorMessage("Provide OTP for Mobile and Email")
            customer_obj.is_anyone_verified = True
            customer_obj.agent = request.user
            customer_obj.save()

            sendemailcustomer(email, customer_obj.id)

            return Response({"data": {"is_customer_created": True, "customer_id": customer_obj.id,
                                      'message': 'Customer Created Successfully'}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_customer_created": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResendCustomerCreateOTP(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation, )

    def post(self, request):
        try:
            mobile = int(request.data['mobile'])
            email = request.data['email']
            if len(str(mobile)) != 10:
                raise ErrorMessage("Provide Valid Mobile Number")
            url = f'https://api.kickbox.com/v2/verify?email={email}&apikey={constant_values.KICKBOX_KEY}'
            email_verification = requests.get(url=url)
            if email_verification.json()['result'] != 'deliverable':
                raise ErrorMessage("Email is Not Valid")
            try:
                Customer.objects.get(Q(mobile=mobile) & Q(is_active=True))
                raise ErrorMessage("Mobile Number is Already Registered with Other Customer")
            except Customer.DoesNotExist:
                try:
                    Customer.objects.get(Q(email=email) & Q(is_active=True))
                    raise ErrorMessage("Email Number is Already Registered with Other Customer")
                except Customer.DoesNotExist:
                    pass

            sendotpsave(mobile, email)
            return Response({"data": {"is_otp_sent": True, 'message': 'OTP Re Sent Successfully'}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_otp_sent": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
