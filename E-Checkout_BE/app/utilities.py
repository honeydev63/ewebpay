import datetime
import http
import json
import random
import io
import jwt
from datetime import date
import time

import requests
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status, generics, authentication

from app.models import SalesOrder, Otp
from e_checkout import constant_values
from e_checkout.settings import EMAIL_HOST_USER
import telnyx
# for docusign
import base64, os
from docusign_esign import ApiClient, EnvelopesApi, EnvelopeDefinition, Signer, SignHere, Tabs, Recipients, Document, CarbonCopy, TemplatesApi, TemplateRole, CompositeTemplate, InlineTemplate, FullName, Text, ServerTemplate, UsersApi


class ErrorMessage(Exception):
    def __init__(self, message):
        self.message = message


def pagination(pagination_params_current_page, pagination_params_per_page):
    START_INDEX = (int(pagination_params_per_page) * (int(pagination_params_current_page) - 1))
    END_INDEX = int(pagination_params_current_page) * int(pagination_params_per_page)
    LIMIT = int(pagination_params_per_page)
    OFFSET = START_INDEX
    return START_INDEX, END_INDEX


def productsearch(search):
    if search:
        return Q(product_name__icontains=search) | Q(product_type__icontains=search) | Q(product_id__icontains=search)
    else:
        return Q()


def agentsearch(search):
    if search:
        return Q(agent_id__icontains=search) | Q(agent_name__icontains=search) | Q(mobile__icontains=search)
    else:
        return Q()

def merchantsearch(search):
    if search:
        return Q(agent_id__icontains=search) | Q(agent_name__icontains=search) | Q(mobile__icontains=search)
    else:
        return Q()


def incentivesearch(search):
    if search:
        return Q(name__icontains=search) | Q(type__icontains=search) | Q(target_amount__icontains=search)
    else:
        return Q()


def agenincentivesearch(search):
    if search:
        return Q(agent__agent_name__icontains=search) | Q(incentive__name__icontains=search)
    else:
        return Q()


def ordersearch(search):
    if search:
        return Q(id__icontains=search) | Q(customer__first_name__icontains=search) | Q(mobile__icontains=search) | Q(email__icontains=search)
    else:
        return Q()


def customerlistingsearch(search):
    if search:
        return Q(company_name__icontains=search) | Q(customer_name__icontains=search) | Q(first_name__icontains=search)
    else:
        return Q()


def orderfilter(request):
    if request.user.is_superuser:
        agent_id = request.query_params.get('agent_id', None)
        return Q(agent=agent_id) if agent_id else Q()
    else:
        return Q(agent=request.user.agent_id)


def orderfilter1(request):
    if request.user.is_superuser:
        agent_id = request.query_params.get('agent_id', None)
        return Q(qa_agent=agent_id) if agent_id else Q()
    else:
        return Q(Q(qa_agent=request.user.agent_id) | Q(qa_agent__isnull=True))


def orderfilter2(request):
    if request.user.is_superuser:
        agent_id = request.query_params.get('agent_id', None)
        return Q(qa_agent=agent_id) & Q(Q(qa_orderstatus='fraud') | Q(qa_orderstatus='suspicious') | Q(qa_orderstatus='other')) if agent_id else Q(Q(qa_orderstatus='fraud') | Q(qa_orderstatus='suspicious') | Q(qa_orderstatus='other'))
    else:
        return Q(qa_agent=request.user.agent_id) & Q(Q(qa_orderstatus='fraud') | Q(qa_orderstatus='suspicious') | Q(qa_orderstatus='other'))


def orderfilter3(request):
    if request.user.is_superuser:
        agent_id = request.query_params.get('agent_id', None)
        return Q(agent=agent_id) if agent_id else Q(Q(qa_orderstatus='fraud') | Q(qa_orderstatus='suspicious') | Q(qa_orderstatus='other'))
    else:
        return Q(agent_updated_status='not_resolved') & Q(agent=request.user.agent_id) & Q(Q(qa_orderstatus='fraud') | Q(qa_orderstatus='suspicious') | Q(qa_orderstatus='other'))


def orderfilter4(request):
    return Q(agent_updated_status='not_resolved') & Q(agent=request.user.agent_id) & Q(Q(qa_orderstatus='fraud') | Q(qa_orderstatus='suspicious') | Q(qa_orderstatus='other'))


def orderdetailfilter(request):
    if request.user.is_superuser:
        return Q()
    else:
        return Q(agent=request.user.agent_id)


def agentfilter(request):
    if request.user.is_superuser:
        agent_id = request.query_params.get('agent_id', None)
        return Q(agent=agent_id) if agent_id else Q()
    else:
        return Q(agent=request.user.agent_id)


def exportfilter(agent_id):
    if agent_id:
        return Q(agent=agent_id)
    else:
        return Q()


