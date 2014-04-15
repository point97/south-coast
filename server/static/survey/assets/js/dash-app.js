//'use strict';

var app = {};

app.server = window.location.protocol + '//' + window.location.host;
angular.module('askApp', ['ngRoute', 'ui', 'ui.bootstrap', 'ngGrid'])
    .config(function($routeProvider, $httpProvider, $provide) {

    $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

    $provide.decorator("$exceptionHandler", function($delegate) {
        return function(exception, cause) {
            TraceKit.report(exception);
            $delegate(exception, cause);
        };
    });


    $routeProvider.when('/author/:surveySlug', {
        templateUrl: '/static/survey/views/author.html',
        controller: 'AuthorCtrl',
        reloadOnSearch: false
    })
        .when('/author', {
        templateUrl: '/static/survey/views/author.html',
        controller: 'AuthorCtrl',
        reloadOnSearch: false
    })
        .when('/surveys', {
        templateUrl: '/static/survey/views/SurveyList.html',
        controller: 'SurveyListCtrl'
    })
        .when('/survey/:surveySlug/complete/:uuidSlug', {
        templateUrl: '/static/survey/views/complete.html',
        controller: 'CompleteCtrl'
    })
        .when('/survey/:surveySlug/complete/:uuidSlug/:action/:questionSlug', {
        templateUrl: '/static/survey/views/complete.html',
        controller: 'CompleteCtrl'
    })
        .when('/survey/:surveySlug/:questionSlug/:uuidSlug', {
        templateUrl: '/static/survey/views/SurveyDetail.html',
        controller: 'SurveyDetailCtrl'
    })
        .when('/survey/:surveySlug/:uuidSlug', {
        templateUrl: '/static/survey/views/landing.html',
        controller: 'SurveyDetailCtrl'
    })
        .when('/RespondantList/:surveySlug', {
        templateUrl: '/static/survey/views/RespondantList.html',
        controller: 'RespondantListCtrl'
    })
        .when('/agency-dash/:surveySlug', {
        templateUrl: '/static/survey/views/agency-dash.html',
        controller: 'AgencyDashCtrl'
    })

        .when('/RespondantDetail/:surveySlug/:uuidSlug', {
        templateUrl: '/static/survey/views/RespondantDetail.html',
        controller: 'RespondantDetailCtrl'
    })
        .otherwise({
        redirectTo: '/'
    });
});

TraceKit.report.subscribe(function yourLogger(errorReport) {
    'use strict';
    var msg = 'msg: ' + errorReport.message + '\n\n';
    msg += '::::STACKTRACE::::\n';
    for(var i = 0; i < errorReport.stack.length; i++) {
        msg += 'stack[' + i + '] ' + errorReport.stack[i].url + ':' + errorReport.stack[i].line + '\n';
    }
    $.post(app.server + '/tracekit/error/', {
        stackinfo: JSON.stringify({'message': msg})
    });
});
// TraceKit.report({message: 'error'});