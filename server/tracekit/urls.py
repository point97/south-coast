from django.conf.urls.defaults import patterns, url
from django.contrib.auth.decorators import login_required

from tracekit.conf import LOGIN_REQUIRED
from tracekit.views import error as _error_view


if LOGIN_REQUIRED:
    error_view = login_required(_error_view)
else:
    error_view = _error_view


urlpatterns = patterns('',
    url(r'^error/$', error_view, name='tracekit_error'),
)
