from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render_to_response
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect

import proxy.views

def getBuoy(request, path):
    remoteurl = 'http://www.ndbc.noaa.gov/get_observation_as_xml.php/' + path
    return proxy.views.proxy_view(request, remoteurl)