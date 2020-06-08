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
    WorkOrderListingSerializer, IncentiveListingSerializer, IncentiveDetailSerializer, IncentiveAgentListingSerializer, \
    IncentiveAgentDetailSerializer, IncentiveAllListingSerializer
from app.utilities import ErrorMessage, pagination, productsearch, ordersearch, orderfilter, orderdetailfilter, \
    orderdaterangefilter, sendotp1, verifymobileotp, processorder, sendotpsave, sendworkorder, incentivesearch, \
    agenincentivesearch
from app.models import MyUser, Product, Permission, ProductUpdateHistory, SalesOrder, CardDetail, BankDetail, Customer, \
    Incentive, AgentIncentive
from app.permissions import SalesAgentValidation, AdminValidation


class AddIncentive(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def post(self, request):
        try:
            incentive_type_list = ['Monthly', 'Quarterly']
            name = str(request.data['name']).strip()
            type1 = str(request.data['type']).strip()
            target_amount = float(request.data['target_amount'])
            if type1 not in incentive_type_list:
                raise ErrorMessage("Type is Monthly and Quarterly are allowed")
            try:
                Incentive.objects.get(Q(name__iexact=name) & Q(is_active=True))
                raise ErrorMessage("Already Incentive Exists with this name")
            except Incentive.DoesNotExist:
                pass
            incentive_obj = Incentive.objects.create(name=name, type=type1, target_amount=target_amount)
            return Response({"data": {"is_incentive_created": True, 'incentive_id': incentive_obj.id,
                                      'message': "Incentive Created Successfully"}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_incentive_created": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EditIncentive(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def post(self, request):
        try:
            incentive_type_list = ['Monthly', 'Quarterly']
            incentive_id = str(request.data['incentive_id']).strip()
            name = str(request.data['name']).strip()
            type1 = str(request.data['type']).strip()
            target_amount = float(request.data['target_amount'])
            if type1 not in incentive_type_list:
                raise ErrorMessage("Type is Monthly and Quarterly are allowed")
            try:
                incentive_obj = Incentive.objects.get(Q(id=incentive_id) & Q(is_active=True))
            except Incentive.DoesNotExist:
                raise ErrorMessage("Incentive Id is Invalid")
            incentive_obj.name = name
            incentive_obj.type1 = type1
            incentive_obj.target_amount = target_amount
            incentive_obj.save()

            return Response({"data": {"is_incentive_updated": True,
                                      'message': "Incentive Updated Successfully"}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_incentive_updated": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IncentiveAgentMapping(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def post(self, request):
        try:
            incentive_id = int(request.data['incentive_id'])
            agent_id = int(request.data['agent_id'])
            try:
                incentive_obj = Incentive.objects.get(Q(id=incentive_id) & Q(is_active=True))
            except Incentive.DoesNotExist:
                raise ErrorMessage("Incentive ID is Invalid")
            try:
                agent_obj = MyUser.objects.get(Q(agent_id=agent_id) & Q(is_agent=True) & Q(is_active=True))
            except MyUser.DoesNotExist:
                raise ErrorMessage("Agent ID is Invalid")
            try:
                agent_incentive_obj = AgentIncentive.objects.get(Q(is_active=True) & Q(agent=agent_id) &
                                                                 Q(end_timestamp__gte=datetime.datetime.now())
                                                                 & Q(incentive__type=incentive_obj.type))
                raise ErrorMessage(f"Already {incentive_obj.type} incentive has been applied to Agent")
            except AgentIncentive.DoesNotExist:
                pass
            if incentive_obj.type == 'Monthly':
                end_time = datetime.datetime.now() + datetime.timedelta(days=30)
            else:
                end_time = datetime.datetime.now() + datetime.timedelta(days=120)
            AgentIncentive.objects.create(incentive=incentive_obj, agent=agent_obj, end_timestamp=end_time)

            return Response({"data": {"is_incentive_mapped": True,
                                      'message': "Incentive assigned to Agent Successfully"}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_incentive_mapped": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IncentiveDelete(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def delete(self, request):
        try:
            incentive_id = request.query_params.get('incentive_id')
            try:
                incentive_obj = Incentive.objects.get(Q(id=incentive_id) & Q(is_active=True))
            except Incentive.DoesNotExist:
                raise ErrorMessage("Incentive Id is invalid")
            incentive_obj.is_active = False
            incentive_obj.save()
            incentive_agent_obj = AgentIncentive.objects.filter(
                Q(is_active=True) & Q(incentive=incentive_id) & Q(end_timestamp__gte=datetime.datetime.now()))
            incentive_agent_obj.update(is_active=False)
            # incentive_agent_obj.save()
            return Response({"data": {"is_incentive_deleted": True, 'message': 'Incentive Deleted successfully'}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_incentive_deleted": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class Incentivelisting(generics.ListAPIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def get_queryset(self):
        sorting_values = ['id', '-id', 'name', '-name', 'type', '-type', 'target_amount', '-target_amount']
        current_page = int(self.request.query_params.get('currentPage', settings.DEFAULTPAGE))
        per_page = int(self.request.query_params.get('perPage', settings.DEFAULTPRODUCTSPERPGE))
        search = self.request.query_params.get('search')
        order = self.request.query_params.get('order') if self.request.query_params.get(
            'order') in sorting_values else '-id'

        pagination_dataset = pagination(current_page, per_page)
        start_index = pagination_dataset[0]
        end_index = pagination_dataset[1]
        queryset = Incentive.objects.all().filter(
            Q(is_active=True) & Q(is_suspended=False) & Q(incentivesearch(search))).order_by(order)
        count = len(queryset)
        return queryset[start_index: end_index], count, current_page, per_page

    def get(self, request, *args, **kwargs):
        try:
            data_obj, count, current_page, per_page = self.get_queryset()
            response_dict = {"currentPage": current_page, "perPage": per_page, "totalEntries": 0, "totalPages": 0}
            if count:
                serializer = IncentiveListingSerializer(data_obj, many=True)
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


class AllIncentiveListing(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def get(self, request):
        try:
            incentive_obj = Incentive.objects.filter(Q(is_suspended=False) & Q(is_active=True)).order_by('name')
            serializer = IncentiveAllListingSerializer(incentive_obj, many=True)
            return Response({"data": {'incentive': serializer.data}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IncentiveDetail(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def get(self, request):
        try:
            incentive_id = request.query_params.get('incentive_id')
            try:
                incentive_obj = Incentive.objects.get(Q(id=incentive_id) & Q(is_suspended=False) & Q(is_active=True))
            except Incentive.DoesNotExist:
                raise ErrorMessage("Incentive ID is Invalid")
            serializer = IncentiveDetailSerializer(incentive_obj, many=False)
            return Response({"data": {"is_incentive_exist": True, 'incentive': serializer.data}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_incentive_exist": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IncentiveAgentlisting(generics.ListAPIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def get_queryset(self):
        sorting_values = ['id', '-id', 'incentive__name', '-incentive__name', 'agent__agent_name', '-agent__agent_name',
                          'incentive__target_amount', '-incentive__target_amount', 'end_timestamp', '-end_timestamp']
        current_page = int(self.request.query_params.get('currentPage', settings.DEFAULTPAGE))
        per_page = int(self.request.query_params.get('perPage', settings.DEFAULTPRODUCTSPERPGE))
        search = self.request.query_params.get('search')
        order = self.request.query_params.get('order') if self.request.query_params.get(
            'order') in sorting_values else '-id'

        pagination_dataset = pagination(current_page, per_page)
        start_index = pagination_dataset[0]
        end_index = pagination_dataset[1]
        queryset = AgentIncentive.objects.all().filter(Q(is_active=True) & Q(agenincentivesearch(search))).order_by(
            order)
        count = len(queryset)
        return queryset[start_index: end_index], count, current_page, per_page

    def get(self, request, *args, **kwargs):
        try:
            data_obj, count, current_page, per_page = self.get_queryset()
            response_dict = {"currentPage": current_page, "perPage": per_page, "totalEntries": 0, "totalPages": 0}
            if count:
                serializer = IncentiveAgentListingSerializer(data_obj, many=True)
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


class IncentiveAgentDelete(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def delete(self, request):
        try:
            incentive_agent_id = request.query_params.get('incentive_agent_id')
            try:
                incentive_agent_obj = AgentIncentive.objects.get(Q(id=incentive_agent_id) & Q(is_active=True))
            except AgentIncentive.DoesNotExist:
                raise ErrorMessage("IncentiveAgent Id is invalid")
            incentive_agent_obj.is_active = False
            incentive_agent_obj.is_suspended = True
            incentive_agent_obj.save()

            return Response({"data": {"is_incentive_agent_deleted": True, 'message': 'Incentive Deleted successfully'}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_incentive_agent_deleted": False, 'message': e.message}},
                            status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IncentiveAgentDetail(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def get(self, request):
        try:
            incentive_agent_id = request.query_params.get('incentive_agent_id')
            try:
                incentive_agent_obj = AgentIncentive.objects.get(Q(id=incentive_agent_id) & Q(is_active=True))
            except AgentIncentive.DoesNotExist:
                raise ErrorMessage("IncentiveAgent ID is Invalid")
            serializer = IncentiveAgentDetailSerializer(incentive_agent_obj, many=False)
            return Response({"data": {"is_incentive_agent_exist": True, 'incentive_agent': serializer.data}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_incentive_agent_exist": False, 'message': e.message}},
                            status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
