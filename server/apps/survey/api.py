from tastypie.resources import ModelResource, ALL, ALL_WITH_RELATIONS
from tastypie import fields, utils

from tastypie.authorization import DjangoAuthorization, Authorization
from tastypie.authentication import SessionAuthentication, ApiKeyAuthentication, MultiAuthentication, Authentication

from django.conf.urls import url
from django.db.models import Avg, Max, Min, Count

from survey.models import Survey, Question, Option, Respondant, Response, Page, Block, Trip

import json


class SurveyModelResource(ModelResource):
    def obj_update(self, bundle, request=None, **kwargs):
        bundle = super(SurveyModelResource, self).obj_update(bundle, **kwargs)
        for field_name in self.fields:
            field = self.fields[field_name]
            if type(field) is fields.ToOneField and field.null and bundle.data.get(field_name, None) is None:
                setattr(bundle.obj, field_name, None)
        bundle.obj.save()

        return bundle

class StaffUserOnlyAuthorization(Authorization):
    def read_list(self, object_list, bundle):
        # Is the requested object owned by the user?
        if bundle.request.user.is_staff:
            return object_list
        return object_list.filter(user=bundle.request.user)

    def read_detail(self, object_list, bundle):
        # Is the requested object owned by the user?
        if bundle.request.user.is_staff:
            return True
        return bundle.obj.user == bundle.request.user

    def update_list(self, object_list, bundle):
        return bundle.request.user.is_staff

    def update_detail(self, object_list, bundle):
        return bundle.request.user.is_staff

    def delete_list(self, object_list, bundle):
        # Sorry user, no deletes for you!
        return bundle.request.user.is_staff

    def delete_detail(self, object_list, bundle):
        return bundle.request.user.is_staff

class UserObjectsOnlyAuthorization(Authorization):
    def read_list(self, object_list, bundle):
        # This assumes a ``QuerySet`` from ``ModelResource``.
        return object_list.filter(user=bundle.request.user)

    def read_detail(self, object_list, bundle):
        # Is the requested object owned by the user?
        return bundle.obj.user == bundle.request.user

    def create_list(self, object_list, bundle):
        # Assuming their auto-assigned to ``user`
        return object_list

    def create_detail(self, object_list, bundle):
        return True

    def update_list(self, object_list, bundle):
        allowed = []
        # Since they may not all be saved, iterate over them.
        for obj in object_list:
            if obj.user == bundle.request.user:
                allowed.append(obj)
        return allowed

    def update_detail(self, object_list, bundle):
        return bundle.obj.user == bundle.request.user

    def delete_list(self, object_list, bundle):
        # Sorry user, no deletes for you!
        raise Unauthorized("Sorry, no deletes.")

    def delete_detail(self, object_list, bundle):
        raise Unauthorized("Sorry, no deletes.")

class ResponseResource(SurveyModelResource):
    question = fields.ToOneField('apps.survey.api.QuestionResource', 'question', full=True)
    answer_count = fields.IntegerField(readonly=True)

    class Meta:
        queryset = Response.objects.all()
        filtering = {
            'answer': ALL,
            'question': ALL_WITH_RELATIONS
        }
        ordering = ['question__order']

class OfflineResponseResource(SurveyModelResource):
    question = fields.ToOneField('apps.survey.api.QuestionResource', 'question', null=True, blank=True)
    respondant = fields.ToOneField('apps.survey.api.OfflineRespondantResource', 'respondant')
    user = fields.ToOneField('apps.account.api.UserResource', 'user', null=True, blank=True)
    class Meta:
        queryset = Response.objects.all()
        authorization = UserObjectsOnlyAuthorization()
        authentication = MultiAuthentication(ApiKeyAuthentication(), SessionAuthentication())
    def obj_create(self, bundle, **kwargs):       
        return super(OfflineResponseResource, self).obj_create(bundle, user=bundle.request.user)

class TripReportResponseResource(OfflineResponseResource):
    question = fields.ToOneField('apps.survey.api.QuestionResource', 'question', full=False, null=True, blank=True)
    question_slug = fields.CharField(attribute='question_slug', readonly=True)
    def dehydrate_answer(self, bundle):
        return json.loads(bundle.obj.answer_raw)

