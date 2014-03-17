//'use strict';

angular.module('askApp')
    .controller('tripSummaryCtrl', function($scope, $http, $routeParams, $location, $modal, survey, history, storage) {
        $http.defaults.headers.post['Content-Type'] = 'application/json';

        
        if (app.user) {
            $scope.user = app.user;    
        } else {
            $location.path('/');
        }
        $scope.title = "Trip Summary";
        $scope.hideHamburger = true;
        $scope.showBackButton = true;

        $scope.working = false;

        $scope.path = $location.path().slice(1,5);

        if ($routeParams.uuid && app.unSubmittedTrips && app.unSubmittedTrips[$routeParams.uuid]) {
            $scope.trip = app.unSubmittedTrips[$routeParams.uuid];
            $scope.calledFromUnsubmittedTripList = true;
        } else {
            $scope.trip = app.currentTrip;    
            $scope.calledFromUnsubmittedTripList = false;
        }
        

        $scope.speciesCaught = [];

        _.each($scope.trip.events, function(value, key) {
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
            _.each($scope.trip.events, function(value, key) {
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
            // update profile (from contents of app.user.registration)
            $scope.updateUserRegistration();
            $scope.saveProfileToServer();
            $scope.working = true;
            $scope.hideHamburger = true;
            $scope.title = 'Saving...';

            // app.respondents[$routeParams.uuidSlug].complete = true;
            // app.respondents[$routeParams.uuidSlug].status = 'complete';
            delete app.user.resumePath;
            // app.message = "You have completed a trip log.";
            // $scope.trip.complete = true;
            // $scope.trip.status = 'complete';

            // delete relevant app.respondents
            _.each($scope.trip.events, function(value, key) {
                _.each(value.respondents, function(respondent) {
                    if (app.respondents[respondent.uuid]) {
                        delete app.respondents[respondent.uuid];
                    }
                });
            });

            if (app.currentRespondent) {
                app.currentRespondent = true;   
            }

            // delete curentTrip and currentRespondent
            delete app.currentRespondent; 
            delete app.currentTrip;            

            survey.saveTripToServer($scope.trip)
                .success( function(data) {
                    // remove $scope.trip from unsubmittedTrips (check for trip.uuid as key in unsubmittedTrips)
                    // and clear out currentTrip
                    // will want to have set flag to cause loading... spinner to occur (and then toggle that flag here to stop loading... spinner)
                    $scope.working = false;
                    $scope.hideHamburger = false;
                    app.message = "Your trip has been submitted.";

                    delete app.unSubmittedTrips[$scope.trip.uuid];
                    
                    if ($scope.calledFromUnsubmittedTripList) {
                        $location.path('/unSubmittedTripList')
                    } else {
                        $location.path('/main');
                    }
                }).error (function(err) {
                    $scope.working = false;
                    $scope.hideHamburger = false;
                    app.message = "A problem was experienced when saving your trip.  Click Unsubmitted Trips to try again now, or try again later.";
                    if ($scope.calledFromUnsubmittedTripList) {
                        $location.path('/unSubmittedTripList')
                    } else {
                        $location.path('/main');
                    }
                });

        };

        $scope.saveTripToLocalStorage = function() { 
            storage.saveState(app);
            if ($scope.calledFromUnsubmittedTripList) {
                $location.path('/unSubmittedTripList')
            } else {                
                // app.respondents[$routeParams.uuidSlug].complete = true;
                // app.respondents[$routeParams.uuidSlug].status = 'complete';
                // delete app.user.resumePath;
                // app.message = "You have completed a trip log.";

                if (app.currentRespondent) {
                    app.currentRespondent.complete = true;
                    app.currentRespondent.status = 'complete';
                }
                delete app.currentRespondent;    
                delete app.currentTrip;
                delete app.currentRespondent;
                app.message = "View Unsubmitted Trips at anytime to save your trip.";
                $location.path('/main');
            }

            // app.respondents[$routeParams.uuidSlug].complete = true;
            // app.respondents[$routeParams.uuidSlug].status = 'complete';
            // delete app.user.resumePath;
            // app.message = "You have completed a trip log.";


        };

        $scope.back = function() {
            if ($scope.calledFromUnsubmittedTripList) {
                $location.path('/unSubmittedTripList')
            } else {     
                $location.path('/survey/'+app.currentRespondent.survey+'/complete/'+app.currentRespondent.uuid);
            }
        }

});

var SpeciesSummaryCtrl = function ($scope, $modalInstance, speciesObj) {

    $scope.title = speciesObj.name;
    $scope.speciesObj = speciesObj;

    $scope.ok = function () {
        $modalInstance.close();
    };

};