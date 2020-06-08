from rest_framework import permissions

from app.models import Permission


class AdminValidation(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        else:
            return False


class SalesAgentValidation(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.user.is_agent:
            return True
        else:
            return False


class QaAgentValidation(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.user.is_qa_agent:
            return True
        else:
            return False


class MerchantValidation(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.user.is_merchant:
            return True
        else:
            return False


class QaAdminValidation(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.user.is_qa_agent or request.user.is_superuser:
            return True
        else:
            return False


class AgentAdminValidation(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.user.is_agent or request.user.is_superuser:
            return True
        else:
            return False
