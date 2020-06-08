import json
import logging
import math
import re
import sys
import time
import urllib.request
import urllib.parse
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
from app.serializers import ProductListingSerializer, ProductAllDetailSerializer, ProductDetailSerializer
from app.utilities import ErrorMessage, pagination, productsearch
from app.models import MyUser, Product, Permission, ProductUpdateHistory, Otp
from app.permissions import SalesAgentValidation, AdminValidation, AgentAdminValidation
from e_checkout.settings import EMAIL_HOST_USER


class AddProduct(APIView):
    permission_classes = (IsAuthenticated, AdminValidation, )

    def post(self, request):
        try:
            product_name = str(request.data['product_name']).strip()
            if len(product_name) < 4 or len(product_name) > 100:
                raise ErrorMessage("Product name should be minimum 4 characters and maximum 100 characters")
            try:
                Product.objects.get(Q(product_name__iexact=product_name) & Q(is_active=True))
                raise ErrorMessage("Product name already Exists")
            except Product.DoesNotExist:
                pass
            product_type = str(request.data['product_type']).strip()
            if len(product_type) < 4 or len(product_type) > 100:
                raise ErrorMessage("Product type should be minimum 4 characters and maximum 100 characters")
            price = round(float(request.data['price']), 2)
            if price <= 0:
                raise ErrorMessage("Price cannot be zero and negative")
            product_obj = Product.objects.create(created_by=request.user, product_name=product_name,
                                                 product_type=product_type, price=round(price, 2))
            return Response({"data": {"is_product_added": True, "product_id": product_obj.product_id,
                                      'message': 'Product Created Successfully'}},
                            status=status.HTTP_201_CREATED)
        except ErrorMessage as e:
            return Response({"data": {"is_product_added": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class Productlisting(generics.ListAPIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def get_queryset(self):
        sorting_values = ['product_id', '-product_id', 'product_name', '-product_name', 'product_type', '-product_type',
                          'price', '-price']

        current_page = int(self.request.query_params.get('currentPage', settings.DEFAULTPAGE))
        per_page = int(self.request.query_params.get('perPage', settings.DEFAULTPRODUCTSPERPGE))
        search = self.request.query_params.get('search')
        order = self.request.query_params.get('order') if self.request.query_params.get(
            'order') in sorting_values else '-last_updated'

        pagination_dataset = pagination(current_page, per_page)
        start_index = pagination_dataset[0]
        end_index = pagination_dataset[1]
        queryset = Product.objects.all().filter(productsearch(search) & Q(is_active=True)).order_by(order)
        count = len(queryset)
        return queryset[start_index: end_index if self.request.query_params.get(
            'perPage') else count], count, current_page, per_page

    def get(self, request, *args, **kwargs):
        try:
            data_obj, count, current_page, per_page = self.get_queryset()
            response_dict = {"currentPage": current_page, "perPage": per_page, "totalEntries": 0, "totalPages": 0}
            if count:
                serial = per_page * (current_page-1)
                serializer = ProductListingSerializer(data_obj, many=True, context={'serial': serial})
                response_dict["totalEntries"] = count
                response_dict["totalPages"] = math.ceil(count / per_page)
                data = serializer.data
            else:
                data = []
            return Response({"data": data, "meta": response_dict}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError,
                ObjectDoesNotExist) as e:
            print(e)
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(str(e))
            return Response(
                {"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductEdit(APIView):
    permission_classes = (IsAuthenticated, AdminValidation, )

    def post(self, request):
        try:
            product_id = request.data['product_id']
            try:
                prod_obj = Product.objects.get(Q(product_id=product_id) & Q(is_active=True))
            except Product.DoesNotExist:
                raise ErrorMessage("Product id is not valid")
            product_name = str(request.data['product_name']).strip()
            try:
                prod_obj = Product.objects.get(Q(product_name__iexact=product_name) & Q(is_active=True))
                if prod_obj.product_id != product_id:
                    raise ErrorMessage("Product name already Exists")
            except Product.DoesNotExist:
                pass
            if len(product_name) < 4 or len(product_name) > 100:
                raise ErrorMessage("Product name should be minimum 4 characters and maximum 100 characters")
            product_type = str(request.data['product_type']).strip()
            if len(product_type) < 4 or len(product_type) > 100:
                raise ErrorMessage("Product type should be minimum 4 characters and maximum 100 characters")
            price = round(float(request.data['price']), 2)
            if price <= 0:
                raise ErrorMessage("Price cannot be zero and negative")
            prod_obj.product_name = product_name
            prod_obj.product_type = product_type
            prod_obj.price = price
            prod_obj.save()
            ProductUpdateHistory.objects.create(product_id=prod_obj, updated_price=price, updated_by=request.user)
            return Response({"data": {"is_product_updated": True, 'message': 'Product Updated successfully'}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_product_updated": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductDelete(APIView):
    permission_classes = (IsAuthenticated, AdminValidation, )

    def delete(self, request):
        try:
            product_id = request.query_params.get('product_id')
            try:
                prod_obj = Product.objects.get(Q(product_id=product_id) & Q(is_active=True))
            except Product.DoesNotExist:
                raise ErrorMessage("Product id is invalid")
            prod_obj.is_active = False
            prod_obj.save()
            return Response({"data": {"is_product_deleted": True, 'message': 'Product Deleted successfully'}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_product_deleted": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductDetail(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def get(self, request):
        try:
            product_id = request.query_params.get('product_id')
            try:
                prod_obj = Product.objects.get(Q(product_id=product_id) & Q(is_active=True))
            except Product.DoesNotExist:
                raise ErrorMessage("Product id is invalid")
            serializer = ProductDetailSerializer(prod_obj, many=False)
            return Response({"data": {"is_product_exist": True, 'product': serializer.data}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_product_exist": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AllProductDetail(APIView):
    permission_classes = (IsAuthenticated, AgentAdminValidation)

    def get(self, request):
        try:
            product_obj = Product.objects.all().filter(Q(is_active=True))
            serializer = ProductAllDetailSerializer(product_obj, many=True)
            return Response({"data": {'product': serializer.data}}, status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TestApi(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        try:
            # subject = 'Welcome to eWebPay'
            # message = f'We have your work order here'
            # recepient = "c.dinesh@1tab.com"
            # send_mail(subject, message, EMAIL_HOST_USER, [recepient])
            # import pdb
            # pdb.set_trace()
            #
            # import telnyx
            #
            # # This is a sample test secret API Key
            # # Go to Auth to generate your own secret API Keys
            # telnyx.api_key = "KEY0171539C7CBA6372A51797142C8EA702_17txUaYAAxvgGMRKpzjjQB"
            #+18663139303
            # telnyx.Message.create(
            #     from_="+18663139303",
            #     to="+918179741740",
            #     text="hiiiiiiii",
            #     messaging_profile_id="40017153-bce5-44aa-893b-1a5d15354369"
            # )

            # otp_obj = Otp.objects.get(otp=939012)
            # list = ['product', 'user', 'sales', 'export', 'checkout']
            # for i in list:
            #     product_obj = UserPermissions.objects.create(permission_id=1001, module=i)
            # list1 = ['product', 'user', 'sales', 'checkout']
            # for i in list1:
            #     product_obj = UserPermissions.objects.create(permission_id=1002, module=i)
            # import telnyx
            #
            # telnyx.api_key = "KEY01714A3B921A0A7B31B78102A8570274_kxjSMhX2fVE10EabxrzjjQ"
            #
            # your_telnyx_number = "+918096366340"
            # destination_number = "+918179741740"
            #
            # telnyx.Message.create(
            #     from_=your_telnyx_number,
            #     to=destination_number,
            #     text="Hello, world!",
            # )

            # from django.core.mail import EmailMultiAlternatives
            #
            # subject, from_email, to = 'hello', 'c.dinesh@1tab.com', 'c.dinesh@1tab.com'
            # text_content = 'This is an important message.'
            # html_content = '<p>This is an <strong>important</strong> message.</p>'
            # msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
            # msg.attach_alternative(html_content, "text/html")
            # msg.send()

            # from django.template import loader

            # html_message = loader.render_to_string(
            #     'path/to/your/htm_file.html',
            #     {
            #         'user_name': user.name,
            #         'subject': 'Thank you from' + dynymic_data,
            #     // ...
            # }
            # )
            # send_mail(subject, message, from_email, to_list, fail_silently=True, html_message=html_message)
            # import telnyx
            #
            # telnyx.api_key = "KEY0171C8014B4AF60998A2FDF0AE7B05F4_Z7CMSnG1FuXvOrjyE0In9u"
            #
            # your_telnyx_number = "+18554590160"
            # destination_number = "+12678462671"
            #
            # x = telnyx.Message.create(
            #     from_=your_telnyx_number,
            #     to=destination_number,
            #     text="Hello, world!",
            # )
            # print(x)
            # import requests, json
            #
            # # enter your api key here
            # api_key = 'AIzaSyDEHcIZILhiza8eQSBRltK4LC0O8HGWc6w'
            #
            # # url variable store url
            # url = "https://maps.googleapis.com/maps/api/place/textsearch/json?"
            #
            # # The text string on which to search
            # query = request.query_params.get('query')
            #
            # # get method of requests module
            # # return response object
            # r = requests.get(url + 'query=' + query +
            #                  '&key=' + api_key)
            #
            # # json method of response object convert
            # #  json format data into python format data
            # x = r.json()
            # # print("x value is ---", x)
            #
            # # now x contains list of nested dictionaries
            # # we know dictionary contain key value pair
            # # store the value of result key in variable y
            # y = x['results']
            # # print("y value is ---", y)
            # import googlemaps
            # from datetime import datetime
            #
            # gmaps = googlemaps.Client(key='AIzaSyDEHcIZILhiza8eQSBRltK4LC0O8HGWc6w')
            # y = gmaps.geolocation(query)
            # geolocate
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
                print("@@@@@@@@  ", ip)

            print("---------  ", ip)

            subject = 'Welcome to eWebPay IP'
            message = f'Your Customer ID is {ip}, request meta is {request.META}'
            recepient = 'c.dinesh@1tab.com'
            send_mail(subject, message, EMAIL_HOST_USER, [recepient], fail_silently=True)
            return Response({"data": {"product_id": 'y', 'message': 'Product Created successfully'}},
                            status=status.HTTP_200_OK)
        except ErrorMessage as e:
            return Response({"data": {"is_product_added": False, 'message': e.message}}, status=status.HTTP_200_OK)
        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
