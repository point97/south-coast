from django.db import models
from django.db.models import Avg, Max, Min, Count
from django.db.models import Avg, Max, Min, Count, Sum
from django.contrib.auth.models import User
from django.db.models import signals
from django.shortcuts import get_object_or_404
from django.utils.timezone import utc
from account.models import UserProfile

import dateutil.parser
import datetime
import uuid
import simplejson
import caching.base
import ast
import json

import logging
logger = logging.getLogger(__name__)


def make_uuid():
    return str(uuid.uuid4())

STATE_CHOICES = (
    ('complete', 'Complete'),
    ('terminate', 'Terminate'),

)

class Trip(caching.base.CachingMixin, models.Model):
    uuid = models.CharField(max_length=36, primary_key=True, default=make_uuid, editable=False)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    ts = models.DateTimeField()
    user = models.ForeignKey(User)

    # def __unicode__(self):
    #     return '%s - %s' %(user.username, start_date)

    @property
    def respondant_summary_list(self):
        summary_list = []
        for respondant in self.respondant_set.all():
            try:
                event_type = respondant.survey.slug 
                # location = json.dumps(respondant.responses.get(question__slug='map-set-location').answer)
                location = Location.objects.get(respondant=respondant)
                summary_list.append({'type': event_type, 'location': {'lat': location.lat, 'lng': location.lng}, 'date': self.start_date, 'uuid': respondant.uuid, 'trip_uuid': self.uuid})
            except:
                logger.warning("Location.objects.get request failed in respondant_summary_list")
                logger.debug("Above Warning resulting from TRIP - %s and USER - %s and RESPONDANT - %s" %(self, self.user, respondant))

        return summary_list

    def __unicode__(self):
        return "%s" % self.uuid

    def save(self, *args, **kwargs):    
        if not self.ts:
            self.ts = datetime.datetime.utcnow().replace(tzinfo=utc)
        super(Trip, self).save(*args, **kwargs)

class Respondant(caching.base.CachingMixin, models.Model):
    uuid = models.CharField(max_length=36, primary_key=True, default=make_uuid, editable=False)
    survey = models.ForeignKey('Survey')
    responses = models.ManyToManyField('Response', related_name='responses', null=True, blank=True)
    complete = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATE_CHOICES, default=None, null=True, blank=True)
    last_question = models.CharField(max_length=240, null=True, blank=True)

    county = models.CharField(max_length=240, null=True, blank=True)
    state = models.CharField(max_length=240, null=True, blank=True)
    locations = models.IntegerField(null=True, blank=True)

    ts = models.DateTimeField()
    email = models.EmailField(max_length=254, null=True, blank=True, default=None)
    ordering_date = models.DateTimeField(null=True, blank=True)

    user = models.ForeignKey(User, null=True, blank=True)

    trip = models.ForeignKey(Trip, null=True, blank=True)

    objects = caching.base.CachingManager()

    @property
    def survey_title(self):
        try:
            if self.survey.slug == 'catch-report':
                date = self.responses.get(question__slug='landed-date').answer
                if date.find('-') != -1:
                    dateItems = date.split('-')
                elif date.find('/') != -1:
                    dateItems = date.split('/')
                date = '%s/%s/%s' %(dateItems[1], dateItems[2], dateItems[0])
            else:  
                date = self.responses.get(question__slug='did-not-fish-for-month-of').answer 
                if date.find('-') != -1:
                    dateItems = date.split('-')
                elif date.find('/') != -1:
                    dateItems = date.split('/')
                date = '%s/%s' %(dateItems[0], dateItems[1])
        except:
            date = 'unknown'
            logger.warning("Exception in survey_title, attempting to set survey date...")
            logger.debug("Above Warning resulting from TRIP - %s and USER - %s and RESPONDANT - %s" %(self.trip, self.user, self))

        return '%s -- %s' %(self.survey.name, date)
    
    @property
    def survey_slug(self):
        return self.survey.slug

    def __unicode__(self):
        if self.email:
            return "%s" % self.email
        else:
            return "%s" % self.uuid

    def save(self, *args, **kwargs):
        ''' On save, update timestamps '''
        if not self.uuid:
            self.ts = datetime.datetime.utcnow().replace(tzinfo=utc)
        else:
            if ":" in self.uuid:
                self.uuid = self.uuid.replace(":", "_")
        self.locations = self.location_set.all().count()
        super(Respondant, self).save(*args, **kwargs)


