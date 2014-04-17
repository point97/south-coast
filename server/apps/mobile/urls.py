from django.conf.urls import *
from views import *


urlpatterns = patterns('',
	(r'^getVersion', getVersion),
    (r'^error', error),
)