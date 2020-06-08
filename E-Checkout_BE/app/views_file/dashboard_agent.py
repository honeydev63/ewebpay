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
    WorkOrderListingSerializer
from app.utilities import ErrorMessage, pagination, productsearch, ordersearch, orderfilter, orderdetailfilter, \
    orderdaterangefilter, sendotp1, verifyotp1, processorder, sendotpsave, sendworkorder
from app.models import MyUser, Product, Permission, ProductUpdateHistory, SalesOrder, CardDetail, BankDetail, Customer
from app.permissions import SalesAgentValidation, AdminValidation


class AgentDetail(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def get(self, request):
        try:
            agent_id = request.query_params.get('agent_id')
            try:
                user_obj = MyUser.objects.get(Q(agent_id=agent_id) & Q(is_agent=True) & Q(is_active=True))
            except MyUser.DoesNotExist:
                raise ErrorMessage("Agent ID is Invalid")
            serializer = 1
            return Response({"data": {"is_user_exist": True, 'user': serializer.data}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_user_exist": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
