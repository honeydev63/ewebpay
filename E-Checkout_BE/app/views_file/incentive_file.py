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
from app.serializers import ProductListingSerializer, MyUserListingSerializer
from app.utilities import ErrorMessage, pagination, productsearch, agentsearch
from app.models import MyUser, Product, Permission, ProductUpdateHistory, Incentive
from app.permissions import SalesAgentValidation, AdminValidation


class IncentiveAdd(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def post(self, request):
        try:
            incentive_name = str(request.data['incentive_name']).strip()
            if len(incentive_name) < 4 or len(incentive_name) > 100:
                raise ErrorMessage("Incentive Name should be minimum 3 characters and maximum 100 characters")
            incentive_type_list = ["Revenue", "Count"]
            incentive_type = str(request.data['incentive_type']).strip()
            if incentive_type not in incentive_type_list:
                raise ErrorMessage("Incentive type should be Revenue or Count")

            target = int(request.data['target'])
            if len(str(target)) <= 0:
                raise ErrorMessage("Target cannot be Zero or Negative")
            incentive_obj = Incentive.objects.create(incentive_name=incentive_name, incentive_type=incentive_type,
                                                     target=target)

            return Response({"data": {"is_agent_added": True, "password": random_password,
                                      'message': 'Sales Agent Created successfully'}}, status=status.HTTP_201_CREATED)
        except ErrorMessage as e:
            return Response({"data": {"is_agent_added": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