class TripResource(SurveyModelResource):
    respondants = fields.ToManyField('apps.survey.api.TripReportRespondantResource', 'respondant_set', null=True, blank=True)
    user = fields.ToOneField('apps.account.api.UserResource', 'user', null=True, blank=True)

    class Meta:
        always_return_data = False
        queryset = Trip.objects.all()
        authorization = UserObjectsOnlyAuthorization()
        authentication = MultiAuthentication(ApiKeyAuthentication(), SessionAuthentication())
    
    def obj_create(self, bundle, **kwargs):
        print bundle.request.user
        if not bundle.request.user.is_authenticated():
            return None
        return super(TripResource, self).obj_create(bundle, user=bundle.request.user)

    def save_related(self, bundle):
        resource_uri = self.get_resource_uri(bundle.obj)
        user_uri = self.get_resource_uri(bundle.request.user)
        for respondant in bundle.data.get('respondants'):
            respondant['trip'] = resource_uri
            respondant['user'] = user_uri


class TripReportResource(SurveyModelResource):
    respondants = fields.ListField(attribute='respondant_summary_list', null=True, blank=True)
    user = fields.ToOneField('apps.account.api.UserResource', 'user', null=True, blank=True)

    class Meta:
        queryset = Trip.objects.all().order_by('-start_date')
        filtering = {
            'user': ALL_WITH_RELATIONS,
            'start_date': ['gte','lte']
        }
        authorization = StaffUserOnlyAuthorization()
        authentication = MultiAuthentication(ApiKeyAuthentication(), SessionAuthentication())

class TripReportDetailsResource(TripReportResource):
    respondants = fields.ToManyField('apps.survey.api.TripReportRespondantResource', 'respondant_set', full=True, null=True, blank=True)
    

class OfflineRespondantResource(SurveyModelResource):
    responses = fields.ToManyField('apps.survey.api.OfflineResponseResource', 'responses', related_name='respondant', null=True, blank=True)
    survey = fields.ToOneField('apps.survey.api.SurveyResource', 'survey', null=True, blank=True)
    user = fields.ToOneField('apps.account.api.UserResource', 'user', null=True, blank=True)
    class Meta:
        always_return_data = True
        queryset = Respondant.objects.all()
        authorization = UserObjectsOnlyAuthorization()
        authentication = MultiAuthentication(ApiKeyAuthentication(), SessionAuthentication())
        ordering = ['-ts']
    
    def obj_create(self, bundle, **kwargs):
        if not bundle.request.user.is_authenticated():
            return None
        return super(OfflineRespondantResource, self).obj_create(bundle, user=bundle.request.user)

    def save_related(self, bundle):
        resource_uri = self.get_resource_uri(bundle.obj)
        user_uri = self.get_resource_uri(bundle.request.user)
        for response in bundle.data.get('responses'):
            response['respondant'] = resource_uri
            response['user'] = user_uri

class TripReportRespondantResource(OfflineRespondantResource):
    responses = fields.ToManyField('apps.survey.api.TripReportResponseResource', 'responses', related_name='respondant', full=True, null=True, blank=True)
    survey_slug = fields.CharField(attribute='survey_slug', readonly=True)

class ReportRespondantResource(SurveyModelResource):
    responses = fields.ToManyField(ResponseResource, 'responses', full=False, null=True, blank=True)
    survey = fields.ToOneField('apps.survey.api.SurveyResource', 'survey', null=True, blank=True, readonly=True)
    user = fields.ToOneField('apps.account.api.UserResource', 'user', null=True, blank=True, full=False, readonly=True)
    survey_title = fields.CharField(attribute='survey_title', readonly=True)
    survey_slug = fields.CharField(attribute='survey_slug', readonly=True)

    class Meta:
        queryset = Respondant.objects.all().order_by('-ordering_date')
        filtering = {
            'survey': ALL_WITH_RELATIONS,
            'responses': ALL_WITH_RELATIONS,
            'user': ALL_WITH_RELATIONS,
            'ordering_date': ['gte','lte']
        }
        #ordering = ['-ordering_date']
        authorization = StaffUserOnlyAuthorization()
        authentication = MultiAuthentication(ApiKeyAuthentication(), SessionAuthentication())

class DashRespondantResource(ReportRespondantResource):
    user = fields.ToOneField('apps.account.api.UserResource', 'user', null=True, blank=True, full=True, readonly=True)

class DashRespondantDetailsResource(ReportRespondantResource):
    responses = fields.ToManyField(ResponseResource, 'responses', full=True, null=True, blank=True)
    user = fields.ToOneField('apps.account.api.UserResource', 'user', null=True, blank=True, full=True, readonly=True)

class ReportRespondantDetailsResource(ReportRespondantResource):
    responses = fields.ToManyField(ResponseResource, 'responses', full=True, null=True, blank=True)
    user = fields.ToOneField('apps.account.api.UserResource', 'user', null=True, blank=True, full=True, readonly=True)
    
