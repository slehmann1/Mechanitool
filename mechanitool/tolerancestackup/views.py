from django.http import HttpResponse
from django.shortcuts import render
from django.views import View
from tolerancestackup.serializers import UserSerializer, GroupSerializer
from django.contrib.auth.models import User, Group
from rest_framework import viewsets, permissions
import json


def view(request):
    return HttpResponse("Hello world.")


class TolStack(View):
    def get(self, request):
        return render(request, "tolerancestackup/page.html")


def js_response(request):
    data = json.loads(request.body)
    print(f"ITEMS: {data}")
    
    return HttpResponse(f"Hello Javascript. {data}")