class Page(caching.base.CachingMixin, models.Model):
    question = models.ForeignKey('Question', null=True, blank=True)
    questions = models.ManyToManyField('Question', null=True, blank=True, related_name="question_page")
    survey = models.ForeignKey('Survey', null=True, blank=True)
    blocks = models.ManyToManyField('Block', null=True, blank=True)
    order = models.IntegerField(default=1)
    objects = caching.base.CachingManager()


    @property
    def block_name(self):
        if self.blocks.all():
            return ", ".join([block.name for block in self.blocks.all()])
        else:
            return None

    def __unicode__(self):
        if self.survey is not None and self.question is not None:
            return "%s (%s)" % (self.survey.name, ", ".join([question.slug for question in self.questions.all()]))
        else:
            return "NA"
    class Meta:
        ordering = ['order']

    def __unicode__(self):
        question_names = ', '.join([question.slug for question in self.questions.all()])
        if self.survey and self.survey.name:
            return "%s (%s)" % (self.survey.name, question_names)
        else:
            return "unknown survey (%s)" %question_names   


class Survey(caching.base.CachingMixin, models.Model):
    name = models.CharField(max_length=254)
    slug = models.SlugField(max_length=254, unique=True)
    questions = models.ManyToManyField('Question', null=True, blank=True, through="Page")
    states = models.CharField(max_length=200, null=True, blank=True)
    anon = models.BooleanField(default=True)
    offline = models.BooleanField(default=False)

    objects = caching.base.CachingManager()

    @property
    def survey_responses(self):
        return self.respondant_set.all().count()

    @property
    def completes(self):
        return self.respondant_set.filter(complete=True).count()

    @property
    def activity_points(self):
        return Location.objects.filter(response__respondant__in=self.respondant_set.filter(complete=True)).count()
        

    def __unicode__(self):
        return "%s" % self.name


QUESTION_TYPE_CHOICES = (
    ('info', 'Info Page'),
    ('datepicker', 'Date Picker'),
    ('monthpicker', 'Month Picker'),
    ('timepicker', 'Time Picker'),
    ('grid', 'Grid'),
    ('currency', 'Currency'),
    ('pennies', 'Pennies'),
    ('text', 'Text'),
    ('textarea', 'Text Area'),
    ('single-select', 'Single Select'),
    ('multi-select', 'Multi Select'),
    ('location', 'Location'),
    ('integer', 'Integer'),
    ('number', 'Number'),
    ('auto-single-select', 'Single Select with Autocomplete'),
    ('map-multipoint', 'Map with Multiple Points'),
    ('map-multipolygon', 'Map with Multiple Polygons'),
    ('map-set-location', 'Map with Lat/Lon Location'),
    ('buoy-weather', 'Weather by Buoy'),
    ('yes-no', 'Yes/No'),
    ('number-with-unit', 'Number with Unit'),
)

class Option(caching.base.CachingMixin, models.Model):
    text = models.CharField(max_length=254)
    label = models.SlugField(max_length=64)
    type = models.CharField(max_length=20,choices=QUESTION_TYPE_CHOICES,default='integer')
    rows = models.TextField(null=True, blank=True)
    required = models.BooleanField(default=True)
    either_or = models.SlugField(max_length=64, null=True, blank=True)
    order = models.IntegerField(null=True, blank=True)
    min = models.IntegerField(default=None, null=True, blank=True)
    max = models.IntegerField(default=None, null=True, blank=True)    

    objects = caching.base.CachingManager()


    def __unicode__(self):
        return "%s" % self.text

REPORT_TYPE_CHOICES = (
        ('distribution', 'Distribution'),
        ('heatmap', 'Heatmap'),
        ('heatmap-distribution', 'Heatmap & Distribution'),
    )

class Block(caching.base.CachingMixin, models.Model):
    name = models.CharField(max_length=254, null=True, blank=True)
    skip_question = models.ForeignKey('Question', null=True, blank=True)
    skip_condition = models.CharField(max_length=254, null=True, blank=True)

    def __unicode__(self):
        return "%s" % self.name

