import json
import time
import uuid

import jwt
from django.conf import settings
from django.contrib.auth import authenticate, login
from django.utils.datastructures import MultiValueDictKeyError
from django.utils.timezone import now
from rest_framework import status
from rest_framework.exceptions import ParseError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_jwt.settings import api_settings

from app.models import MyUser, Permission
from app.utilities import ErrorMessage


class Login(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        try:
            email = request.data['user_input']
            password = request.data['password']
            try:
                user_obj = MyUser.objects.get(email=email)
            except MyUser.DoesNotExist:
                raise ErrorMessage("Email is not registered")
            auth_check = authenticate(username=email, password=password)
            if auth_check:
                user_obj.last_login = now()
                if user_obj.is_superuser:
                    jwt_secret = user_obj.jwt_secret
                else:
                    jwt_secret = uuid.uuid4()
                    user_obj.jwt_secret = jwt_secret
                user_obj.save()
                login(request, auth_check)
                jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
                jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER
                payload = jwt_payload_handler(auth_check)
                token = jwt_encode_handler(payload)
                payload = jwt.decode(token, str(jwt_secret))
                if user_obj.is_superuser:
                    user_role = Permission.admin.value
                elif user_obj.is_agent:
                    user_role = Permission.agent.value
                elif user_obj.is_merchant:
                    user_role = Permission.merchant.value
                else:
                    user_role = Permission.QA.value

                expirydate = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.localtime(payload['exp']))
                return Response({"data": {'isUserLogin': True, "userData": {"user_role": user_role,
                                                                            "user_input": user_obj.agent_name,
                                                                            "tokenDate": expirydate,
                                                                            "token": token}}},
                                status=status.HTTP_200_OK)
            else:
                raise ErrorMessage("Provide valid credentials")
        except ErrorMessage as e:
            return Response({"data": {'isUserLogin': False, "userData": {
                "message": e.message}}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"message": "Exception which is not handled", "error": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class Logout(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        try:
            try:
                user_obj = MyUser.objects.get(agent_id=request.user.agent_id)
            except MyUser.DoesNotExist:
                raise ErrorMessage("User is not Valid")
            user_obj.jwt_secret = uuid.uuid4()
            user_obj.save()
            return Response({"data": {'is_user_logout': True, 'message': "User logged out Successfully"}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {'is_user_logout': False, "message": e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"message": "Exception which is not handled", "error": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
