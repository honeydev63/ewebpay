from django.conf.urls import url
from django.urls import path

from app.views_file.account import *
from app.views_file.agent_order import *
from app.views_file.dashboard import *
from app.views_file.attendance import *
from app.views_file.customer import *
from app.views_file.draft_orders import *
from app.views_file.export import *
from app.views_file.incentive import *
from app.views_file.order import *
from app.views_file.product import *
from app.views_file.sales_agent import *
from app.views_file.qa_agent import *
from app.views_file.qa_order import *
from app.views_file.merchant import *
from . import utilities

urlpatterns = [
    # Log API
    path('login/', Login.as_view()),
    path('logout/', Logout.as_view()),

    path('product/add/', AddProduct.as_view()),
    path('product/listing/', Productlisting.as_view()),
    path('product/edit/', ProductEdit.as_view()),
    path('product/delete/', ProductDelete.as_view()),
    path('product/detail/', ProductDetail.as_view()),
    path('product/all/detail/', AllProductDetail.as_view()),

    path('agent/add/', AgentAdd.as_view()),
    path('agent/listing/', Agentlisting.as_view()),
    path('agent/detail/', AgentDetail.as_view()),
    path('agent/password/reset/', AgentPasswordReset.as_view()),
    path('agent/delete/', AgentDelete.as_view()),
    path('agent/edit/', AgentEdit.as_view()),
    path('agent/all/detail/', AllAgentListing.as_view()),

    path('order/product/price/calculation/', ProductPrice.as_view()),
    path('order/checkout/bank/', CheckoutBank.as_view()),
    path('order/checkout/card/', CheckoutCard.as_view()),
    # path('order/card/detail/', CardDetailStore.as_view()),
    # path('order/bank/detail/', BankDetailStore.as_view()),
    path('order/listing/', Orderlisting.as_view()),
    path('order/detail/', OrderDetail.as_view()),
    path('order/verification/', CustomerVerification.as_view()),
    path('order/otp/resend/', ResendOtp.as_view()),
    path('order/create/', OrderCreateEmail.as_view()),
    path('order/checkout/detail/', CheckoutOrderDetail.as_view()),
    path('order/checkout/process/', CheckoutOrderEmail.as_view()),

    path('maps/address/autocomplete/', MapsAddressResults.as_view()),

    path('work/order/listing/', WorkOrderlisting.as_view()),
    path('work/order/status/change/', WorkOrderStatus.as_view()),
    path('work/order/resend/', ResendWorkOrder.as_view()),
    path('work/order/resend_docusign/', ResendDocuSign.as_view()),
    path('work/order/remove/', WorkOrderRemove.as_view()),

    path('orders/export/', OrderExport.as_view()),
    path('customer/export/', CustomerExport.as_view()),
    path('product/export/', ProductExport.as_view()),
    path('agent/export/', AgentExport.as_view()),

    path('customer/listing/', Customerlisting.as_view()),
    path('customer/delete/', CustomerDelete.as_view()),
    path('customer/detail/', CustomerDetail.as_view()),
    path('customer/edit/', CustomerEdit.as_view()),
    path('customer/all/detail/', AllCustomerDetail1.as_view()),
    # path('customer/create/', AddCustomer.as_view()),
    path('customer/add/', CustomerCreate.as_view()),
    path('customer/add/resend/', ResendCustomerCreateOTP.as_view()),
    path('customer/add/verify/', CustomerCreateVerification.as_view()),

    path('incentive/create/', AddIncentive.as_view()),
    path('incentive/edit/', EditIncentive.as_view()),
    path('incentive/listing/', Incentivelisting.as_view()),
    path('incentive/detail/', IncentiveDetail.as_view()),
    path('incentive/delete/', IncentiveDelete.as_view()),
    path('incentive/all/detail/', AllIncentiveListing.as_view()),

    path('incentive/agent/mapping/', IncentiveAgentMapping.as_view()),
    path('incentive/agent/listing/', IncentiveAgentlisting.as_view()),
    path('incentive/agent/delete/', IncentiveAgentDelete.as_view()),
    path('incentive/agent/detail/', IncentiveAgentDetail.as_view()),

    path('draft/order/listing/', DraftOrderlisting.as_view()),
    path('draft/order/detail/', DraftOrderDetail.as_view()),
    path('draft/order/otp/send/', DraftOrderOTP.as_view()),

    path('agent/dashboard/', AgentDashboard.as_view()),
    path('admin/dashboard/', AdminDashboard.as_view()),
    path('agent/dashboard/search/', AgentDashboardSearch.as_view()),
    path('clock/dashboard/', AttendanceDashBoard.as_view()),
    path('admin/dashboard/search/', AdminDashboardSearch.as_view()),

    path('clock/in/', ClockIn.as_view()),
    path('clock/out/', ClockOut.as_view()),

    path('qa/agent/add/', QaAgentAdd.as_view()),
    path('qa/agent/listing/', QaAgentlisting.as_view()),
    path('qa/agent/detail/', QaAgentDetail.as_view()),
    path('qa/agent/password/reset/', QaAgentPasswordReset.as_view()),
    path('qa/agent/delete/', QaAgentDelete.as_view()),
    path('qa/agent/edit/', QaAgentEdit.as_view()),

    path('qa/order/listing/', QaOrderlisting.as_view()),
    path('qa/order/status/', QaOrderStatus.as_view()),
    path('qa/marked/order/listing/', QaSuspiciousOrderlisting.as_view()),
    path('qa/order/detail/', QaOrderDetail.as_view()),
    path('qa/agent/resolved/order/listing/', AgentResolvedOrderOrderlisting.as_view()),

    path('agent/mark/order/listing/', MarkedOrderlisting.as_view()),
    path('agent/order/detail/', AgentOrderDetail.as_view()),
    path('agent/order/status/', AgentOrderStatus.as_view()),

    path('merchant/add/', MerchantAdd.as_view()),
    path('merchant/listing/', Merchantlisting.as_view()),

    path('test123/', TestApi.as_view()),
]