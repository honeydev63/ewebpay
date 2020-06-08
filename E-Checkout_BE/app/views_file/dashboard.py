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


class AgentDashboard(APIView):
    permission_classes = (IsAuthenticated, SalesAgentValidation)

    def get(self, request):
        try:
            agent_id = str(request.user.agent_id)
            from_date = self.request.query_params.get('from_date', None)
            end_date = self.request.query_params.get('end_date', None)
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
            try:
                user_obj = MyUser.objects.get(Q(agent_id=agent_id) & Q(is_active=True) & Q(is_agent=True))
            except MyUser.DoesNotExist:
                raise ErrorMessage("Agent Id is invalid")
            sales_obj = SalesOrder.objects.filter(Q(agent=agent_id) & Q(is_draft=False))
            values = sales_obj.aggregate(total_sales=Count('id'), revenue=Sum('total_price'))
            # active_incentive_list = list(AgentIncentive.objects.filter(
            #     Q(agent=agent_id) & Q(is_active=True) & Q(end_timestamp__gte=datetime.datetime.now())).values_list(
            #     'incentive', flat=True))
            # incentive_obj = Incentive.objects.filter(id__in=active_incentive_list)
            # serializer = IncentiveAgent1ListingSerializer(incentive_obj, many=True)
            start_date_month = datetime.datetime.now() - datetime.timedelta(days=30)
            last_date = datetime.datetime.now()
            total_sales_monthly = sales_obj.filter(orderdaterangefilter(start_date_month,
                                                                        last_date)).aggregate(
                total_revenue=Sum('total_price'))
            start_date_quarterly = datetime.datetime.now() - datetime.timedelta(days=120)

            total_sales_quarterly = sales_obj.filter(orderdaterangefilter(start_date_quarterly,
                                                                          last_date)).aggregate(
                total_revenue=Sum('total_price'))
            try:
                a_i_obj1 = AgentIncentive.objects.get(Q(agent=agent_id) & Q(is_active=True) &
                                                      Q(end_timestamp__gte=datetime.datetime.now()) &
                                                      Q(incentive__type='Monthly'))
                monthly_incentive = {"target_monthly": a_i_obj1.incentive.target_amount,
                                     "revenue_monthly": total_sales_monthly['total_revenue']}

            except AgentIncentive.DoesNotExist:
                monthly_incentive = {"target_monthly": None, "revenue_monthly": total_sales_monthly['total_revenue']}

            try:
                a_i_obj1 = AgentIncentive.objects.get(Q(agent=agent_id) & Q(is_active=True) &
                                                      Q(end_timestamp__gte=datetime.datetime.now()) &
                                                      Q(incentive__type='Quarterly'))
                quarterly_incentive = {"target_quarterly": a_i_obj1.incentive.target_amount,
                                       "revenue_quarterly": total_sales_quarterly['total_revenue']}

            except AgentIncentive.DoesNotExist:
                quarterly_incentive = {"target_quarterly": None,
                                       "revenue_quarterly": total_sales_monthly['total_revenue']}

            return Response({"data": {"total_sales": values['total_sales'], "total_revenue": values['revenue'],
                                      # "incentive": serializer.data,    after sometime it should be enabled
                                      # 'monthly_target': monthly_incentive, 'quarterly_target': quarterly_incentive
                                      }},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AgentDashboardSearch(APIView):
    permission_classes = (IsAuthenticated, SalesAgentValidation)

    def get(self, request):
        try:
            agent_id = str(request.user.agent_id)
            query = request.query_params.get('query')
            if query:
                try:
                    MyUser.objects.get(Q(agent_id=agent_id) & Q(is_active=True))
                except MyUser.DoesNotExist:
                    raise ErrorMessage("Agent Id is invalid")
                sales_obj = SalesOrder.objects.filter(
                    Q(agent=agent_id) & Q(Q(mobile__icontains=query) | Q(email__icontains=query)
                                          | Q(address1__icontains=query) | Q(address2__icontains=query)
                                          | Q(customer__first_name__icontains=query)))[0:10]
                serializer = OrderListingSerializer(sales_obj, many=True)
                return Response({"data": {"results": serializer.data}}, status=status.HTTP_200_OK)
            else:
                raise ErrorMessage("Provide query value")
        except ErrorMessage as e:
            return Response({"data": {'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AttendanceDashBoard(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        is_clocked_out = False
        try:
            agent_id = str(request.user.agent_id)
            total_time = None
            try:
                user_obj = MyUser.objects.get(Q(agent_id=agent_id) & Q(is_active=True))
            except MyUser.DoesNotExist:
                raise ErrorMessage("Agent Id is invalid")
            try:
                attendance_obj = Attendance.objects.get(Q(agent=agent_id) & Q(clock_in__date=datetime.date.today()))
            except Attendance.DoesNotExist:
                raise ErrorMessage("You Can Clock in Now")
            if attendance_obj.clock_out is not None:
                is_clocked_out = True
                total_time = str(attendance_obj.clock_out - attendance_obj.clock_in)

            return Response({"data": {"is_clocked_in": True, "is_clocked_out": is_clocked_out,
                                      "clock_in_time": attendance_obj.clock_in, "today_hours": total_time}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_clocked_in": False, "is_clocked_out": is_clocked_out, 'message': e.message}},
                            status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminDashboardSearch(APIView):
    permission_classes = (IsAuthenticated, AdminValidation,)

    def get(self, request):
        try:
            agent_id = str(request.user.agent_id)
            query = request.query_params.get('query')
            if query:
                try:
                    MyUser.objects.get(Q(agent_id=agent_id) & Q(is_active=True))
                except MyUser.DoesNotExist:
                    raise ErrorMessage("Agent Id is invalid")
                sales_obj = SalesOrder.objects.filter(Q(Q(mobile__icontains=query) | Q(email__icontains=query)
                                                        | Q(address1__icontains=query) | Q(address2__icontains=query)
                                                        | Q(customer__first_name__icontains=query)))[0:10]
                serializer = OrderListingSerializer(sales_obj, many=True)
                return Response({"data": {"results": serializer.data}}, status=status.HTTP_200_OK)
            else:
                raise ErrorMessage("Provide query value")
        except ErrorMessage as e:
            return Response({"data": {'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminDashboard(APIView):
    permission_classes = (IsAuthenticated, AdminValidation,)

    def get(self, request):
        try:
            agent_id = str(request.user.agent_id)
            from_date = self.request.query_params.get('from_date', None)
            end_date = self.request.query_params.get('end_date', None)
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
            try:
                user_obj = MyUser.objects.get(Q(agent_id=agent_id) & Q(is_active=True) & Q(is_superuser=True))
            except MyUser.DoesNotExist:
                raise ErrorMessage("Agent Id is invalid")
            sales_obj = SalesOrder.objects.filter(Q(is_draft=False))
            values = sales_obj.aggregate(total_sales=Count('id'), revenue=Sum('total_price'))
            # active_incentive_list = list(AgentIncentive.objects.filter(
            #     Q(agent=agent_id) & Q(is_active=True) & Q(end_timestamp__gte=datetime.datetime.now())).values_list(
            #     'incentive', flat=True))
            # incentive_obj = Incentive.objects.filter(id__in=active_incentive_list)
            # serializer = IncentiveAgent1ListingSerializer(incentive_obj, many=True)
            # start_date_month = datetime.datetime.now() - datetime.timedelta(days=30)
            # last_date = datetime.datetime.now()
            # total_sales_monthly = sales_obj.filter(orderdaterangefilter(start_date_month,
            #                                                             last_date)).aggregate(
            #     total_revenue=Sum('total_price'))
            # start_date_quarterly = datetime.datetime.now() - datetime.timedelta(days=120)
            #
            # total_sales_quarterly = sales_obj.filter(orderdaterangefilter(start_date_quarterly,
            #                                                               last_date)).aggregate(
            #     total_revenue=Sum('total_price'))

            return Response({"data": {"total_sales": values['total_sales'], "total_revenue": values['revenue'],
                                      # "incentive": serializer.data,    after sometime it should be enabled
                                      }},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
