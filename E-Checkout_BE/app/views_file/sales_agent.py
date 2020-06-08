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
from app.serializers import ProductListingSerializer, MyUserListingSerializer, PasswordResetSerializer, \
    AgentAllListingSerializer
from app.utilities import ErrorMessage, pagination, productsearch, agentsearch
from app.models import MyUser, Product, Permission, ProductUpdateHistory
from app.permissions import SalesAgentValidation, AdminValidation
from e_checkout.constant_values import regex_3


class AgentAdd(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def post(self, request):
        try:
            agent_name = str(request.data['agent_name']).strip()
            if len(agent_name) < 4 or len(agent_name) > 100:
                raise ErrorMessage("Agent name should be minimum 3 characters and maximum 100 characters")
            mobile = int(request.data['mobile'])
            if len(str(mobile)) != 10 or not regex_3(mobile):
                raise ErrorMessage("Mobile number must be 10 digits")
            email = str(request.data['email']).strip()
            email_check = bool(re.search(r"^[\w\.\+\-]+\@[\w]+\.[a-z]{2,3}$", str(email)))
            if not email_check:
                raise ErrorMessage("Email is not valid")
            try:
                MyUser.objects.get(Q(email=email))
                raise ErrorMessage("Email already registered with us")
            except MyUser.DoesNotExist:
                try:
                    MyUser.objects.get(Q(mobile=mobile) & Q(is_active=True))
                    raise ErrorMessage("Mobile Number already registered with us")
                except MyUser.DoesNotExist:
                    pass

            random_password = str(uuid.uuid4()).replace("-", "")[0:7]
            user_obj = MyUser.objects.create_user(agent_name=agent_name.title(), email=email, password=random_password,
                                                  mobile=mobile)
            user_obj.is_agent = True
            user_obj.is_active = True
            user_obj.signup_date = date.today()
            user_obj.save()
            return Response({"data": {"is_agent_added": True, "password": random_password,
                                      'message': 'Sales Agent Created successfully'}}, status=status.HTTP_201_CREATED)
        except ErrorMessage as e:
            return Response({"data": {"is_agent_added": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class Agentlisting(generics.ListAPIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def get_queryset(self):
        sorting_values = ['agent_id', '-agent_id', 'agent_name', '-agent_name', 'mobile', '-mobile']
        current_page = int(self.request.query_params.get('currentPage', settings.DEFAULTPAGE))
        per_page = int(self.request.query_params.get('perPage', settings.DEFAULTPRODUCTSPERPGE))
        search = self.request.query_params.get('search')
        order = self.request.query_params.get('order') if self.request.query_params.get(
            'order') in sorting_values else 'agent_name'

        pagination_dataset = pagination(current_page, per_page)
        start_index = pagination_dataset[0]
        end_index = pagination_dataset[1]
        queryset = MyUser.objects.all().filter(Q(is_agent=True) & Q(is_active=True) & Q(agentsearch(search))).order_by(order)
        count = len(queryset)
        return queryset[start_index: end_index], count, current_page, per_page

    def get(self, request, *args, **kwargs):
        try:
            data_obj, count, current_page, per_page = self.get_queryset()
            response_dict = {"currentPage": current_page, "perPage": per_page, "totalEntries": 0, "totalPages": 0}
            if count:
                serializer = MyUserListingSerializer(data_obj, many=True)
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


class AgentDetail(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def get(self, request):
        try:
            agent_id = request.query_params.get('agent_id')
            try:
                user_obj = MyUser.objects.get(Q(agent_id=agent_id) & Q(is_agent=True))
            except MyUser.DoesNotExist:
                raise ErrorMessage("Agent ID is Invalid")
            serializer = MyUserListingSerializer(user_obj, many=False)
            return Response({"data": {"is_user_exist": True, 'user': serializer.data}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_user_exist": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AgentPasswordReset(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def post(self, request):
        try:
            agent_id = request.data['agent_id']
            try:
                user_obj = MyUser.objects.get(Q(agent_id=agent_id) & Q(is_active=True)
                                              & Q(is_superuser=False) & Q(is_agent=True))
            except MyUser.DoesNotExist:
                raise ErrorMessage("User id is invalid")
            random_password = str(uuid.uuid4()).replace("-", "")[0:7]
            user_obj.set_password(random_password)
            user_obj.jwt_secret = uuid.uuid4()
            user_obj.save()
            serializer = PasswordResetSerializer(user_obj, many=False)
            return Response(
                {"data": {"is_password_updated": True, 'user': serializer.data, "new_password": random_password}},
                status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_password_updated": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AgentDelete(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def delete(self, request):
        try:
            agent_id = request.query_params.get('agent_id')
            try:
                user_obj = MyUser.objects.get(Q(agent_id=agent_id) & Q(is_active=True) & Q(is_superuser=False) & Q(is_agent=True))
            except MyUser.DoesNotExist:
                raise ErrorMessage("Agent id is invalid")
            user_obj.is_active = False
            user_obj.save()
            return Response({"data": {"is_user_deleted": True, 'message': 'Agent Profile Deleted successfully'}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_user_deleted": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AgentEdit(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def post(self, request):
        try:
            agent_id = int(request.data['agent_id'])
            try:
                agent_obj = MyUser.objects.get(Q(agent_id=agent_id) & Q(is_agent=True) & Q(is_active=True))
            except MyUser.DoesNotExist:
                raise ErrorMessage("Agent ID is Invalid")

            agent_name = request.data['agent_name'].strip()
            if len(agent_name) < 4 or len(agent_name) > 100:
                raise ErrorMessage("Agent name should be minimum 3 characters and maximum 100 characters")
            mobile = int(request.data['mobile'])
            if len(str(mobile)) != 10 or not regex_3(mobile):
                raise ErrorMessage("Provide a Valid Mobile Number")
            try:
                mobile_check_obj = MyUser.objects.get(Q(mobile=mobile) & Q(is_active=True))
                if not mobile_check_obj.agent_id == agent_id:
                    raise ErrorMessage("Mobile already registered with us")
            except MyUser.DoesNotExist:
                pass
            email = request.data['email'].strip()
            email_check = bool(re.search(r"^[\w\.\+\-]+\@[\w]+\.[a-z]{2,3}$", str(email)))
            if not email_check:
                raise ErrorMessage("Email is not valid")
            try:
                email_check_obj = MyUser.objects.get(Q(email=email))
                if not email_check_obj.agent_id == agent_id:
                    raise ErrorMessage("Email already registered with us")
            except MyUser.DoesNotExist:
                pass
            agent_obj.agent_name = agent_name
            agent_obj.mobile = mobile
            agent_obj.email = email
            agent_obj.save()
            return Response({"data": {"is_agent_updated": True,
                                      'message': 'Sales Agent Details Updated successfully'}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_agent_updated": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AllAgentListing(APIView):
    permission_classes = (IsAuthenticated, AdminValidation)

    def get(self, request):
        try:
            agent_obj = MyUser.objects.filter(Q(is_agent=True) & Q(is_active=True)).order_by('agent_name')
            serializer = AgentAllListingSerializer(agent_obj, many=True)
            return Response({"data": {'agent': serializer.data}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