def lengthvalidator(value):
    if len(str(value)) <= 3 or len(str(value))>= 15:
        raise ErrorMessage(f"{value} must be minimum 3 or maximum 15 character allowed")


def orderdaterangefilter(from_date, to_date):
    if from_date and to_date:
        return Q(created_timestamp__range=(from_date, to_date))
    else:
        return Q()


def customerdaterangefilter(from_date, to_date):
    if from_date and to_date:
        return Q(created_timestamp__range=(from_date, to_date))
    else:
        return Q()


def productdaterangefilter(from_date, to_date):
    if from_date and to_date:
        return Q(created_timestamp__range=(from_date, to_date))
    else:
        return Q()


def sendotp1(mobile, otp):
    # template_id = settings.MSG91_TEMPLATE_ID
    # conn = http.client.HTTPSConnection("api.msg91.com")
    # payload = ""
    # headers = {'content-type': "application/json"}
    # msg91link = f"https://api.msg91.com/api/v5/otp?otp={otp}&template_id={template_id}&mobile={mobile}&authkey={settings.AUTHKEY1}"
    # conn.request("POST", msg91link, payload, headers)
    # res = conn.getresponse()
    #
    # data = res.read()
    # response = json.loads(data.decode('utf-8'))

    telnyx.api_key = constant_values.TELNYX_KEY

    your_telnyx_number = "+18554590160"
    destination_number = f"+1{mobile}"

    response = telnyx.Message.create(
        from_=your_telnyx_number,
        to=destination_number,
        text=f"{constant_values.CUSTOMER_OTP_MESSAGE}{otp}",
    )
    return response


def sendorderlinkonmobile(mobile, url):
    # template_id = settings.MSG91_TEMPLATE_ID
    # conn = http.client.HTTPSConnection("api.msg91.com")
    # payload = ""
    # headers = {'content-type': "application/json"}
    # msg91link = f"https://api.msg91.com/api/v5/otp?otp={otp}&template_id={template_id}&mobile={mobile}&authkey={settings.AUTHKEY1}"
    # conn.request("POST", msg91link, payload, headers)
    # res = conn.getresponse()
    #
    # data = res.read()
    # response = json.loads(data.decode('utf-8'))
    try:

        telnyx.api_key = constant_values.TELNYX_KEY

        your_telnyx_number = "+18554590160"
        destination_number = f"+1{mobile}"

        response = telnyx.Message.create(
            from_=your_telnyx_number,
            to=destination_number,
            text=f"{constant_values.CUSTOMER_ORDER_TEMPLATE}{str(url)}",
        )
    except:
        pass


def sendemailotp(email, otp):
    subject = 'Welcome to eWebPay'
    message = f'Your OTP is {otp}'
    recepient = email
    send_mail(subject, message, EMAIL_HOST_USER, [recepient], fail_silently=True)


def sendemailcustomer(email, customer_id):
    subject = 'Welcome to eWebPay'
    message = f'Your Customer ID is {customer_id}'
    recepient = email
    send_mail(subject, message, EMAIL_HOST_USER, [recepient], fail_silently=True)


def sendcheckoutmail(email, url):
    subject = 'Welcome to eWebPay'
    message = f'Your Checkout url is {str(url)}'
    recepient = email
    send_mail(subject, message, EMAIL_HOST_USER, [recepient], fail_silently=True)


def sendworkorder(email):
    subject = 'Welcome to eWebPay'
    message = f'We have your work order here'
    recepient = email
    send_mail(subject, message, EMAIL_HOST_USER, [recepient], fail_silently=True)
    return {"status": True, "message": "Success"}


def processorder(customer_id):
    time_now = datetime.datetime.now()
    sales_obj1 = SalesOrder.objects.filter(customer=customer_id)
    for i in sales_obj1:
        if i.is_card_payment:
            i.order_card.update(is_draft=False)
        if i.is_bank_payment:
            i.order_bank.update(is_draft=False)
        i.is_draft = False
        i.verified_timestamp = time_now
        i.save()


