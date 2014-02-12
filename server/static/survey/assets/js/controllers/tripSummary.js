//'use strict';

angular.module('askApp')
    .controller('tripSummaryCtrl', function($scope, $http, $routeParams, $location, $modal, survey, history, storage) {
        $http.defaults.headers.post['Content-Type'] = 'application/json';

        
        if (app.user) {
            $scope.user = app.user;    
        } else {
            $location.path('/');
        }
        $scope.title = "Log Summary";

        $scope.path = $location.path().slice(1,5);

        $scope.currentTrip = app.currentTrip;

        $scope.speciesCaught = [];

        _.each($scope.currentTrip.events, function(value, key) {
            _.each(value.respondents, function(respondent) {
                if (respondent) {
                    var eventSpecies = _.findWhere(respondent.responses, {question: 'harvest-species'}).answer;
                    _.each(eventSpecies, function(species) {
                        var speciesObj = _.findWhere($scope.speciesCaught, {name: species.text});
                        if (!speciesObj) {
                            speciesObj = { name: species.text, events: [] };
                            $scope.speciesCaught.push(speciesObj);
                        } 
                        var event = {};
                        event.siteName = _.findWhere(respondent.responses, {question: 'site-name'}).answer;

                        var notFound = { answer: 'Question Not Found' };

                        var location = _.findWhere(respondent.responses, {question: 'map-set-location'}) || notFound,
                            block = _.findWhere(respondent.responses, {question: 'block-number'}) || notFound,
                            landmark = _.findWhere(respondent.responses, {question: 'landmark'}) || notFound;                        
                        event.location = {  
                            lat: location.answer.lat,
                            lng: location.answer.lng,
                            block: block.answer,
                            landmark: landmark.answer
                        };

                        var minDepth = _.findWhere(respondent.responses, {question: 'min-depth'}) || notFound,
                            maxDepth = _.findWhere(respondent.responses, {question: 'max-depth'}) || notFound,
                            hours = _.findWhere(respondent.responses, {question: 'hours-bottom'}) || notFound,
                            harvest = _.findWhere(respondent.responses, {question: 'harvest-species'}) || notFound,
                            weight = '',
                            grade = '';
                        if (harvest.answer.length) {
                            weight = _.findWhere(harvest.answer, {text: speciesObj.name}).lbs,
                            grade = _.findWhere(harvest.answer, {text: speciesObj.name}).grade;
                        }
                            
                        event.harvest = {
                            minDepth: minDepth.answer,
                            maxDepth: maxDepth.answer,
                            hours: hours.answer,
                            weight: weight,
                            grade: grade
                        };

                        event.incidentals = _.findWhere(respondent.responses, {question: 'incidental-species'}) || notFound;
                        // will need to loop through this list and output text (species name) and lbs (weight)

                        event.notes = _.findWhere(respondent.responses, {question: 'notes'}) || notFound;

                        speciesObj.events.push(event);                                    
                    });
                }
            });
        });


        $scope.viewSpeciesSummary = function (speciesObj) {

            var modalInstance = $modal.open({
                templateUrl: 'speciesSummary',
                controller: SpeciesSummaryCtrl,
                windowClass: 'fullscreen-modal',
                resolve: {
                    speciesObj: function() {
                        return speciesObj;
                    }
                }
            });

            // modalInstance.result.then(function (crewMember) {
            //     if (!$scope.profile.crew) {
            //         $scope.profile.crew = [];
            //     }
            //     $scope.profile.crew.push(crewMember);
            // });
        };

        $scope.updateUserRegistration = function() {
            _.each($scope.currentTrip.events, function(value, key) {
                if (app.user.registration.logbooks[key]) {
                    app.user.registration.logbooks[key]['permit-number'] = value['permit-number'];
                    app.user.registration.logbooks[key]['vessel-number'] = value['vessel-number'];
                    app.user.registration.logbooks[key]['vessel-name'] = value['vessel-name'];
                    if ( ! _.findWhere(app.user.registration.vessels, {name: value['vessel-name']}) ) {
                        app.user.registration.vessels.push( { name: value['vessel-name'], number: value['vessel-number'] } );
                    }
                }
            });
        };

        $scope.saveProfileToServer = function() {
            console.log(app.user.registration);
            var url = app.server + '/account/updateUser/';
        
            $http.post(url, {username: app.user.username, registration: app.user.registration, email: app.user.registration.email})
                .success(function (data) {
                    storage.saveState(app);
                })
                .error(function (data, status) {
                    if (status === 0) {
                        storage.saveState(app);  
                        console.log('Unable to save state of profile to server');
                    } else {
                        // $scope.showError = "There was a problem saving your information.  Please try again later."
                        debugger;
                    }            
                });
        };

        $scope.submitTripLog = function() {
            console.log('submitting trip log');

            // update profile (from contents of app.user.registration)
            console.log('saving to server');
            $scope.updateUserRegistration();
            $scope.saveProfileToServer();


            // save all respondents in all events for this trip
            _.each($scope.currentTrip.events, function(event, key) {
                _.each(event.respondents, function(respondent) {
                    survey.submitSurvey(respondent, _.findWhere(app.surveys, {slug: key}))
                        .success( function(data) {
                            //remove from app.respondents and save state
                            //$scope.deleteRespondent(respondent);
                            app.respondents = _.without(app.respondents, respondent);
                            storage.saveState(app);
                        }).error( function(err) {
                            debugger;
                        });
                });
            });

            // delete app.currentTrip; // already deleted somehow...(after saving profile to server)
            $location.path('/main');
        };

        $scope.saveTripLog = function() {
            console.log('saving trip log');
            
            storage.saveState(app);
            delete app.currentTrip;
            $location.path('/main');
        };

});

var SpeciesSummaryCtrl = function ($scope, $modalInstance, speciesObj) {

    $scope.title = speciesObj.name;
    $scope.speciesObj = speciesObj;

    $scope.ok = function () {
        $modalInstance.close();
    };

};