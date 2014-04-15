from datetime import datetime

from django.db import models
from django.utils.translation import ugettext_lazy as _


class ErrorEntry(models.Model):
    message = models.CharField(max_length=255, db_index=True, verbose_name=_('message'))
    timestamp = models.DateTimeField(default=datetime.now, db_index=True, verbose_name=_('timestamp'))
    stack_info = models.TextField(verbose_name=_('stack information'))

    class Meta:
        verbose_name = _('error entry')
        verbose_name_plural = _('error entries')
        ordering = ('-timestamp', )
