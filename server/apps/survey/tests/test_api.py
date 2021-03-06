from tastypie.test import ResourceTestCase
from django.contrib.auth.models import User
from ..api import SurveyResource
from ..models import Respondant, Response, Survey, Page
from path import path
import json

class SurveyResourceTest(ResourceTestCase):
    # Use ``fixtures`` & ``urls`` as normal. See Django's ``TestCase``
    # documentation for the gory details.
    fixtures = ['surveys.json.gz']

    def setUp(self):
        super(SurveyResourceTest, self).setUp()

        # Create a user.
        self.username = 'fisher'
        self.password = 'secret'
        self.user = User.objects.create_user(self.username, 'fish@example.com', self.password)
        self.user.is_staff = True
        self.user.is_superuser = True
        self.user.save()


    def test_get_survey(self):
        res = self.api_client.get('/api/v1/survey/catch-report/', format='json')
        self.assertValidJSONResponse(res)

        survey = self.deserialize(res)

        self.assertEqual(survey['slug'], 'catch-report')
    
    def get_credentials(self):
        result = self.api_client.client.login(username='fisher',
                                              password='secret')
        return result

    def test_submit_trip(self):
        result = self.api_client.client.login(username='fisher', password='secret')
        user_id = self.user.id

        file_path = path(__file__).abspath().dirname()/'trip.json'
        with open(file_path,'r') as f:
            output = json.loads(f.read())
        
        answer = output['events']['dive']['respondents'][0]['responses'][0]['answer']
        output['events']['dive']['respondents'][0]['responses'][0]['answer_raw'] = json.dumps(answer)
        output['respondants'][0]['responses'][0]['answer_raw'] = json.dumps(answer)
        print output

        res = self.api_client.post('/api/v1/trip/?username=%s&api_key=%s' %(self.user.username, self.user.api_key.key),
            format='json', 
            data=output)

        self.assertHttpCreated(res)


    def test_order_pages(self):
        result = self.api_client.client.login(username='fisher', password='secret')
        original_data = self.deserialize(self.api_client.get('/api/v1/survey/dive/',
            format='json'))
        
        new_data = original_data.copy()

        # first page has an order of 2, need to switch it to 1...ummm...how about the following instead...
        # second page has order of 2, will move page to order of 1
        self.assertEqual(original_data['pages'][1]['order'], 2)

        # second page currently has 1 question
        self.assertEqual(len(original_data['pages'][1]['questions']), 1)
        # move second page to first position
        new_data['pages'][1]['order'] = 1
        # move first page to second position
        new_data['pages'][0]['order'] = 2
        # new_data['pages'][1]['questions'] = map(lambda x: x['resource_uri'], new_data['pages'][1]['questions'])
        print original_data['pages'][1]['resource_uri']+'?username=%s&api_key=%s' %(self.user.username, self.user.api_key.key)
        # verify authentication, etc for moved page
        res = self.api_client.put(original_data['pages'][1]['resource_uri']+'?username=%s&api_key=%s' %(self.user.username, self.user.api_key.key),
            format='json', data=new_data['pages'][1],
            authentication=self.get_credentials())

        # order has been updates and number of questions is the same
        # self.assertHttpAccepted(res)
        self.assertHttpOK(res)
        self.assertEqual(Page.objects.get(pk=original_data['pages'][1]['id']).order, 1)
        self.assertEqual(Page.objects.get(pk=original_data['pages'][1]['id']).questions.count(), 1)

        # verify authentication, etc for page that was first and is now second
        res = self.api_client.put(original_data['pages'][0]['resource_uri'],
            format='json', data=new_data['pages'][0],
            authentication=self.get_credentials())

        # order has been updates and number of questions is the same
        # self.assertHttpAccepted(res)
        # self.assertHttpOK(res)
        self.assertEqual(Page.objects.get(pk=original_data['pages'][0]['id']).order, 2)
        self.assertEqual(Page.objects.get(pk=original_data['pages'][0]['id']).questions.count(), 3)


        