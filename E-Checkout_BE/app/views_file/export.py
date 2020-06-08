import datetime
import json
import logging
import math
import re
import sys
import time
import urllib.request
import urllib.parse
import jwt
import xlwt
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import send_mail
from django.db.models import Q
from django.http import JsonResponse, HttpResponse
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
from app.serializers import ProductListingSerializer, OrderListingSerializer
from app.utilities import ErrorMessage, pagination, productsearch, ordersearch, orderfilter, exportfilter, \
    orderdaterangefilter, customerdaterangefilter, productdaterangefilter
from app.models import MyUser, Product, Permission, ProductUpdateHistory, SalesOrder, CardDetail, BankDetail, Customer
from app.permissions import SalesAgentValidation, AdminValidation


class OrderExport(APIView):
    permission_classes = (IsAuthenticated, AdminValidation,)

    def get(self, request):
        try:
            agent_id = request.query_params.get('agent_id', None)

            response = HttpResponse(content_type='application/ms-excel')
            response['Content-Disposition'] = 'attachment; filename="order.xls"'

            wb = xlwt.Workbook(encoding='utf-8')
            ws = wb.add_sheet('Orders')

            # Sheet header, first row
            row_num = 0

            font_style = xlwt.XFStyle()
            font_style.font.bold = True

            columns = ['Agent Id', 'Agent Name', 'First Name', 'Mobile', 'Amount', 'Is Card Payment', 'Is Bank Payment']

            for col_num in range(len(columns)):
                ws.write(row_num, col_num, columns[col_num], font_style)

            # Sheet body, remaining rows
            font_style = xlwt.XFStyle()
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
            rows = SalesOrder.objects.all().filter(exportfilter(agent_id) & orderdaterangefilter(from_date, end_date) &
                                                   Q(is_draft=False)).values_list('agent', 'agent__agent_name',
                                                                                  'customer__first_name', 'mobile',
                                                                                  'total_price',
                                                                                  'is_card_payment',
                                                                                  'is_bank_payment')
            for row in rows:
                row_num += 1
                for col_num in range(len(row)):
                    ws.write(row_num, col_num, str(row[col_num]), font_style)

            wb.save(response)
            return response

        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomerExport(APIView):
    permission_classes = (IsAuthenticated, AdminValidation,)

    def get(self, request):
        try:
            response = HttpResponse(content_type='application/ms-excel')
            response['Content-Disposition'] = 'attachment; filename="customers.xls"'

            wb = xlwt.Workbook(encoding='utf-8')
            ws = wb.add_sheet('Users')

            # Sheet header, first row
            row_num = 0

            font_style = xlwt.XFStyle()
            font_style.font.bold = True

            columns = ['Id', 'First Name', 'Last Name', 'Mobile', 'Email', 'Address1', 'Address2', 'City',
                       'State', 'Country', 'Zip Code', 'Is Card Payment', 'Is Bank Payment', 'Customer Added Date',
                       'Agent Name', 'Shipping Mobile', 'Shipping Email', 'Shipping Address1', 'Shipping Address2',
                       'Shipping City', 'Shipping State', 'Shipping Country', 'Shipping Zip Code', 'Card Number',
                       'Expiry Date', 'CVV', 'Type', 'Company Name', 'Customer Name', 'Account Number',
                       'Routing Number', 'Bank Name']

            for col_num in range(len(columns)):
                ws.write(row_num, col_num, columns[col_num], font_style)

            # Sheet body, remaining rows
            font_style = xlwt.XFStyle()
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
            rows = Customer.objects.all().filter(
                Q(is_active=True) & Q(is_anyone_verified=True) &
                customerdaterangefilter(from_date, end_date)).values_list('id', 'first_name', 'last_name', 'mobile',
                                                                          'email', 'address1', 'address2', 'city',
                                                                          'state', 'country', 'zip_code',
                                                                          'is_card_payment', 'is_bank_payment',
                                                                          'created_timestamp',
                                                                          'agent__agent_name', 's_mobile', 's_email',
                                                                          's_address1', 's_address2', 's_city',
                                                                          's_state', 's_country', 's_zip_code',
                                                                          'card_number', 'expiry_date', 'cvv', 'type',
                                                                          'company_name', 'customer_name',
                                                                          'account_number', 'routing_number', 'bank_name')
            for row in rows:
                row_num += 1
                for col_num in range(len(row)):
                    ws.write(row_num, col_num, str(row[col_num]), font_style)

            wb.save(response)
            return response

        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductExport(APIView):
    permission_classes = (IsAuthenticated, AdminValidation,)

    def get(self, request):
        try:

            response = HttpResponse(content_type='application/ms-excel')
            response['Content-Disposition'] = 'attachment; filename="Product.xls"'

            wb = xlwt.Workbook(encoding='utf-8')
            ws = wb.add_sheet('Products')

            # Sheet header, first row
            row_num = 0

            font_style = xlwt.XFStyle()
            font_style.font.bold = True

            columns = ['Product Id', 'Product Name', 'Product Type', 'Price', 'Created Time', 'Last Updated time']

            for col_num in range(len(columns)):
                ws.write(row_num, col_num, columns[col_num], font_style)

            # Sheet body, remaining rows
            font_style = xlwt.XFStyle()
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
            rows = Product.objects.all().filter(Q(is_active=True)
                                                & productdaterangefilter(from_date, end_date)).values_list('product_id',
                                                                                                           'product_name',
                                                                                                           'product_type',
                                                                                                           'price',
                                                                                                           'created_timestamp',
                                                                                                           'last_updated')
            for row in rows:
                row_num += 1
                for col_num in range(len(row)):
                    ws.write(row_num, col_num, str(row[col_num]), font_style)

            wb.save(response)
            return response

        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AgentExport(APIView):
    permission_classes = (IsAuthenticated, AdminValidation,)

    def get(self, request):
        try:
            response = HttpResponse(content_type='application/ms-excel')
            response['Content-Disposition'] = 'attachment; filename="Agents.xls"'

            wb = xlwt.Workbook(encoding='utf-8')
            ws = wb.add_sheet('Agents List')

            # Sheet header, first row
            row_num = 0

            font_style = xlwt.XFStyle()
            font_style.font.bold = True

            columns = ['Agent Id', 'Agent Name', 'Mobile', 'Email', 'Registered Date']

            for col_num in range(len(columns)):
                ws.write(row_num, col_num, columns[col_num], font_style)

            # Sheet body, remaining rows
            font_style = xlwt.XFStyle()
            rows = MyUser.objects.all().filter(Q(is_agent=True) &
                                               Q(is_active=True)).values_list('agent_id', 'agent_name', 'mobile',
                                                                              'email', 'signup_date')
            for row in rows:
                row_num += 1
                for col_num in range(len(row)):
                    ws.write(row_num, col_num, str(row[col_num]), font_style)

            wb.save(response)
            return response

        except (ParseError, ZeroDivisionError, MultiValueDictKeyError, KeyError, ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "fail", "raw_message": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
