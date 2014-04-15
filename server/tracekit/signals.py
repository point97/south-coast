from django.core.signals import Signal


tracekit_error = Signal(providing_args=['message', 'timestamp', 'stackinfo'])