class Question(caching.base.CachingMixin, models.Model):
    title = models.TextField()
    label = models.CharField(max_length=254)
    order = models.IntegerField(default=0)
    slug = models.SlugField(max_length=64)
    attach_to_profile = models.BooleanField(default=False)
    logbook = models.BooleanField(default=False)
    persistent = models.BooleanField(default=False)
    type = models.CharField(max_length=20,choices=QUESTION_TYPE_CHOICES,default='text')
    options = models.ManyToManyField(Option, null=True, blank=True)
    options_json = models.TextField(null=True, blank=True)
    rows = models.TextField(null=True, blank=True)
    cols = models.TextField(null=True, blank=True)
    info = models.CharField(max_length=254, null=True, blank=True)
    grid_cols = models.ManyToManyField(Option, null=True, blank=True, related_name="grid_cols")

    geojson = models.TextField(null=True, blank=True)

    zoom = models.IntegerField(null=True, blank=True)
    min_zoom = models.IntegerField(null=True, blank=True, default=10)
    lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    integer_min = models.IntegerField(default=None, null=True, blank=True)
    integer_max = models.IntegerField(default=None, null=True, blank=True)
    term_condition = models.CharField(max_length=254, null=True, blank=True)
    skip_question = models.ForeignKey('self', null=True, blank=True)
    skip_condition = models.CharField(max_length=254, null=True, blank=True)

    blocks = models.ManyToManyField('Block', null=True, blank=True)    

    randomize_groups = models.BooleanField(default=False)

    options_from_previous_answer = models.CharField(max_length=254, null=True, blank=True)
    allow_other = models.BooleanField(default=False)
    required = models.BooleanField(default=True)
    modalQuestion = models.ForeignKey('self', null=True, blank=True, related_name="modal_question")
    hoist_answers = models.ForeignKey('self', null=True, blank=True, related_name="hoisted")
    foreach_question = models.ForeignKey('self', null=True, blank=True, related_name="foreach")
    pre_calculated = models.TextField(null=True, blank=True)


    # backend stuff
    filterBy = models.BooleanField(default=False)
    visualize = models.BooleanField(default=False)
    report_type = models.CharField(max_length=20,choices=REPORT_TYPE_CHOICES,null=True, default=None)
    filter_questions = models.ManyToManyField('self', null=True, blank=True)

    @property
    def answer_domain(self):
        if self.visualize or self.filterBy:
            answers = self.response_set.filter(respondant__complete=True)
            if self.type in ['map-multipoint']:
                return LocationAnswer.objects.filter(location__response__in=answers).values('answer').annotate(locations=Count('answer'), surveys=Count('location__respondant', distinct=True))
            else:
                return answers.values('answer').annotate(locations=Sum('respondant__locations'), surveys=Count('answer'))
        else:
            return None
        

    objects = caching.base.CachingManager()

    def save(self, *args, **kwargs):
        super(Question, self).save(*args, **kwargs)

    class Meta:
        ordering = ['order']

    @property
    def survey_slug(self):
        if self.question_page.all() and self.question_page.all()[0].survey:
            return self.question_page.all()[0].survey.slug
        if self.survey_set.all():
            return self.survey_set.all()[0].slug
        elif self.modal_question.all():
            return self.modal_question.all()[0].survey_set.all()[0].slug + " (modal)"
        else:
            return "NA"

    @property
    def question_types(self):
        return QUESTION_TYPE_CHOICES

    @property
    def report_types(self):
        return REPORT_TYPE_CHOICES

    def __unicode__(self):
        return "%s/%s/%s" % (self.survey_slug, self.slug, self.type)
    
    #    #return "%s/%s" % (self.survey_set.all()[0].slug, self.label)

class LocationAnswer(caching.base.CachingMixin, models.Model):
    answer = models.TextField(null=True, blank=True, default=None)
    label = models.TextField(null=True, blank=True, default=None)
    location = models.ForeignKey('Location')
    def __unicode__(self):
        return "%s/%s" % (self.location.response.respondant.uuid, self.answer)


class Location(caching.base.CachingMixin, models.Model):
    response = models.ForeignKey('Response')
    respondant = models.ForeignKey('Respondant', null=True, blank=True)
    lat = models.DecimalField(max_digits=10, decimal_places=7)
    lng = models.DecimalField(max_digits=10, decimal_places=7)

    def __unicode__(self):
        return "%s/%s/%s" % (self.response.respondant.survey.slug, self.response.question.slug, self.response.respondant.uuid)

class MultiAnswer(caching.base.CachingMixin, models.Model):
    response = models.ForeignKey('Response')
    answer_text = models.TextField()
    answer_label = models.TextField(null=True, blank=True)

