//'use strict';

angular.module('askApp')
  .controller('CompleteCtrl', function ($scope, $routeParams, $http, $location, survey, history, storage, profileService) {
    var url = '/respond/complete/' + [$routeParams.surveySlug, $routeParams.uuidSlug].join('/');
    $http.defaults.headers.post['Content-Type'] = 'application/json';

   
    if (app.user) {
        $scope.user = app.user;
    } else {
        $scope.user = false;
    }
    $scope.path = false;

    $scope.profile = profileService.getProfile();
    $scope.otherLogbooksExist = $scope.profile.logbooks.length > 1;

    
    if ($routeParams.action === 'terminate' && $routeParams.questionSlug) {
        url = [url, 'terminate', $routeParams.questionSlug].join('/');
    }

    if (app.surveys) {
        $scope.surveys = app.surveys;
    }
    $scope.survey = _.findWhere($scope.surveys, { slug: $routeParams.surveySlug});
    survey.initializeSurvey($scope.survey);

    if (app.offline) {
        // app.respondents[$routeParams.uuidSlug].complete = true;
        // app.respondents[$routeParams.uuidSlug].status = 'complete';
        // delete app.user.resumePath;
        // app.message = "You have completed a trip log.";

        storage.saveState(app);       
    } else {
        $http.post(url).success(function (data) {
            app.data.state = $routeParams.action;
        });    
    }

    $scope.respondent = app.respondents[$routeParams.uuidSlug];
    
    $scope.completeView = '/static/survey/survey-pages/' + $routeParams.surveySlug + '/complete.html';

    $scope.surveyProgress = 100;

    // setting resumePath so users can 'resume' to this page rather than the last question in the survey 
    app.respondents[$routeParams.uuidSlug].resumePath = app.user.resumePath = window.location.hash;

    //ensure currentTrip and currentRespondent are populated (if arriving here directly from Resume Trip, they may not exist)
    if (!app.currentRespondent || (app.currentRespondent !== app.respondents[$routeParams.uuidSlug])) {
        app.currentRespondent = app.respondents[$routeParams.uuidSlug];
    }
    if (!app.currentTrip && app.unSubmittedTrips) {
        _.each(_.keys(app.unSubmittedTrips), function(trip_uuid) {
            if ( _.findWhere(app.unSubmittedTrips[trip_uuid].events[app.currentRespondent.survey].respondents, {uuid: $routeParams.uuidSlug}) ) {
                app.currentTrip = app.unSubmittedTrips[trip_uuid];
            }
        }); 
    } 
    $scope.currentTrip = app.currentTrip;       
    
    

    $scope.updateCurrentTripLogbook = function() {
        // add logbook answers to currentTrip
        _.each($scope.respondent.responses, function(response) {
            // if (response.answer.question.logbook) {
            var questionSlug = response.question,
                question = survey.getQuestionFromSlug(questionSlug),
                answer = response.answer,
                surveySlug = $scope.survey.slug;
            if (question.logbook) {
                survey.addLogbookAnswerToCurrentTrip(surveySlug, questionSlug, answer); 
            }
        });

    };

    // $scope.addRespondentToCurrentTrip = function() {
    //     // survey.ensureCurrentTripExists();
    //     // $scope.currentTrip = app.currentTrip;

    //     if (!$scope.currentTrip.events[$routeParams.surveySlug].respondents) {
    //         $scope.currentTrip.events[$routeParams.surveySlug].respondents = [];
    //     }

    //     $scope.currentTrip.events[$routeParams.surveySlug].respondents.push(app.respondents[$routeParams.uuidSlug]);
        
    // };

    // if (!app.currentTrip) {  
    // survey.ensureCurrentTripExists();
    // $scope.updateCurrentTripLogbook();      
    // }  
    // $scope.currentTrip = app.currentTrip;   
    // $scope.addRespondentToCurrentTrip();
    

    $scope.skipBack = function () {
        $location.path($scope.respondent.resumePath.replace('#', ''));
    };

    $scope.getTitle = function() {
        return history.getTitle($scope.respondent);
    };

    $scope.getAnswer = function(questionSlug) {
        return history.getAnswer(questionSlug, $scope.respondent);
    };
    
    $scope.gearTypeIncludes = function(type) {
        return history.gearTypeIncludes(type, $scope.respondent);
    };

    $scope.trapTypeIncludes = function(type) {
        return history.trapTypeIncludes(type, $scope.respondent);
    };
    
    // $scope.addCurrentTripToUnSubmittedTrips = function() {
    //     if ( ! app.unSubmittedTrips ) { // should be created prior to here...
    //         app.unSubmittedTrips = {};
    //     }
    //     app.unSubmittedTrips[$scope.currentTrip.uuid] = angular.copy($scope.currentTrip);
    //     storage.saveState(app);

    //     delete app.respondents[$routeParams.uuidSlug];
    // };

    $scope.startNewEvent = function() {    
        app.currentRespondent.complete = true;
        app.currentRespondent.status = 'complete';
        delete app.user.resumePath;
        $location.path('/survey/' + 'dive' + '/1/offline');
    }

    $scope.newEvent = function() {        
        //$scope.addRespondentToCurrentTrip();
        // $scope.addCurrentTripToUnSubmittedTrips();
        $scope.startNewEvent();
    };

    $scope.reviewTripReport = function() {
        //$scope.addRespondentToCurrentTrip();
        // $scope.addCurrentTripToUnSubmittedTrips();
        $location.path('/tripSummary');
    };

    $scope.submitReport = function () {
        $scope.working = true;
        var newRespondent = app.respondents[$routeParams.uuidSlug];
        
        delete app.user.resumePath;
        survey.submitSurvey(newRespondent, $scope.survey).success(function () {
            delete app.respondents[$routeParams.uuidSlug];
            app.message = "You catch report was submitted successfully.";
            storage.saveState(app);
            $location.path('/main');
            $scope.working = true;
        }).error(function () {
            app.message = "You catch report was saved and can be submitted later.";
            storage.saveState(app);
            $location.path('/main');
        });

    };

    $scope.continueOffline = function () {
        app.message = "You trip log was saved and can be submitted later.";
        delete app.user.resumePath;
        storage.saveState(app);
        $location.path('/main');
    }   
    
  });
