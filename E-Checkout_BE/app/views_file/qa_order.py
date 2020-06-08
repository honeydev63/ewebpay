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
from e_checkout.constant_values import email_check1, regex_3

# change DB Table
from app.serializers import ProductListingSerializer, OrderListingSerializer, OrderDetailSerializer, \
    WorkOrderListingSerializer, QaOrderListingSerializer, AgentOrderDetailSerializer
from app.utilities import ErrorMessage, pagination, productsearch, ordersearch, orderfilter, orderdetailfilter, \
    orderdaterangefilter, sendotp1, verifymobileotp, processorder, sendotpsave, sendworkorder, verifyemailotp, \
    orderfilter1, orderfilter2
from app.models import MyUser, Product, Permission, ProductUpdateHistory, SalesOrder, CardDetail, BankDetail, Customer, \
    AgentQaReasons
from app.permissions import SalesAgentValidation, AdminValidation, QaAdminValidation, QaAgentValidation


class QaOrderlisting(generics.ListAPIView):
    permission_classes = (IsAuthenticated, QaAdminValidation)

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
        queryset = SalesOrder.objects.all().filter(ordersearch(search) & orderfilter1(self.request) & Q(is_draft=False)
                                                   & orderdaterangefilter(from_date, end_date)).order_by(order)
        count = len(queryset)
        return queryset[start_index: end_index], count, current_page, per_page

    def get(self, request, *args, **kwargs):
        try:
            data_obj, count, current_page, per_page = self.get_queryset()
            response_dict = {"currentPage": current_page, "perPage": per_page, "totalEntries": 0, "totalPages": 0}
            if count:
                serializer = QaOrderListingSerializer(data_obj, many=True)
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


class QaSuspiciousOrderlisting(generics.ListAPIView):
    permission_classes = (IsAuthenticated, QaAdminValidation)

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
        queryset = SalesOrder.objects.all().filter(Q(agent_updated_status='not_resolved') & ordersearch(search) & orderfilter2(self.request) & Q(is_draft=False)
                                                   & orderdaterangefilter(from_date, end_date)).order_by(order)
        count = len(queryset)
        return queryset[start_index: end_index], count, current_page, per_page

    def get(self, request, *args, **kwargs):
        try:
            data_obj, count, current_page, per_page = self.get_queryset()
            response_dict = {"currentPage": current_page, "perPage": per_page, "totalEntries": 0, "totalPages": 0}
            if count:
                serializer = QaOrderListingSerializer(data_obj, many=True)
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


class QaOrderStatus(APIView):
    permission_classes = (IsAuthenticated, QaAgentValidation)

    def post(self, request):
        try:
            order_status = ['not_verified', 'verified', 'fraud', 'suspicious', 'other']
            order_id = int(request.data['order_id'])
            try:
                sales_obj = SalesOrder.objects.get(Q(id=order_id) & Q(is_draft=False) & Q(Q(qa_agent__isnull=True) | Q(qa_agent=str(request.user))))
            except SalesOrder.DoesNotExist:
                raise ErrorMessage("Order has been processed by Some other QA")
            try:
                customer_obj = Customer.objects.get(id=sales_obj.customer.id)
            except Customer.DoesNotExist:
                raise ErrorMessage("Customer ID is Invalid")
            sales_obj.qa_agent = request.user
            qa_orderstatus = request.data['order_status']
            if qa_orderstatus not in order_status:
                raise ErrorMessage(f"Order Status must be {order_status} values only")

            qa_reason = str(request.data.get('reason', '')).strip()
            if (qa_orderstatus == 'fraud' or qa_orderstatus == 'suspicious' or qa_orderstatus == 'other') and (qa_reason is None or len(qa_reason) <= 3):
                raise ErrorMessage(f"When order status is {qa_orderstatus}, provide reason too")

            sales_obj.qa_orderstatus = qa_orderstatus
            sales_obj.qa_reason = qa_reason
            if qa_orderstatus == 'verified':
                sales_obj.agent_updated_status = 'resolved'
            else:
                sales_obj.agent_updated_status = 'not_resolved'
            sales_obj.agent_reason = None
            sales_obj.qa_status_updated_timestamp = datetime.datetime.now()
            sales_obj.save()
            data_obj = AgentQaReasons.objects.create(order= sales_obj,agent=request.user, orderstatus=qa_orderstatus, reason=qa_reason)

            return Response({"data": {"is_status_updated": True, 'message': "Order Status Updated Successfully"}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_status_updated": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QaOrderDetail(APIView):
    permission_classes = (IsAuthenticated, QaAdminValidation)

    def get(self, request):
        try:
            order_id = request.query_params.get('order_id')
            try:
                order_obj = SalesOrder.objects.get(Q(id=order_id) & orderfilter1(request) & Q(is_draft=False))
            except SalesOrder.DoesNotExist:
                raise ErrorMessage("Order id is invalid")
            serializer = AgentOrderDetailSerializer(order_obj, many=False)
            return Response({"data": {"is_order_exist": True, 'user': serializer.data}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_order_exist": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AgentResolvedOrderOrderlisting(generics.ListAPIView):
    permission_classes = (IsAuthenticated, QaAdminValidation)

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
        queryset = SalesOrder.objects.all().filter(Q(agent_updated_status='resolved') & ordersearch(search) & orderfilter2(self.request) & Q(is_draft=False)
                                                   & orderdaterangefilter(from_date, end_date)).order_by(order)
        count = len(queryset)
        return queryset[start_index: end_index], count, current_page, per_page

    def get(self, request, *args, **kwargs):
        try:
            data_obj, count, current_page, per_page = self.get_queryset()
            response_dict = {"currentPage": current_page, "perPage": per_page, "totalEntries": 0, "totalPages": 0}
            if count:
                serializer = QaOrderListingSerializer(data_obj, many=True)
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
