from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views import View
import json
from tolerancestackup.stackup import Stackup


def view(request):
    return HttpResponse("Hello world.")


class TolStack(View):
    def get(self, request):
        return render(request, "tolerancestackup/page.html")


def js_response(request):
    data = json.loads(request.body)
    # Convert to list to make jsonable
    return_data = Stackup(data).calc_stack().tolist()

    print("Data Sent")
    return JsonResponse({"values": return_data}, status=200)
