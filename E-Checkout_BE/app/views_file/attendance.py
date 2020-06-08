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
from datetime import date

import jwt
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import send_mail
from django.db.models import Q, Sum, Count
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
from app.serializers import ProductListingSerializer, MyUserListingSerializer, IncentiveAgent1ListingSerializer, \
    OrderListingSerializer
from app.utilities import ErrorMessage, pagination, productsearch, agentsearch, orderdaterangefilter
from app.models import MyUser, Product, Permission, ProductUpdateHistory, SalesOrder, AgentIncentive, Incentive, \
    Attendance
from app.permissions import SalesAgentValidation, AdminValidation


class ClockIn(APIView):
    permission_classes = (IsAuthenticated, )

    def get(self, request):
        try:
            agent_id = str(request.user.agent_id)
            try:
                user_obj = MyUser.objects.get(Q(agent_id=agent_id) & Q(is_active=True) & Q(is_agent=True))
            except MyUser.DoesNotExist:
                raise ErrorMessage("Agent Id is invalid")
            current_time = datetime.datetime.now()
            try:
                Attendance.objects.get(Q(agent=agent_id) & Q(clock_in__date=datetime.date.today()))
                raise ErrorMessage("You already Clocked in")
            except Attendance.DoesNotExist:
                Attendance.objects.create(clock_in=current_time, agent=request.user)
            return Response({"data": {"is_clock_in": True, "clock_in_time": current_time}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_clock_in": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClockOut(APIView):
    permission_classes = (IsAuthenticated, )

    def get(self, request):
        try:
            agent_id = str(request.user.agent_id)
            try:
                user_obj = MyUser.objects.get(Q(agent_id=agent_id) & Q(is_active=True) & Q(is_agent=True))
            except MyUser.DoesNotExist:
                raise ErrorMessage("Agent Id is invalid")
            current_time = datetime.datetime.now()
            try:
                attendance_obj = Attendance.objects.get(Q(agent=agent_id) & Q(clock_in__date=datetime.date.today()))
                attendance_obj.clock_out = current_time
                attendance_obj.save()
            except Attendance.DoesNotExist:
                raise ErrorMessage("You didn't clock in, so You can't Clock Out")

            return Response({"data": {"is_clock_out": True, "clock_out_time": current_time}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_clock_out": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
