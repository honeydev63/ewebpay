import datetime
import json
import logging
import math
import re
import sys
import time
import urllib.request
import urllib.parse
import uuid

import requests
from django.core.exceptions import ValidationError as VE
import jwt
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

from e_checkout import constant_values
from e_checkout.constant_values import email_check1, regex_3

# change DB Table
from app.serializers import ProductListingSerializer, OrderListingSerializer, OrderDetailSerializer, \
    WorkOrderListingSerializer
from app.utilities import ErrorMessage, pagination, productsearch, ordersearch, orderfilter, orderdetailfilter, \
    orderdaterangefilter, sendotp1, verifymobileotp, processorder, sendotpsave, sendworkorder, verifyemailotp, \
    sendcheckoutmail, addressvalidation, sendorderlinkonmobile, get_access_token, get_listTabs, send_document_for_signing, get_document
from app.models import MyUser, Product, Permission, ProductUpdateHistory, SalesOrder, CardDetail, BankDetail, Customer, \
    UnProcessedOrder, Merchant
from app.permissions import SalesAgentValidation, AdminValidation, AgentAdminValidation


class ProductPrice(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            product_id = int(request.data['product_id'])
            quantity = int(request.data['quantity'])
            try:
                prod_obj = Product.objects.get(Q(product_id=product_id) & Q(is_active=True))
            except Product.DoesNotExist:
                raise ErrorMessage("product id is not valid")
            if quantity <= 0:
                raise ErrorMessage("Quantity cannot be zero and negative")
            price = round(prod_obj.price, 2)
            total_price = quantity * price
            return Response({"data": {"is_product_exist": True, "product_id": product_id, "quantity": quantity,
                                      "price": price, "total_price": total_price}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_product_exist": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckoutCard(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            agent_id = request.user.agent_id
            try:
                agent_obj = MyUser.objects.get(agent_id=agent_id)
            except MyUser.DoesNotExist:
                raise ErrorMessage("Sales Agent ID is invalid")
            first_name = str(request.data['first_name']).strip()
            if len(first_name) < 4 or len(first_name) > 100:
                raise ErrorMessage("First Name should be minimum 3 and maximum 100 characters")
            last_name = str(request.data['last_name']).strip() if request.data.get('last_name') else None
            address2 = str(request.data['address2']).strip() if request.data.get('address2') else None
            s_address2 = str(request.data['s_address2']).strip() if request.data.get('s_address2') else None
            s_mobile = int(request.data['s_mobile']) if request.data.get('s_mobile') else None
            if s_mobile and len(str(s_mobile)) != 10:
                raise ErrorMessage("Shipping Mobile is not Valid")
            s_email = str(request.data['s_email']).strip() if request.data.get('s_email') else None
            if s_email and not email_check1(s_email):
                raise ErrorMessage("Shipping Email is not Valid")

            mobile = int(request.data['mobile'])
            if len(str(mobile)) != 10 or not regex_3(mobile):
                raise ErrorMessage("Provide Valid Mobile Number")
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
            s_address1 = str(request.data['s_address1']).strip()
            if len(str(s_address1)) < 3 or len(s_address1) > 100:
                raise ErrorMessage("Shipping address 1 should be minimum 3 and maximum 100 characters")
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
            product_id = int(request.data['product_id'])
            try:
                prod_obj = Product.objects.get(Q(product_id=product_id) & Q(is_active=True))
            except Product.DoesNotExist:
                raise ErrorMessage("Product id is Invalid")
            product_name = prod_obj.product_name

            quantity = int(request.data['quantity'])
            price = prod_obj.price

            total_price = quantity * price
            card_number = str(request.data['card_number']).strip()
            expiry_date = str(request.data['expiry_date']).strip()
            cvv = int(request.data['cvv'])
            comment = request.query_params.get('comment', "").strip()

            try:
                customer_obj = Customer.objects.get(Q(mobile=mobile) & Q(is_active=True))
                try:
                    customer_obj2 = Customer.objects.get(Q(email=email) & Q(is_active=True))
                    if customer_obj2.id != customer_obj.id:
                        raise ErrorMessage("Email is already Registered with another Customer kindly change the "
                                           "email to place the order")
                except Customer.DoesNotExist:
                    pass
                customer_obj.first_name = first_name
                customer_obj.last_name = last_name
                customer_obj.mobile = mobile
                customer_obj.address1 = address1
                customer_obj.address2 = address2
                customer_obj.city = city
                customer_obj.state = state
                customer_obj.country = country
                customer_obj.zip_code = zip_code
                customer_obj.email = email
                customer_obj.s_mobile = s_mobile
                customer_obj.s_email = s_email
                customer_obj.s_address1 = s_address1
                customer_obj.s_address2 = s_address2
                customer_obj.s_country = s_country
                customer_obj.s_state = s_state
                customer_obj.s_city = s_city
                customer_obj.s_zip_code = s_zip_code
                customer_obj.is_card_payment = True
                customer_obj.card_number = card_number
                customer_obj.expiry_date = expiry_date
                customer_obj.cvv = cvv
                customer_obj.save()

            except Customer.DoesNotExist:
                try:
                    customer_obj = Customer.objects.get(Q(email=email) & Q(is_active=True))
                    raise ErrorMessage("Email is already Registered with different customer kindly change the "
                                       "email to place the order")
                except Customer.DoesNotExist:
                    pass
                random_string = str(uuid.uuid4()).replace("-", "")[0:8]

                customer_obj = Customer.objects.create(first_name=first_name, last_name=last_name, mobile=mobile,
                                                       email=email, address1=address1, address2=address2,
                                                       country=country, state=state, city=city, zip_code=zip_code,
                                                       s_mobile=s_mobile, s_email=s_email, is_card_payment=True,
                                                       s_address1=s_address1, s_address2=s_address2, cvv=cvv,
                                                       s_country=s_country, card_number=card_number,
                                                       expiry_date=expiry_date, agent=request.user,
                                                       s_state=s_state, s_city=s_city, s_zip_code=s_zip_code,
                                                       code=random_string)

            sales_obj = SalesOrder.objects.create(agent=agent_obj, customer=customer_obj, mobile=mobile, email=email,
                                                  address1=address1, address2=address2, country=country, state=state,
                                                  city=city, zip_code=zip_code, total_price=total_price,
                                                  is_card_payment=True)

            card_obj = CardDetail.objects.create(order=sales_obj, card_number=card_number, expiry_date=expiry_date,
                                                 cvv=cvv,
                                                 comment=comment, s_mobile=s_mobile, s_email=s_email,
                                                 s_address1=s_address1,
                                                 s_address2=s_address2, s_country=s_country, s_state=s_state,
                                                 s_city=s_city,
                                                 s_zip_code=s_zip_code, product_id=product_id,
                                                 product_name=product_name,
                                                 quantity=quantity, unit_price=price, agent=request.user)
            if customer_obj.is_anyone_verified:
                work_order = sendworkorder(email)
                if work_order['status']:
                    sales_obj.work_order_status = "doc_sent"
                is_customer_exist = True
                sales_obj.is_draft = False
                sales_obj.verified_timestamp = datetime.datetime.now()
                sales_obj.save()
                card_obj.is_draft = False
                card_obj.save()
                message = "Order created Successfully"

            else:
                message = "Order Saved to Drafts, Verify the Customer in Next Screen to Create Order"
                is_customer_exist = False
                sendotpsave(mobile, email)
            return Response({"data": {"is_order_created": True, "order_id": sales_obj.id,
                                      "is_customer_exist": is_customer_exist,
                                      "message": message}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_order_created": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckoutBank(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            agent_id = request.user.agent_id
            try:
                agent_obj = MyUser.objects.get(agent_id=agent_id)
            except MyUser.DoesNotExist:
                raise ErrorMessage("Sales Agent ID is invalid")
            customer_name = str(request.data['customer_name']).strip()
            if len(customer_name) < 4 or len(customer_name) > 100:
                raise ErrorMessage("Customer Name should be minimum 4 and maximum 100 characters")
            mobile = int(request.data['mobile'])
            if len(str(mobile)) != 10 or not regex_3(mobile):
                raise ErrorMessage("Enter a Valid 10 digit Mobile Number")
            type1 = str(request.data['type']).strip()
            types_list = ["Company", "Individual"]
            if type1 not in types_list:
                raise ErrorMessage("Type must be Individual or Company")

            company_name = str(request.data['company_name']).strip() if request.data.get('company_name') else None
            email = str(request.data['email']).strip()
            if not email_check1(email):
                raise ErrorMessage("Email is not Valid")
            address1 = str(request.data['address1']).strip()
            if len(address1) < 4 or len(address1) > 100:
                raise ErrorMessage("Address1 should be minimum 4 and maximum 100 characters")
            address2 = str(request.data['address2']).strip() if request.data.get('address2') else None
            account_number = int(request.data['account_number'])
            if len(str(account_number)) < 6:
                raise ErrorMessage("Account Number should be minimum 6 Digits")
            routing_number = int(request.data['routing_number'])
            if len(str(routing_number)) > 9:
                raise ErrorMessage("Routing number cannot be more than 9")
            bank_name = str(request.data['bank_name']).strip()
            if len(bank_name) < 4 or len(bank_name) > 15:
                raise ErrorMessage("Bank Name should be minimum 4 and maximum 15 characters")
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
            amount = round(float(request.data['amount']), 2)

            description = str(request.data['description']).strip() if request.data.get('description') else None

            try:
                customer_obj = Customer.objects.get(Q(mobile=mobile) & Q(is_active=True))
                customer_obj.mobile = mobile
                try:
                    customer_obj2 = Customer.objects.get(Q(email=email) & Q(is_active=True))
                    if customer_obj2.id != customer_obj.id:
                        raise ErrorMessage("Email is already Registered with another Customer kindly change the "
                                           "email to place the order")
                except Customer.DoesNotExist:
                    pass

                customer_obj.email = email
                customer_obj.address1 = address1
                customer_obj.address2 = address2
                customer_obj.is_bank_payment = True
                customer_obj.type = type1
                customer_obj.company_name = company_name
                customer_obj.account_number = account_number
                customer_obj.routing_number_bank = routing_number
                customer_obj.bank_name = bank_name
                customer_obj.country = country
                customer_obj.state = state
                customer_obj.city = city
                customer_obj.zip_code = zip_code
                customer_obj.save()

            except Customer.DoesNotExist:
                try:
                    customer_obj = Customer.objects.get(Q(email=email) & Q(is_active=True))
                    raise ErrorMessage("Email is already Registered with different customer kindly change the "
                                       "email to place the order")
                except Customer.DoesNotExist:
                    pass
                random_string = str(uuid.uuid4()).replace("-", "")[0:8]

                customer_obj = Customer.objects.create(first_name=customer_name, mobile=mobile, email=email,
                                                       is_bank_payment=True, type=type1, agent=request.user,
                                                       company_name=company_name, customer_name=customer_name,
                                                       account_number=account_number, routing_number=routing_number,
                                                       bank_name=bank_name, address1=address1, address2=address2,
                                                       country=country, state=state, city=city, zip_code=zip_code,
                                                       code=random_string)

            sales_obj = SalesOrder.objects.create(agent=agent_obj, customer=customer_obj, mobile=mobile, email=email,
                                                  total_price=amount, is_bank_payment=True, address1=address1,
                                                  address2=address2, country=country, state=state, city=city,
                                                  zip_code=zip_code)

            bank_obj = BankDetail.objects.create(order=sales_obj, agent=request.user, type=type1,
                                                 company_name=company_name, customer_name=customer_name,
                                                 account_number=account_number, routing_number=routing_number,
                                                 bank_name=bank_name, email=email, amount=amount,
                                                 description=description)
            if customer_obj.is_anyone_verified:
                message = "Order created Successfully"
                work_order = sendworkorder(email)
                if work_order['status']:
                    sales_obj.work_order_status = "doc_sent"
                is_customer_exist = True
                sales_obj.is_draft = False
                sales_obj.verified_timestamp = datetime.datetime.now()
                sales_obj.save()
                bank_obj.is_draft = False
                bank_obj.save()
            else:
                message = "Order saved to Drafts, Verify the Customer in the next Screen to Create Order"
                is_customer_exist = False
                sendotpsave(mobile, email)

            return Response({"data": {"is_order_created": True, "order_id": sales_obj.id,
                                      "is_customer_exist": is_customer_exist,
                                      "message": message}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_order_created": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class Orderlisting(generics.ListAPIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def get_queryset(self):
        sorting_values = ['id', '-id', 'agent__agent_name', '-agent__agent_name', 'total_price', '-total_price']
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
        queryset = SalesOrder.objects.all().filter(ordersearch(search) & orderfilter(self.request) & Q(is_draft=False)
                                                   & orderdaterangefilter(from_date, end_date)).order_by(order)
        count = len(queryset)
        return queryset[start_index: end_index if self.request.query_params.get(
            'perPage') else count], count, current_page, per_page

    def get(self, request, *args, **kwargs):
        try:
            data_obj, count, current_page, per_page = self.get_queryset()
            response_dict = {"currentPage": current_page, "perPage": per_page, "totalEntries": 0, "totalPages": 0}
            if count:
                serializer = OrderListingSerializer(data_obj, many=True)
                response_dict["totalEntries"] = count
                response_dict["totalPages"] = math.ceil(count / per_page)
                data = serializer.data
            else:
                data = []
            return Response({"data": data, "meta": response_dict}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": []}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError,
                ObjectDoesNotExist):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderDetail(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def get(self, request):
        try:
            order_id = request.query_params.get('order_id')
            try:
                order_obj = SalesOrder.objects.get(Q(id=order_id) & Q(is_draft=False))
            except SalesOrder.DoesNotExist:
                raise ErrorMessage("Order id is invalid")
            serializer = OrderDetailSerializer(order_obj, many=False)
            return Response({"data": {"is_order_exist": True, 'user': serializer.data}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_order_exist": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomerVerification(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            order_id = int(request.data['order_id'])
            mobile_otp = request.data.get('mobile_otp')
            email_otp = request.data.get('email_otp')
            try:
                sales_obj = SalesOrder.objects.get(Q(id=order_id) & Q(is_draft=True))
            except SalesOrder.DoesNotExist:
                raise ErrorMessage("Order ID is Invalid")
            try:
                customer_obj = Customer.objects.get(id=sales_obj.customer.id)
            except Customer.DoesNotExist:
                raise ErrorMessage("Customer ID is Invalid")
            if customer_obj.is_anyone_verified:
                raise ErrorMessage("Customer is Already Verified")
            if mobile_otp and email_otp:
                verify_mobile = verifymobileotp(sales_obj.mobile, mobile_otp)
                verify_email = verifyemailotp(sales_obj.email, email_otp)
                if verify_mobile['status'] and verify_email['status']:
                    customer_obj.is_mobile_verified = True
                    customer_obj.is_email_verified = True
                elif not verify_mobile['status']:
                    raise ErrorMessage(verify_mobile['message'])
                elif not verify_email['status']:
                    raise ErrorMessage(verify_email['message'])

            elif mobile_otp:
                verify_mobile = verifyemailotp(sales_obj.mobile, mobile_otp)
                if verify_mobile['status']:
                    customer_obj.is_mobile_verified = True
                else:
                    raise ErrorMessage(verify_mobile['message'])

            elif email_otp:
                verify_email = verifyemailotp(sales_obj.email, email_otp)
                if verify_email['status']:
                    customer_obj.is_email_verified = True
                else:
                    raise ErrorMessage(verify_email['message'])
            else:
                raise ErrorMessage("provide OTP for Mobile and Email")
            customer_obj.is_anyone_verified = True
            customer_obj.verified_timestamp = datetime.datetime.now()
            processorder(sales_obj.customer)
            customer_obj.save()
            work_order = sendworkorder(sales_obj.email)
            if work_order['status']:
                sales_obj.verified_timestamp = datetime.datetime.now()
                sales_obj.is_draft = False
                sales_obj.work_order_status = "doc_sent"
                sales_obj.save()
            return Response({"data": {"is_customer_verified": True, "message": "Order Created Successfully"}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_customer_verified": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WorkOrderlisting(generics.ListAPIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def get_queryset(self):
        sorting_values = ['id', '-id', 'customer__id', '-customer__id', 'work_order_status', '-work_order_status']
        current_page = int(self.request.query_params.get('currentPage', settings.DEFAULTPAGE))
        per_page = int(self.request.query_params.get('perPage', settings.DEFAULTPRODUCTSPERPGE))
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
        queryset = SalesOrder.objects.all().filter(orderfilter(self.request) & Q(is_draft=False)
                                                   & orderdaterangefilter(from_date, end_date)).order_by(order)
        count = len(queryset)
        return queryset[start_index: end_index if self.request.query_params.get(
            'perPage') else count], count, current_page, per_page

    def get(self, request, *args, **kwargs):
        try:
            data_obj, count, current_page, per_page = self.get_queryset()
            response_dict = {"currentPage": current_page, "perPage": per_page, "totalEntries": 0, "totalPages": 0}
            if count:
                serializer = WorkOrderListingSerializer(data_obj, many=True)
                response_dict["totalEntries"] = count
                response_dict["totalPages"] = math.ceil(count / per_page)
                data = serializer.data
            else:
                data = []
            return Response({"data": data, "meta": response_dict}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": []}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError,
                ObjectDoesNotExist):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WorkOrderStatus(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            status_list = ['doc_sent', 'signed', 're_sent', 'not_required', 'other']
            order_id = int(request.data['order_id'])
            status1 = str(request.data['status']).strip()
            if status1 not in status_list:
                raise ErrorMessage(f"Only these {status_list} values are Allowed")
            try:
                sales_obj = SalesOrder.objects.get(orderfilter(self.request) & Q(id=order_id) & Q(is_draft=False))
            except SalesOrder.DoesNotExist:
                raise ErrorMessage("Order id is invalid")
            sales_obj.work_order_status = status1
            sales_obj.save()

            return Response({"data": {"is_updated": True, 'message': "Status updated successfully"}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_updated": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResendWorkOrder(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            order_id = int(request.data['order_id'])
            try:
                sales_obj = SalesOrder.objects.get(Q(id=order_id) & Q(is_draft=False))
            except SalesOrder.DoesNotExist:
                raise ErrorMessage("Order ID is Invalid")
            try:
                customer_obj = Customer.objects.get(id=sales_obj.customer.id)
            except Customer.DoesNotExist:
                raise ErrorMessage("Customer ID is Invalid")
            work_order = sendworkorder(sales_obj.email)
            if work_order['status']:
                sales_obj.work_order_status = "re_sent"
                sales_obj.save()
            return Response({"data": {"is_sent": True, 'message': "Work Order Re-Sent to Customer Successfully"}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_sent": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResendDocuSign(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            order_id = int(request.data['order_id'])
            try:
                sales_obj = SalesOrder.objects.get(Q(id=order_id) & Q(is_draft=False))
            except SalesOrder.DoesNotExist:
                raise ErrorMessage("Order ID is Invalid")
            try:
                customer_obj = Customer.objects.get(id=sales_obj.customer.id)
            except Customer.DoesNotExist:
                raise ErrorMessage("Customer ID is Invalid")

            try:
                merchant_obj = Merchant.objects.order_by('?').first()
            except Merchant.DoesNotExist:
                raise ErrorMessage("Merchant does not exist.")

            access_token = get_access_token()
            recipients_list = get_listTabs(access_token, '0d0c4d1e-2560-44a9-9b00-56106b12a68d')
            tabs = recipients_list[0].signers[0].tabs
            tabs_list = tabs.to_dict()
            for key, item in tabs_list.items():
                if key == 'text_tabs':
                    for i in range(len(item)):
                        tab_label = item[i]['tab_label']
                        if tab_label == 'mobile_no':
                            tabs.text_tabs[i].value = customer_obj.mobile if customer_obj.mobile != None else ''
                        elif tab_label == 'Text 79d09316-8d52-4070-9a10-37d06fa24a4a':
                            tabs.text_tabs[i].value = customer_obj.mobile if customer_obj.mobile != None else ''
                        elif tab_label == 'Text 1267a2ce-e344-4d75-bb15-7f684a1491fa':
                            tabs.text_tabs[i].value = (customer_obj.address1 if customer_obj.address1 != None else '') + ' ' + (customer_obj.address2 if customer_obj.address2 != None else '')
                        elif tab_label == 'Text 79d09316-8d52-4070-9a10-37d06fa24a4a':
                            tabs.text_tabs[i].value = customer_obj.s_email if customer_obj.s_email != None else ''
                        elif tab_label == 'Text 16e2158a-2810-4c7f-8058-fc11414bac14':
                            tabs.text_tabs[i].value = customer_obj.city if customer_obj.city != None else ''
                        elif tab_label == 'Text 87c6dbcc-2cb4-4ef4-95bf-ec2cf9875590':
                            tabs.text_tabs[i].value = customer_obj.state if customer_obj.state != None else ''
                        elif tab_label == 'Text ee9d3ef9-26c4-48af-871f-366da7e4695c':
                            tabs.text_tabs[i].value = customer_obj.zip_code if customer_obj.zip_code != None else ''
                        elif tab_label == 'Text 4d240da5-fbdf-4a29-9d45-8b61ef4b8df4':
                            tabs.text_tabs[i].value = sales_obj.product_name if sales_obj.product_name != None else ''
                        elif tab_label == 'Text 9b2cc493-c710-4403-b998-78a8ec809703':
                            tabs.text_tabs[i].value = str(sales_obj.unit_price * sales_obj.quantity)
                        elif tab_label == 'Text 26f5a82e-668b-4576-844c-1b54bccbad1e':
                            tabs.text_tabs[i].value = str(merchant_obj.batch_fee) if merchant_obj.batch_fee != None else '0'
                        elif tab_label == 'Text 00f21829-7cbb-43a8-968b-28066c3abfdd':
                            tabs.text_tabs[i].value = f"{datetime.datetime.today().strftime('%d')}th"
                        elif tab_label == 'Text 80c7cf3f-2c25-487d-95cb-aba030d8b4ea':
                            tabs.text_tabs[i].value = f"{datetime.datetime.today().strftime('%m')}"
                        elif tab_label == 'Text 65737061-4031-4c0f-a78b-bfd469a84781':
                            tabs.text_tabs[i].value = merchant_obj.legal_entity_name if merchant_obj.legal_entity_name != None else ''
                        elif tab_label == 'Text 1aa2726d-a3fd-4441-9729-2225aeba84d0':
                            tabs.text_tabs[i].value = merchant_obj.descriptor if merchant_obj.descriptor != None else ''
                        elif tab_label == 'Text e8e87146-273a-44d7-95de-47a0a73262c5':
                            tabs.text_tabs[i].value = str(sales_obj.unit_price * sales_obj.quantity)
                        elif tab_label == 'Text 39307482-8ef6-48f2-a26b-24e23a8840d3':
                            tabs.text_tabs[i].value = datetime.datetime.today().strftime('%m/%d/%Y')
                        elif tab_label == 'Text c3b9e4d8-db61-4caa-8493-a413ddcbc372':
                            tabs.text_tabs[i].value = sales_obj.product_name if sales_obj.product_name != None else ''
                        elif tab_label == 'Text 291c466e-6c2b-45f4-b122-e46321b9f9c3':
                            tabs.text_tabs[i].value = (customer_obj.address1 if customer_obj.address1 != None else '') + ' ' + (customer_obj.address2 if customer_obj.address2 != None else '')
                        elif tab_label == 'Text 20068256-e212-4103-98f2-ecb17015b23a':
                            tabs.text_tabs[i].value = customer_obj.city if customer_obj.city != None else ''
                        elif tab_label == 'Text 74661f0e-b042-4531-b7a2-c143ce23d109':
                            tabs.text_tabs[i].value = customer_obj.state if customer_obj.state != None else ''
                        elif tab_label == 'Text d1206507-7b12-4276-8e90-bc1a3d311ba4':
                            tabs.text_tabs[i].value = customer_obj.zip_code if customer_obj.zip_code != None else ''
                        elif tab_label == 'Text c4fd256e-a014-4b92-a7a3-94d20ef52e34':
                            tabs.text_tabs[i].value = customer_obj.mobile if customer_obj.mobile != None else ''
                        elif tab_label == 'Text 24a0e487-81fd-404a-85c5-489d8c215ee4':
                            tabs.text_tabs[i].value = customer_obj.card_number if customer_obj.card_number != None else ''
                        elif tab_label == 'Text 1c327236-95f3-4522-a8f6-d119555b86a2':
                            tabs.text_tabs[i].value = customer_obj.expiry_date.split('/')[0] if customer_obj.expiry_date != None else ''
                        elif tab_label == 'Text 971a2ddd-671d-478d-98dd-71b26da84c32':
                            tabs.text_tabs[i].value = customer_obj.expiry_date.split('/')[1] if customer_obj.expiry_date != None else ''
                        elif tab_label == 'Text 386ea620-a360-4da5-9028-9164c568ddb0':
                            tabs.text_tabs[i].value = customer_obj.cvv if customer_obj.cvv != None else ''

            signer_obj = {
                'email': 'engineerpro3@gmail.com',
                'name': (customer_obj.first_name if customer_obj.first_name != None else '') + ' ' + (customer_obj.last_name if customer_obj.last_name != None else ''),
                'tabs': tabs
            }
            cc_obj = {
                'email': 'leegeillie@gmail.com',
                'name': 'CC Tester'
            }
            envelop = send_document_for_signing(access_token, '0d0c4d1e-2560-44a9-9b00-56106b12a68d', signer_obj, cc_obj)
            result = get_document(access_token, envelop['envelope_id'])
            print(result)


            # work_order = sendworkorder(sales_obj.email)
            # if work_order['status']:
            #     sales_obj.work_order_status = "re_sent"
            #     sales_obj.save()
            return Response({"data": {"is_sent": True, 'message': "Docusign Re-Sent to Customer Successfully"}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_sent": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError) as e:
            print(e)
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(str(e))
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class WorkOrderRemove(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            status_list = ['not_required']
            order_id = int(request.data['order_id'])
            status1 = str(request.data['status']).strip()
            if status1 not in status_list:
                raise ErrorMessage(f"Only these {status_list} values are Allowed")
            try:
                sales_obj = SalesOrder.objects.get(orderfilter(self.request) & Q(id=order_id) & Q(is_draft=False))
            except SalesOrder.DoesNotExist:
                raise ErrorMessage("Order id is invalid")
            sales_obj.work_order_status = status1
            sales_obj.save()

            return Response({"data": {"is_updated": True, 'message': "Status updated successfully"}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_updated": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResendOtp(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            order_id = int(request.data['order_id'])
            try:
                sales_obj = SalesOrder.objects.get(Q(id=order_id) & Q(is_draft=True))
            except SalesOrder.DoesNotExist:
                raise ErrorMessage("Order ID is Invalid")
            try:
                customer_obj = Customer.objects.get(id=sales_obj.customer.id)
            except Customer.DoesNotExist:
                raise ErrorMessage("Customer ID is Invalid")
            if customer_obj.is_anyone_verified:
                raise ErrorMessage("Customer is Already Verified")
            sendotpsave(sales_obj.mobile, sales_obj.email)

            return Response({"data": {"is_otp_resent": True, "message": "OTP resent to Customer Successfully"}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_otp_resent": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderCreateEmail(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            product_id = int(request.data['product_id'])
            try:
                product_obj = Product.objects.get(product_id=product_id)
            except Product.DoesNotExist:
                raise ErrorMessage("Product ID is Invalid")

            quantity = int(request.data['quantity'])
            if quantity <= 0:
                raise ErrorMessage("Quantity cannot be zero or negative")
            customer_id = int(request.data['customer_id'])
            try:
                cust_obj = Customer.objects.get(Q(id=customer_id) & Q(is_active=True))
            except Customer.DoesNotExist:
                raise ErrorMessage("Customer Id is Invalid")

            unp_obj = UnProcessedOrder.objects.create(agent=request.user, customer=cust_obj,
                                                      product_id=product_obj.product_id,
                                                      product_name=product_obj.product_name, quantity=quantity,
                                                      unit_price=product_obj.price,
                                                      total_price=product_obj.price * quantity,
                                                      expiry_time=datetime.datetime.now() + datetime.timedelta(
                                                          days=constant_values.CHECKOUT_URL_EXPIRY_TIME))
            up_id = unp_obj.id
            url = f"{constant_values.CHECKOUT_CALLBACK_URL}{up_id}"
            sendcheckoutmail(cust_obj.email, url)
            sendorderlinkonmobile(cust_obj.mobile, url)

            return Response({"data": {"is_order_created": True, "id": up_id,
                                      "message": "CheckOut Link sent to Customer"}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_product_exist": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckoutOrderDetail(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        try:
            upid = request.query_params.get('upid')
            try:
                up_obj = UnProcessedOrder.objects.get(id=upid)
            except (UnProcessedOrder.DoesNotExist, VE):
                raise ErrorMessage("ID is Invalid")
            if datetime.datetime.now() > up_obj.expiry_time:
                raise ErrorMessage("This Order is Expired")
            data1 = {"up_id": up_obj.id, "product_id": up_obj.product_id, "quantity": up_obj.quantity, "unit_price": up_obj.unit_price,
                     "total_price": up_obj.total_price, "product_name":up_obj.product_name}
            return Response({"data": {"is_order_exist": True, "detail": data1}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_order_exist": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckoutOrderEmail(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        try:
            upid = request.data['upid']
            try:
                up_obj = UnProcessedOrder.objects.get(id=upid)
            except (UnProcessedOrder.DoesNotExist, VE):
                raise ErrorMessage("ID Does Not Exist")
            if datetime.datetime.now() > up_obj.expiry_time:
                raise ErrorMessage("This Order is Expired")
            try:
                customer_obj = Customer.objects.get(Q(mobile=up_obj.customer.mobile) & Q(is_active=True))
            except Customer.DoesNotExist:
                raise ErrorMessage("Customer Id is Invalid")
            
            first_name = str(request.data['firstname']).strip()
            if len(first_name) < 4 or len(first_name) > 100:
                raise ErrorMessage("First Name should be minimum 4 and maximum 100 characters")
            last_name = str(request.data['lastname']).strip()
            if len(last_name) < 4 or len(last_name) > 100:
                raise ErrorMessage("Last Name should be minimum 4 and maximum 100 characters")
            
            email = request.data['email']
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
            
            mobile = str(request.data['phonenumber']).strip()
            s_mobile = str(request.data['altphonenumber']).strip()
            

            address1 = str(request.data['address1']).strip()
            if len(address1) < 4 or len(address1) > 100:
                raise ErrorMessage("address1 should be minimum 4 and maximum 100 characters")

            address2 = str(request.data['address2']).strip() if request.data.get('address2') else None

            country = str(request.data['country']).strip()
            if len(country) < 4 or len(country) > 15:
                raise ErrorMessage("Country should be minimum 4 and maximum 15 characters")
            state = str(request.data['state']).strip()
            # if len(state) < 4 or len(state) > 15:
            #     raise ErrorMessage("State should be minimum 4 and maximum 15 characters")
            city = str(request.data['city']).strip()
            if len(city) < 4 or len(city) > 15:
                raise ErrorMessage("City should be minimum 4 and maximum 15 characters")
            zip_code = str(request.data['zip_code']).strip()

            s_address1 = str(request.data['s_address1']).strip()
            if len(str(s_address1)) < 3 or len(s_address1) > 100:
                raise ErrorMessage("Shipping address 1 should be minimum 3 and maximum 100 characters")

            s_address2 = str(request.data['s_address2']).strip() if request.data.get('s_address2') else None

            s_country = str(request.data['s_country']).strip()
            if len(s_country) < 3 or len(s_country) > 15:
                raise ErrorMessage("Shipping Country should be minimum 3 and maximum 15 characters")
            s_state = str(request.data['s_state']).strip()
            # if len(s_state) < 3 or len(s_state) > 15:
            #     raise ErrorMessage("City should be minimum 3 and maximum 15 characters")
            s_city = str(request.data['s_city']).strip()
            if len(s_city) < 3 or len(s_city) > 15:
                raise ErrorMessage("Shipping City should be minimum 3 and maximum 15 characters")
            s_zip_code = str(request.data['s_zip_code']).strip()

            type1 = str(request.data['type']).strip()
            types_list = ["Company", "Individual"]
            if type1 not in types_list:
                raise ErrorMessage("Type must be Individual or Company")

            customer_obj.first_name = first_name
            customer_obj.last_name = last_name
            customer_obj.email = email
            customer_obj.mobile = mobile
            customer_obj.s_mobile = s_mobile
            customer_obj.address1 = address1
            customer_obj.address2 = address2
            customer_obj.city = city
            customer_obj.state = state
            customer_obj.country = country
            customer_obj.zip_code = zip_code
            customer_obj.s_address1 = s_address1
            customer_obj.s_address2 = s_address2
            customer_obj.s_country = s_country
            customer_obj.s_state = s_state
            customer_obj.s_city = s_city
            customer_obj.s_zip_code = s_zip_code
            customer_obj.type = type1

            company_name = str(request.data['company_name']).strip() if request.data.get('company_name') else None

            comment = request.query_params.get('comment', "").strip()
            is_card_payment = request.data['is_card_payment']
            is_bank_payment = request.data['is_bank_payment']
            browser = str(request.data['browser']).strip()
            latitude = str(request.data.get('latitude', "")).strip()
            longitude = str(request.data.get('longitude', "")).strip()

            customer_obj.company_name = company_name
            customer_obj.comment = comment

            if is_card_payment:
                customer_obj.is_card_payment = is_card_payment
                card_number = str(request.data['card_number']).strip()
                expiry_date = str(request.data['expiry_date']).strip()
                cvv = str(request.data['cvv'])

                customer_obj.card_number = card_number
                customer_obj.expiry_date = expiry_date
                customer_obj.cvv = cvv

            elif is_bank_payment:
                customer_obj.is_bank_payment = is_bank_payment
                account_number = int(request.data['account_number'])
                if len(str(account_number)) < 6:
                    raise ErrorMessage("Account Number should be minimum 6 Digits")
                routing_number = int(request.data['routing_number'])
                if len(str(routing_number)) > 9:
                    raise ErrorMessage("Routing number cannot be more than 9 Digits")
                bank_name = str(request.data['bank_name']).strip()
                if len(bank_name) < 4 or len(bank_name) > 15:
                    raise ErrorMessage("Bank Name should be minimum 4 and maximum 15 characters")
                customer_obj.account_number = account_number
                customer_obj.routing_number_bank = routing_number
                customer_obj.bank_name = bank_name
            else:
                raise ErrorMessage("Payment Should be either Bank or Card")
            if address1 == s_address1 and address2 == s_address2 and city == s_city and state == s_state and country == s_country and zip_code == s_zip_code:
                add_verification = addressvalidation(f'{zip_code} {address1} {address2} {city} {state} {country}')
                if add_verification['status'] != 'OK':
                    raise ErrorMessage("Address is Invalid")
            else:
                add_verification1 = addressvalidation(f'{zip_code} {address1} {address2} {city} {state} {country}')
                if add_verification1['status'] != 'OK':
                    raise ErrorMessage("Billing Address is Invalid")
                add_verification2 = addressvalidation(f'{s_zip_code} {s_address1} {s_address2} {s_city} {s_state} {s_country}')
                if add_verification2['status'] != 'OK':
                    raise ErrorMessage("Shipping Address is Invalid")

            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0]
            else:
                ip_address = request.META.get('REMOTE_ADDR')

            sales_obj = SalesOrder.objects.create(agent=up_obj.agent, customer=customer_obj, type_value=type1,
                                                  mobile=mobile, email=email,
                                                  product_id=up_obj.product_id, product_name=up_obj.product_name,
                                                  quantity=up_obj.quantity, total_price=up_obj.total_price,
                                                  unit_price=up_obj.unit_price, address1=address1, address2=address2,
                                                  country=country, state=state, city=city, zip_code=zip_code,
                                                  s_address1=s_address1, s_address2=s_address2, s_country=s_country,
                                                  s_state=s_state, s_city=s_city, s_zip_code=s_zip_code, is_draft=False,
                                                  ip_address=ip_address, browser=browser, latitude=latitude,
                                                  longitude=longitude)
            if is_card_payment:
                sales_obj.is_card_payment = is_card_payment
                sales_obj.card_number = card_number
                sales_obj.expiry_date = expiry_date
                sales_obj.cvv = cvv
            elif is_bank_payment:
                sales_obj.is_bank_payment = is_bank_payment
                sales_obj.account_number = account_number
                sales_obj.routing_number = routing_number
                sales_obj.bank_name = bank_name
            work_order = sendworkorder(email)
            if work_order['status']:
                sales_obj.work_order_status = "doc_sent"
            sales_obj.save()
            customer_obj.save()

            up_obj.delete()

            return Response({"data": {"is_order_processed": True, "message": "Order Processed Successfully"}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_order_processed": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MapsAddressResults(APIView):
    permission_classes = (AllowAny, )

    def get(self, request):
        try:
            query = request.query_params.get('query')
            request1 = requests.get(constant_values.GOOGLE_MAPS_AUTO_COMPLETE_URL + 'input=' + query +
                                    '&key=' + constant_values.MAPS_KEY)
            response = request1.json()
            response2 = []
            for i in response['predictions']:
                if i.get('place_id'):
                    request2 = requests.get(constant_values.GOOGLE_PLACE_ID_DETAILS + 'place_id=' + i['place_id'] +
                                            '&key=' + constant_values.MAPS_KEY + '&fields=address_components')
                    i['place_details'] = request2.json()['result']['address_components']
                    response2.append(i)

            return Response({"data": response2}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_updated": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MapsAddressValidation(APIView):
    permission_classes = (AllowAny, )

    def get(self, request):
        try:
            query = request.query_params.get('query')
            print(query)
            request1 = requests.get(constant_values.GOOGLE_MAPS_VLIADTION_URL + 'address=' + query +
                                    '&key=' + constant_values.MAPS_KEY)
            response = request1.json()

            return Response({"data": response}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_updated": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
