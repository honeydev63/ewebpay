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
from e_checkout.constant_values import email_check1

# change DB Table
from app.serializers import ProductListingSerializer, OrderListingSerializer, OrderDetailSerializer, \
    WorkOrderListingSerializer, DraftOrderDetailSerializer
from app.utilities import ErrorMessage, pagination, productsearch, ordersearch, orderfilter, orderdetailfilter, \
    orderdaterangefilter, sendotp1, verifymobileotp, processorder, sendotpsave, sendworkorder, verifyemailotp
from app.models import MyUser, Product, Permission, ProductUpdateHistory, SalesOrder, CardDetail, BankDetail, Customer
from app.permissions import SalesAgentValidation, AdminValidation, AgentAdminValidation


class DraftOrderlisting(generics.ListAPIView):
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
        queryset = SalesOrder.objects.all().filter(ordersearch(search) & orderfilter(self.request) & Q(is_draft=True)
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


class DraftOrderDetail(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def get(self, request):
        try:
            order_id = request.query_params.get('order_id')
            try:
                order_obj = SalesOrder.objects.get(Q(id=order_id) & orderdetailfilter(request) & Q(is_draft=True))
            except SalesOrder.DoesNotExist:
                raise ErrorMessage("Order Id is invalid")
            serializer = DraftOrderDetailSerializer(order_obj, many=False)
            return Response({"data": {"is_order_exist": True, 'user': serializer.data}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_order_exist": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DraftOrderOTP(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def post(self, request):
        try:
            order_id = request.data['order_id']

            try:
                sales_obj = SalesOrder.objects.get(Q(id=order_id) & Q(is_draft=True))
            except SalesOrder.DoesNotExist:
                raise ErrorMessage("Order ID is Invalid")
            try:
                customer_obj = Customer.objects.get(id=sales_obj.customer.id)
            except Customer.DoesNotExist:
                raise ErrorMessage("Customer ID is invalid")
            sendotpsave(customer_obj.mobile, customer_obj.email)
            return Response({"data": {"is_otp_sent": True,
                                      'message': 'OTP Sent to Mobile and Email'}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_otp_sent": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
