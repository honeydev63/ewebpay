import json
import logging
import math
import re
import sys
import time
import urllib.request
import urllib.parse
import uuid
from datetime import date
import time
import os
import io
import requests

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

# change DB Table
from app.serializers import ProductListingSerializer, MerchantAllListingSerializer, PasswordResetSerializer, \
    AgentAllListingSerializer
from app.utilities import ErrorMessage, pagination, productsearch, agentsearch, merchantsearch, get_access_token
from app.models import MyUser, Product, Permission, ProductUpdateHistory, Merchant
from app.permissions import MerchantValidation, AgentAdminValidation
from e_checkout import constant_values
from docusign_esign import NewUsersDefinition, UserInformation, NameValue
class MerchantAdd(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            legal_entity_name = str(request.data['legal_entity_name']).strip()
            if len(legal_entity_name) < 4 or len(legal_entity_name) > 100:
                raise ErrorMessage("Merchant name should be minimum 3 characters and maximum 100 characters")
            mobile = int(request.data['mobile'])
            if len(str(mobile)) != 10 or not constant_values.regex_3(mobile):
                raise ErrorMessage("Mobile number must be 10 digits")
            email = str(request.data['email']).strip()
            email_check = bool(re.search(r"^[\w\.\+\-]+\@[\w]+\.[a-z]{2,3}$", str(email)))
            if not email_check:
                raise ErrorMessage("Email is not valid")
            # try:
            #     MyUser.objects.get(Q(email=email))
            #     raise ErrorMessage("Email already registered with us")
            # except MyUser.DoesNotExist:
            #     try:
            #         MyUser.objects.get(Q(mobile=mobile) & Q(is_active=True))
            #         raise ErrorMessage("Mobile Number already registered with us")
            #     except MyUser.DoesNotExist:
            #         pass
            # random_password = str(uuid.uuid4()).replace("-", "")[0:7]      
            # user_obj = MyUser.objects.create_user(agent_name=merchant_name.title(), email=email, password=random_password,
            #                                       mobile=mobile)
            # user_obj.is_merchant = True
            # user_obj.is_active = True
            # user_obj.signup_date = date.today()
            # user_obj.save()

            #Create docusign user

            access_token = get_access_token()


            merchant_obj = Merchant.objects.create(
                # agent=user_obj, 
                legal_entity_name=legal_entity_name, 
                email=email,
                mobile=mobile,
                address_line1=str(request.data['address_line1']).strip(), 
                address_line2=str(request.data['address_line2']).strip(), 
                address_city=str(request.data['address_city']).strip(), 
                address_state=str(request.data['address_state']).strip(), 
                address_zipcode=str(request.data['address_zipcode']).strip(), 
                payment_gateway=str(request.data['payment_gateway']).strip(), 
                provider_name=str(request.data['provider_name']).strip(), 
                descriptor=str(request.data['descriptor']).strip(), 
                alias=str(request.data['alias']).strip(), 
                credential=str(request.data['credential']).strip(), 
                profile_id=str(request.data['profile_id']).strip(), 
                profile_key=str(request.data['profile_key']).strip(), 
                currency=str(request.data['currency']).strip(), 
                merchant_id=str(request.data['merchant_id']).strip(), 
                limit_n_fees=str(request.data['limit_n_fees']).strip(), 
                global_monthly_cap=str(request.data['global_monthly_cap']).strip(), 
                daily_cap=str(request.data['daily_cap']).strip(), 
                weekly_cap=str(request.data['weekly_cap']).strip(), 
                account_details=str(request.data['account_details']).strip(), 
                customer_service_email=str(request.data['customer_service_email']).strip(), 
                customer_service_email_from=str(request.data['customer_service_email_from']).strip(), 
                gateway_url=str(request.data['gateway_url']).strip(), 
                transaction_fee=float(request.data['transaction_fee']) if request.data['transaction_fee'] != '' else None, 
                batch_fee=float(request.data['batch_fee']) if request.data['batch_fee'] != '' else None, 
                monthly_fee=float(request.data['monthly_fee']) if request.data['monthly_fee'] != '' else None, 
                chargeback_fee=float(request.data['chargeback_fee']) if request.data['chargeback_fee'] != '' else None, 
                refund_processing_fee=float(request.data['refund_processing_fee']) if request.data['refund_processing_fee'] != '' else None, 
                reserve_percentage=float(request.data['reserve_percentage']) if request.data['reserve_percentage'] != '' else None, 
                reserve_term_rolling=str(request.data['reserve_term_rolling']).strip(), 
                reserve_term_days=str(request.data['reserve_term_days']).strip(), 
            )

            return Response({"data": {"is_merchant_added": True, 'message': 'Merchant Created successfully'}}, status=status.HTTP_201_CREATED)
        except ErrorMessage as e:
            return Response({"data": {"is_merchant_added": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError) as e:
            print(e)
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class Merchantlisting(generics.ListAPIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def get_queryset(self):
        sorting_values = ['legal_entity_name', '-legal_entity_name', 'email', '-email', 'mobile', '-mobile', 'descriptor', '-descriptor']
        current_page = int(self.request.query_params.get('currentPage', settings.DEFAULTPAGE))
        per_page = int(self.request.query_params.get('perPage', settings.DEFAULTPRODUCTSPERPGE))
        search = self.request.query_params.get('search')
        order = self.request.query_params.get('order') if self.request.query_params.get(
            'order') in sorting_values else 'legal_entity_name'

        pagination_dataset = pagination(current_page, per_page)
        start_index = pagination_dataset[0]
        end_index = pagination_dataset[1]
        queryset = Merchant.objects.all().filter(Q(merchantsearch(search))).order_by(order)
        count = len(queryset)
        return queryset[start_index: end_index], count, current_page, per_page

    def get(self, request, *args, **kwargs):
        try:
            data_obj, count, current_page, per_page = self.get_queryset()
            response_dict = {"currentPage": current_page, "perPage": per_page, "totalEntries": 0, "totalPages": 0}
            if count:
                serializer = MerchantAllListingSerializer(data_obj, many=True)
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