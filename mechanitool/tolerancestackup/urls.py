from django.urls import path, include
from . import views
from rest_framework import routers


urlpatterns = [
    path('', views.TolStack.as_view(), name='view'),
    path('api', views.js_response, name='ajax')

] 