def sendotpsave(mobile, email):
    if mobile:
        try:
            otp_obj1 = Otp.objects.filter(Q(input=mobile)
                                          & Q(expiry_time__gte=datetime.datetime.now())).latest('created_time')
            if otp_obj1.attempts >= constant_values.ATTEMPTSFOROTP:
                otp = random.randint(100001, 999999)
                otp_obj1 = Otp.objects.create(input=mobile, otp=otp,
                                              expiry_time=datetime.datetime.now() + datetime.timedelta(minutes=settings.OTP_EXPIRY_TIME))

            otp = otp_obj1.otp
        except Otp.DoesNotExist:
            otp = random.randint(100001, 999999)
            otp_obj1 = Otp.objects.create(input=mobile, otp=otp, expiry_time=datetime.datetime.now() + datetime.timedelta(minutes=settings.OTP_EXPIRY_TIME))
        telnyx_response = sendotp1(mobile, otp)
        otp_obj1.service_id = telnyx_response['id']
        otp_obj1.save()
        # print("mobile otp is---- ", otp)

    if email:
        try:
            otp_obj1 = Otp.objects.filter(Q(input=email)
                                          & Q(expiry_time__gte=datetime.datetime.now())).latest('created_time')
            if otp_obj1.attempts >= constant_values.ATTEMPTSFOROTP:
                otp = random.randint(100001, 999999)
                otp_obj1 = Otp.objects.create(input=email, otp=otp,
                                              expiry_time=datetime.datetime.now() + datetime.timedelta(minutes=settings.OTP_EXPIRY_TIME))

            otp = otp_obj1.otp
        except Otp.DoesNotExist:
            otp = random.randint(100001, 999999)
            otp_obj1 = Otp.objects.create(input=email, otp=otp,
                                          expiry_time=datetime.datetime.now() + datetime.timedelta(minutes=settings.OTP_EXPIRY_TIME))
        sendemailotp(email, otp)
        otp_obj1.save()
        # print("email otp is---- ", otp)



def sendotpsave(mobile, email):
    if mobile:
        try:
            otp_obj1 = Otp.objects.filter(Q(input=mobile)
                                          & Q(expiry_time__gte=datetime.datetime.now())).latest('created_time')
            if otp_obj1.attempts >= constant_values.ATTEMPTSFOROTP:
                otp = random.randint(100001, 999999)
                otp_obj1 = Otp.objects.create(input=mobile, otp=otp,
                                              expiry_time=datetime.datetime.now() + datetime.timedelta(minutes=settings.OTP_EXPIRY_TIME))

            otp = otp_obj1.otp
        except Otp.DoesNotExist:
            otp = random.randint(100001, 999999)
            otp_obj1 = Otp.objects.create(input=mobile, otp=otp, expiry_time=datetime.datetime.now() + datetime.timedelta(minutes=settings.OTP_EXPIRY_TIME))
        telnyx_response = sendotp1(mobile, otp)
        otp_obj1.service_id = telnyx_response.get('id')
        otp_obj1.save()
        # print("mobile otp is---- ", otp)

    if email:
        try:
            otp_obj1 = Otp.objects.filter(Q(input=email)
                                          & Q(expiry_time__gte=datetime.datetime.now())).latest('created_time')
            if otp_obj1.attempts >= constant_values.ATTEMPTSFOROTP:
                otp = random.randint(100001, 999999)
                otp_obj1 = Otp.objects.create(input=email, otp=otp,
                                              expiry_time=datetime.datetime.now() + datetime.timedelta(minutes=settings.OTP_EXPIRY_TIME))

            otp = otp_obj1.otp
        except Otp.DoesNotExist:
            otp = random.randint(100001, 999999)
            otp_obj1 = Otp.objects.create(input=email, otp=otp,
                                          expiry_time=datetime.datetime.now() + datetime.timedelta(minutes=settings.OTP_EXPIRY_TIME))
        sendemailotp(email, otp)
        otp_obj1.save()
        # print("email otp is---- ", otp)


def verifymobileotp(input, otp):
    try:
        otp_obj1 = Otp.objects.filter(Q(input=input) &
                                      Q(expiry_time__gte=datetime.datetime.now())).latest('created_time')
        if otp_obj1.attempts == constant_values.ATTEMPTSFOROTP:
            return {"status": False, "message": "You tried many times, Generate a new OTP"}

    except Otp.DoesNotExist:
        return {"status": False, "message": "OTP Expired, Generate a New OTP"}

    if otp_obj1.otp == int(otp):
        return {"status": True, "message": "Otp Verified"}
    else:
        otp_obj1.attempts += 1
        otp_obj1.save()
        return {"status": False, "message": "OTP didn't match"}


def verifyemailotp(input, otp):
    try:
        otp_obj1 = Otp.objects.filter(Q(input=input) &
                                      Q(expiry_time__gte=datetime.datetime.now())).latest('created_time')
        if otp_obj1.attempts == constant_values.ATTEMPTSFOROTP:
            return {"status": False, "message": "You tried many times, Generate a new OTP"}

    except Otp.DoesNotExist:
        return {"status": False, "message": "OTP Expired, Generate a New OTP"}

    if otp_obj1.otp == int(otp):
        return {"status": True, "message": "Otp Verified"}
    else:
        otp_obj1.attempts += 1
        otp_obj1.save()
        return {"status": False, "message": "OTP didn't match"}


def addressvalidation(query):
    request1 = requests.get(constant_values.GOOGLE_MAPS_VLIADTION_URL + 'address=' + query +
                            '&key=' + constant_values.MAPS_KEY)
    return request1.json()

