from django.conf import settings

if 'django.contrib.staticfiles' in settings.INSTALLED_APPS:
    from django.contrib.staticfiles.templatetags.staticfiles import static
else:
    from django.templatetags.static import static


DEBUG_JS = '' if settings.DEBUG else '.min'

LOGIN_REQUIRED = getattr(settings, 'TRACEKIT_LOGIN_REQUIRED', True)

TRACEKIT_JS_URL = getattr(settings, 'TRACEKIT_JS_URL', static('tracekit/js/tracekit.js'))
JQUERY_JS_URL = getattr(settings, 'TRACEKIT_JQUERY_JS_URL', static('admin/js/jquery.min.js'))
JSON3_JS_URL = getattr(settings, 'TRACEKIT_UNDERSCORE_JS_URL', static('tracekit/js/json3.min.js'))
REQWEST_JS_URL = getattr(settings, 'TRACEKIT_UNDERSCORE_JS_URL', static('tracekit/js/reqwest.min.js'))
UNDERSCORE_JS_URL = getattr(settings, 'TRACEKIT_UNDERSCORE_JS_URL', static('tracekit/js/underscore.min.js'))
TRACEKIT_ADMIN_JS_URL = getattr(settings, 'TRACEKIT_JS_URL', static('tracekit/js/tracekit-admin.js'))
