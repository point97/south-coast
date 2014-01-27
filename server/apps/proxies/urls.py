from django.conf.urls import *
from proxies.views import *


urlpatterns = patterns('',
	(r'^buoys/(?P<path>.*)', getBuoy),
)