from django.db import models
from django.contrib.auth.models import User
import datetime
from django.dispatch import receiver
from django.db.models.signals import post_save


class UserProfile(models.Model):
    user = models.ForeignKey(User, unique=True)
    registration = models.TextField(null=True, blank=True, default=None)

    def __str__(self):
        return "%s" % (self.user.username)

User.profile = property(lambda u: UserProfile.objects.get_or_create(user=u)[0])
#models.signals.post_save.connect(create_api_key, sender=User)

@receiver(post_save, sender=User)
def create_user_api_key(sender, **kwargs):
    """
    Auto-create ApiKey objects using Tastypie's create_api_key    
    """
    from tastypie.models import ApiKey
    ApiKey.objects.get_or_create(user=kwargs.get['instance'])
    # create_api_key(User, **kwargs)


class Feedback(models.Model):
    user = models.ForeignKey(User, null=True, blank=True)
    message = models.TextField(null=True, blank=True, default=None)
    data = models.TextField(null=True, blank=True, default=None)
    ts = models.DateTimeField(default=datetime.datetime.now())

    def __unicode__(self):
        if self.user is not None:
            return "%s" % (self.user.username)
        else:
            return "Anonymous"
