from django import template

from tracekit.conf import LOGIN_REQUIRED, TRACEKIT_JS_URL, JSON3_JS_URL, REQWEST_JS_URL
    # , JQUERY_JS_URL

register = template.Library()


@register.inclusion_tag('tracekit/init.html', takes_context=True)
def tracekit_init(context):
    if LOGIN_REQUIRED:
        try:
            is_authenticated = context['user'].is_authenticated()
        except (KeyError, AttributeError):
            is_authenticated = False
    else:
        is_authenticated = True

    return {
        'TRACEKIT_JS_URL': TRACEKIT_JS_URL,
        'JSON3_JS_URL': JSON3_JS_URL,
        'REQWEST_JS_URL': REQWEST_JS_URL,
        'CSRF_TOKEN': context['csrf_token'],
        'is_authenticated': is_authenticated,
    }
