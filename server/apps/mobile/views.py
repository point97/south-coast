from django.http import HttpResponse, HttpResponseRedirect
from django.conf import settings
import simplejson
import datetime
import path
import re
import logging
logger = logging.getLogger(__name__)
def getVersion(request):    
    logger.info('get version')
    with open(settings.PROJECT_ROOT / '../mobile/www/config.xml') as f:
        content = f.read()
        version = re.search('version="(\d+\.\d+\.\d+)"', content).group(1)
    return HttpResponse(simplejson.dumps({'success': True, 'version': version }))

def error(request):
    dkdkdk