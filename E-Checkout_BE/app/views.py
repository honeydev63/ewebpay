from django.shortcuts import render

# Create your views here.


def jwt_get_secret_key(user):
    return user.jwt_secret