def get_access_token():
    #Get Docusign Access Token
    fp = io.open(os.path.join(os.path.dirname(__file__), '../lee.ppk'), 'r')
    private_key = fp.read()
    fp.close()
    encoded = jwt.encode({
        'iss': constant_values.DS_ADMIN_Integration_Key,
        'sub': constant_values.DS_ACCOUND_ID,
        'aud': 'account-d.docusign.com',
        'iat': int(time.time()),
        'exp': int(time.time()) + 3500,
        'scope': 'signature impersonation'
    }, private_key, algorithm='RS256')
    r = requests.post('https://account-d.docusign.com/oauth/token', data='grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion='+encoded.decode('utf-8'), headers={
        'Content-Type': 'application/x-www-form-urlencoded'
    })
    access_token = json.loads(r.content.decode('utf-8'))['access_token']
    return access_token

def get_listTabs(access_token, template_id):
    api_client = ApiClient()
    api_client.host = 'https://demo.docusign.net/restapi'
    api_client.set_default_header("Authorization", "Bearer " + access_token)
    templates_api = TemplatesApi(api_client)
    results = templates_api.list_recipients_with_http_info(constant_values.DS__ACCOUND_ID, template_id, include_tabs="true")
    # if int(results.result_set_size) > 0:
    #     template_id = results.envelope_templates[0].template_id
    # else:
    #     template_id = None
    return results

def make_envelope(template_id, signer_obj, cc_obj):
    """
    Creates envelope
    args -- parameters for the envelope:
    signer_email, signer_name, signer_client_id
    returns an envelope definition
    """

    
    # signer = TemplateRole(
    #     email = signer_obj['email'],
    #     name = signer_obj['name'],
    #     role_name = 'signer'
    # )
    # # Create a cc template role.
    # cc = TemplateRole(
    #     email = cc_obj['email'],
    #     name = cc_obj['name'],
    #     role_name = 'cc')

    # # create the envelope definition
    # envelope_definition = EnvelopeDefinition(
    #     status = "sent", # requests that the envelope be created and sent.
    #     template_id = template_id
    # )

    # # Add the TemplateRole objects to the envelope object
    # envelope_definition.template_roles = [signer, cc]
    
    # Create a signer recipient for the signer role of the server template
    signer1 = Signer(email=signer_obj['email'], name=signer_obj['name'],
                     role_name="signer", recipient_id="1", tabs=signer_obj['tabs']
              )
    # Create the cc recipient
    cc1 = CarbonCopy(email=cc_obj['email'], name=cc_obj['name'],
                     role_name="cc", recipient_id="2"
                    )
    # Recipients object:
    recipients_server_template = Recipients(
        carbon_copies=[cc1], signers=[signer1])
    
    comp_template = CompositeTemplate(
          composite_template_id="1",
          server_templates=[
              ServerTemplate(sequence="1", template_id=template_id)
          ],
          # Add the roles via an inlineTemplate
          inline_templates=[
              InlineTemplate(sequence="1",
                             recipients=recipients_server_template)
          ]
    )
    # 7. create the envelope definition with the composited templates
    envelope_definition = EnvelopeDefinition(
                            status="sent",
                            composite_templates=[comp_template]
    )
    return envelope_definition

def send_document_for_signing(access_token, template_id, signer_obj, cc_obj):
    """
    1. Create the envelope request object
    2. Send the envelope
    """

    # 1. Create the envelope request object
    envelope_definition = make_envelope(template_id, signer_obj, cc_obj)
    # 2. call Envelopes::create API method
    # Exceptions will be caught by the calling function
    api_client = ApiClient()
    api_client.host = 'https://demo.docusign.net/restapi'
    api_client.set_default_header("Authorization", "Bearer " + access_token)
    envelope_api = EnvelopesApi(api_client)
    results = envelope_api.create_envelope(constant_values.DS__ACCOUND_ID, envelope_definition=envelope_definition)
    envelope_id = results.envelope_id
    return {'envelope_id': envelope_id}

def get_document(access_token, envelope_id):
    api_client = ApiClient()
    api_client.host = 'https://demo.docusign.net/restapi'
    api_client.set_default_header("Authorization", "Bearer " + access_token)
    envelope_api = EnvelopesApi(api_client)
    result = envelope_api.get_envelope(constant_values.DS__ACCOUND_ID, envelope_id, include="custom_fields,recipients,tabs,documents")
    print(result)
    return result

def creat_docusign_user(access_token, new_user_obj):
    api_client = ApiClient()
    api_client.host = 'https://demo.docusign.net/restapi'
    api_client.set_default_header("Authorization", "Bearer " + access_token)
    user_api = UsersApi(api_client)
    result = user_api.create(constant_values.DS__ACCOUND_ID, new_users_definition=new_user_obj)
    print(result)
    return result