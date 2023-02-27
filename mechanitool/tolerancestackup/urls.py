from django.urls import path, re_path, include
from . import views
from rest_framework import routers


urlpatterns = [
    path('calc', views.calc_stack),
    path('add', views.save_stack),
    path('stacks/<int:id>', views.load_stack),
    path('', views.TolStack.as_view()),
    re_path(r'.*', views.TolStack.as_view()),


]
