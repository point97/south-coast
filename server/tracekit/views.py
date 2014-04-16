from datetime import datetime

from django.http import HttpResponseBadRequest, HttpResponse
from django.utils import simplejson as json

from tracekit.models import ErrorEntry
from tracekit.signals import tracekit_error

from django.views.decorators.csrf import csrf_exempt
import logging

# Get an instance of a logger
logger = logging.getLogger(__name__)

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[-1]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@csrf_exempt
def error(request):
    if request.method != 'POST':
        return HttpResponseBadRequest('Must be a POST request')

    timestamp = datetime.now()
    stackinfo = request.POST['stackinfo']
    stackinfo_json = json.loads(request.POST['stackinfo'])
    message = stackinfo_json['message']
    message = "{0}\nCLIENT IP: {1}\n".format(message, get_client_ip(request))

    ErrorEntry.objects.create(message=message, timestamp=timestamp, stack_info=stackinfo)
    tracekit_error.send(ErrorEntry, message=message, timestamp=timestamp, stackinfo=stackinfo_json)
    logger.error(message)
    return HttpResponse('OK; timestamp: {timestamp}'.format(timestamp=timestamp), content_type='text/html')
