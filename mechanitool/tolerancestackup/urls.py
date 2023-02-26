from django.urls import path, include
from . import views
from rest_framework import routers


urlpatterns = [
    path('', views.TolStack.as_view(), name='view'),
    path('api', views.calc_stack),
    path('add', views.save_stack),
    path('stacks/<int:id>', views.load_stack),

]