class GridAnswer(caching.base.CachingMixin, models.Model):
    response = models.ForeignKey('Response')
    row_text = models.TextField(null=True, blank=True)
    row_label = models.TextField(null=True, blank=True)
    col_text = models.TextField(null=True, blank=True)
    col_label = models.TextField(null=True, blank=True)
    answer_text = models.TextField(null=True, blank=True)
    answer_number = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __unicode__(self):
        return "%s: %s" % (self.row_text, self.col_text)


class Response(caching.base.CachingMixin, models.Model):
    question = models.ForeignKey(Question)
    respondant = models.ForeignKey(Respondant, null=True, blank=True)
    answer = models.TextField(null=True, blank=True)
    answer_raw = models.TextField(null=True, blank=True)
    unit = models.TextField(null=True, blank=True)
    ts = models.DateTimeField()
    user = models.ForeignKey(User, null=True, blank=True)
    objects = caching.base.CachingManager()

    def __unicode__(self):
        if self.respondant and self.question:
            return "%s/%s (%s)" %(self.respondant.survey.slug, self.question.slug, self.respondant.uuid)
        else:
            return "No Respondant"

    class Meta:
        ordering = ['-ts']

    @property
    def question_slug(self):
        return self.question.slug

    def save_related(self):
        if self.answer_raw:
            self.answer = simplejson.loads(self.answer_raw)
            if self.question.type in ['auto-single-select', 'single-select', 'yes-no']:
                answer = simplejson.loads(self.answer_raw)
                if answer.get('text'):
                    self.answer = answer['text'].strip()
                if answer.get('name'):
                    self.answer = answer['name'].strip()
            if self.question.type in ['monthpicker']:
                try:
                    date = dateutil.parser.parse(self.answer)
                    self.answer= "%s/%s" % (date.month, date.year)
                except Exception as e:
                    self.answer = self.answer_raw
                    logger.warning("Exception in save_related - monthpicker condition...")
                    logger.debug("Above Warning resulting from USER - %s and RESPONSE - %s" %(self.user, self))
            if self.question.type in ['number-with-unit']:
                try: 
                    answer = simplejson.loads(self.answer_raw)
                    self.answer = answer.get('value', answer)
                    self.unit = answer.get('unit', 'Unknown')
                except Exception as e:
                    self.answer = self.answer_raw
                    logger.warning("Exception in save_related - number-with-unit condition...")
                    logger.debug("Above Warning resulting from USER - %s and RESPONSE - %s" %(self.user, self))
            if self.question.type in ['auto-multi-select', 'multi-select']:
                answers = []
                self.multianswer_set.all().delete()
                answer_list = simplejson.loads(self.answer_raw)
                if type(answer_list) is dict:
                    answer_list = [answer_list]
                for answer in answer_list:
                    try:
                        if answer.get('text'):
                            answer_text = answer['text'].strip()
                        if answer.get('name'):
                            answer_text = answer['name'].strip()
                        answers.append(answer_text)
                        answer_label = answer.get('label', None)
                        multi_answer = MultiAnswer(response=self, answer_text=answer_text, answer_label=answer_label)
                        multi_answer.save()
                    except Exception as e:                        
                        logger.warning("Exception in save_related - multi-select condition...")
                        logger.debug("Above Warning resulting from USER - %s and RESPONSE - %s" %(self.user, self))
                self.answer = ", ".join(answers)
            if self.question.type in ['map-multipolygon']:
                answers = []
                self.multianswer_set.all().delete()
                for answer in simplejson.loads(self.answer_raw):
                    answers.append(answer)
                    answer_label = None
                    multi_answer = MultiAnswer(response=self, answer_text=answer, answer_label=answer_label)
                    multi_answer.save()
                self.answer = ", ".join(answers)
            if self.question.type in ['map-multipoint'] and self.id:
                answers = []
                self.location_set.all().delete()
                for point in simplejson.loads(simplejson.loads(self.answer_raw)):
                    answers.append("%s,%s: %s" % (point['lat'], point['lng'] , point['answers']))
                    location = Location(lat=point['lat'], lng=point['lng'], response=self, respondant=self.respondant)
                    location.save()
                    for answer in point['answers']:
                        answer = LocationAnswer(answer=answer['text'], label=answer['label'], location=location)
                        answer.save()
                    location.save()
                self.answer = ", ".join(answers)
            if self.question.type in ['map-set-location'] and self.id:
                self.location_set.all().delete()
                point = simplejson.loads(self.answer_raw)
                self.answer = "%s,%s" % (point['lat'], point['lng'])
                location = Location(lat=point['lat'], lng=point['lng'], response=self, respondant=self.respondant)
                location.save()
            if self.question.type == 'grid':
                self.gridanswer_set.all().delete()
                for answer in self.answer:
                    for grid_col in self.question.grid_cols.all():
                        if grid_col.type in ['currency', 'integer', 'number', 'single-select', 'text', 'yes-no']:
                            try:
                                answer_value = answer[grid_col.label.replace('-', '')]
                                # if the answer is numeric
                                if not isinstance(answer_value, unicode) or answer_value.isdigit():
                                    grid_answer = GridAnswer(response=self,
                                        answer_text=answer_value,
                                        answer_number=answer_value,
                                        row_label=answer['label'].strip(), row_text=answer['text'].strip(),
                                        col_label=grid_col.label, col_text=grid_col.text)
                                else: # the answer is not numeric
                                    grid_answer = GridAnswer(response=self,
                                        answer_text=answer_value,
                                        row_label=answer['label'].strip(), row_text=answer['text'].strip(),
                                        col_label=grid_col.label, col_text=grid_col.text)
                                grid_answer.save()
                            except Exception as e:
                                logger.warning("Exception in save_related - grid condition...")
                                logger.exception("Exception - %s" %e)
                                logger.debug("Problem with grid_col.label - %s and self.answer_raw - %s" %(grid_col.label, self.answer_raw))
                                logger.debug("Above Warning, Exception, and Debug statements resulting from USER - %s and RESPONSE - %s" %(self.user, self))
                            
                        elif grid_col.type == 'multi-select':
                            try:
                                for this_answer in answer[grid_col.label.replace('-', '')]:
                                    print this_answer
                                    grid_answer = GridAnswer(response=self,
                                        answer_text=this_answer,
                                        row_label=answer['label'], row_text=answer['text'],
                                        col_label=grid_col.label, col_text=grid_col.text)
                                    grid_answer.save()
                            except:
                                logger.warning("Exception in save_related - grid_col.type multi-select condition...")
                                logger.exception("Exception - %s" %e)
                                logger.debug("Problem with answer - %s" %(answer))
                                logger.debug("Above Warning, Exception, and Debug statements resulting from USER - %s and RESPONSE - %s" %(self.user, self))
                        else:
                            print grid_col.type
                            print answer
                    
            if hasattr(self.respondant, self.question.slug):
                setattr(self.respondant, self.question.slug, self.answer)
                self.respondant.save()

            if self.respondant is not None and self.respondant.user is not None:
                if self.question.attach_to_profile or self.question.persistent:
                    # Get this user's set of profile fields. These can be shared cross-survey (...is this still the case?)
                    if self.respondant.user.profile.registration and self.respondant.user.profile.registration != 'null':
                        profileAnswers = simplejson.loads(self.respondant.user.profile.registration)
                    else:
                        profileAnswers = {}
                    # Replace existing value with new value.
                    profileAnswers[self.question.slug] = self.answer
                    profile = get_object_or_404(UserProfile, user=self.respondant.user)
                    profile.registration = simplejson.dumps(profileAnswers)
                    profile.save()
            self.save()

        if self.question.slug == 'landed-date':
            if self.respondant is not None:
                from datetime import datetime
                #try:
                if self.answer.find('-') != -1:
                    dnf_date = datetime.strptime(self.answer, '%Y-%m-%d')
                elif self.answer.find('/') != -1:
                    dnf_date = datetime.strptime(self.answer, '%Y/%m/%d')
                self.respondant.ordering_date = dnf_date
                self.respondant.save()
                # except:
                #     import pdb
                #     pdb.set_trace()
                #     pass
        
        if self.question.slug == 'did-not-fish-for-month-of':
            if self.respondant is not None:
                from datetime import datetime
                #try:
                if self.answer.find('-') != -1:
                    dnf_date = datetime.strptime(self.answer, '%m-%Y')
                elif self.answer.find('/') != -1:
                    dnf_date = datetime.strptime(self.answer, '%m/%Y')
                self.respondant.ordering_date = dnf_date
                self.respondant.save()
                # except:
                #     import pdb
                #     pdb.set_trace()
                #     pass



    def save(self, *args, **kwargs):
        ''' On save, update timestamps '''
        if not self.id:
            self.ts = datetime.datetime.utcnow().replace(tzinfo=utc)
        super(Response, self).save(*args, **kwargs)

def save_related(sender, instance, created, **kwargs):
    # save the related objects on initial creation
    if created:
        instance.save_related()

signals.post_save.connect(save_related, sender=Response)
