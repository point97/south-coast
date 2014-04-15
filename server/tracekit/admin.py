from django.contrib import admin

from tracekit.models import ErrorEntry
from tracekit.conf import static, JSON3_JS_URL, JQUERY_JS_URL, TRACEKIT_ADMIN_JS_URL


class ErrorEntryAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'message', 'stack_info')

    class Media:
        js = (JQUERY_JS_URL, JSON3_JS_URL, TRACEKIT_ADMIN_JS_URL, )
        css = {
            'screen': (static('tracekit/css/admin/changelist.css'), )
        }

admin.site.register(ErrorEntry, ErrorEntryAdmin)