class RespondantResource(SurveyModelResource):
    responses = fields.ToManyField(ResponseResource, 'responses', full=True, null=True, blank=True)
    survey = fields.ToOneField('apps.survey.api.SurveyResource', 'survey', null=True, blank=True, full=True, readonly=True)
    user = fields.ToOneField('apps.account.api.UserResource', 'user', null=True, blank=True, full=True, readonly=True)

    class Meta:
        queryset = Respondant.objects.all().order_by('-ts')
        filtering = {
            'survey': ALL_WITH_RELATIONS,
            'responses': ALL_WITH_RELATIONS,
            'ts': ['gte','lte']
        }
        ordering = ['-ts']
        authorization = StaffUserOnlyAuthorization()
        authentication = MultiAuthentication(ApiKeyAuthentication(), SessionAuthentication())


class OptionResource(SurveyModelResource):
    class Meta:
        always_return_data = True
        queryset = Option.objects.all().order_by('order');
        authorization = StaffUserOnlyAuthorization()
        authentication = MultiAuthentication(ApiKeyAuthentication(), SessionAuthentication())


    # save_m2m = main_save_m2m


class PageResource(SurveyModelResource):
    questions = fields.ToManyField('apps.survey.api.QuestionResource', 'questions', full=True, null=True, blank=True)
    blocks = fields.ToManyField('apps.survey.api.BlockResource', 'blocks', full=True, null=True, blank=True)
    survey = fields.ToOneField('apps.survey.api.SurveyResource', 'survey', null=True, blank=True)
    class Meta:
        queryset = Page.objects.all().order_by('order')
        always_return_data = True
        authorization = StaffUserOnlyAuthorization()
        authentication = MultiAuthentication(ApiKeyAuthentication(), SessionAuthentication())
        filtering = {
            'survey': ALL_WITH_RELATIONS
        }

    # save_m2m = main_save_m2m




class BlockResource(SurveyModelResource):
    skip_question = fields.ToOneField('apps.survey.api.QuestionResource', 'skip_question', null=True, blank=True)

    class Meta:
        queryset = Block.objects.all()
        always_return_data = True
        authorization = StaffUserOnlyAuthorization()
        authentication = MultiAuthentication(ApiKeyAuthentication(), SessionAuthentication())


class QuestionResource(SurveyModelResource):
    options = fields.ToManyField(OptionResource, 'options', full=True, null=True, blank=True)
    grid_cols = fields.ToManyField(OptionResource, 'grid_cols', full=True, null=True, blank=True)
    modalQuestion = fields.ToOneField('self', 'modalQuestion', full=True, null=True, blank=True)
    hoist_answers = fields.ToOneField('self', 'hoist_answers', full=True, null=True, blank=True)
    foreach_question = fields.ToOneField('self', 'foreach_question', full=True, null=True, blank=True)
    question_types = fields.DictField(attribute='question_types', readonly=True)
    report_types = fields.DictField(attribute='report_types', readonly=True)
    answer_domain = fields.ListField(attribute='answer_domain', readonly=True, null=True)
    filter_questions = fields.ToManyField('self', 'filter_questions', null=True, blank=True)
    skip_question = fields.ToOneField('self', 'skip_question', null=True, blank=True)
    blocks = fields.ToManyField('apps.survey.api.BlockResource', 'blocks', null=True, blank=True, full=True)
    # pages = fields.ToManyField('apps.survey.api.PageResource', 'page_set', null=True, blank=True)


    class Meta:
        queryset = Question.objects.all()
        always_return_data = True
        authorization = StaffUserOnlyAuthorization()
        authentication = MultiAuthentication(ApiKeyAuthentication(), SessionAuthentication())
        filtering = {
            'slug': ALL,
            'surveys': ALL_WITH_RELATIONS
        }

    # save_m2m = main_save_m2m

class SurveyResource(SurveyModelResource):
    questions = fields.ToManyField(QuestionResource, 'questions', full=True, null=True, blank=True)
    #question = fields.ToOneField(QuestionResource, 'question', full=True, null=True, blank=True)
    pages = fields.ToManyField(PageResource, 'page_set', full=True, related_name='survey', null=True, blank=True)
    class Meta:
        detail_uri_name = 'slug'
        queryset = Survey.objects.all()
        always_return_data = True
        authorization = StaffUserOnlyAuthorization()
        authentication = MultiAuthentication(ApiKeyAuthentication(), SessionAuthentication())
        filtering = {
            'slug': ['exact']
        }


    # def save_m2m(self, bundle):
    #     pass

class SurveyReportResource(SurveyResource):
    questions = fields.ToManyField(QuestionResource, 'questions', null=True, blank=True)
    completes = fields.IntegerField(attribute='completes', readonly=True)
    survey_responses = fields.IntegerField(attribute='survey_responses', readonly=True)
    activity_points = fields.IntegerField(attribute='activity_points', readonly=True)
