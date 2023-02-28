from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views import View
import json
from tolerancestackup.stackup import Stackup
from tolerancestackup import models as md


def view(request):
    return HttpResponse("Hello world.")


class TolStack(View):
    def get(self, request):
        return render(request, "tolerancestackup/page.html")


def calc_stack(request):
    print(request)
    data = json.loads(request.body)
    # Convert to list to make jsonable
    try:
        return_data = Stackup(data).calc_stack().tolist()
    except (ValueError):
        return JsonResponse(status=400)
    print("Data Sent")
    return JsonResponse({"values": return_data}, status=200)


def save_stack(request):

    data = json.loads(request.body)
    stack_id = Stackup(data).gen_models()
    return JsonResponse({"id": stack_id}, status=200)


def load_stack(_, id):
    stackup = md.Stackup.objects.get(id=id)
    return JsonResponse(stackup.serialize())
