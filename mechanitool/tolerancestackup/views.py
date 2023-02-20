from django.http import HttpResponse
from django.shortcuts import render
from django.views import View

def view(request):
    return HttpResponse("Hello world.")

class TolStack(View):
    def get(self, request):
        return render(request, "tolerancestackup/page.html")