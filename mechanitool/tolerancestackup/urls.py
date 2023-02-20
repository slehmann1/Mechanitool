from django.urls import path

from . import views

urlpatterns = [
    path('', views.TolStack.as_view(), name='view'),
] 