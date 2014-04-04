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

        $scope.calledFrom = $location.path().split('/')[2];

        $scope.speciesCaught = [];

        $scope.constructTripSummary = function() {
            _.each($scope.trip.events, function(value, key) {
                _.each(value.respondents, function(respondent) {
                    if (respondent) {
                        var eventSpecies = _.findWhere(respondent.responses, {question: 'harvest-species'}).answer;
                        if ( !(eventSpecies instanceof Array) ) {
                            eventSpecies = [{text: eventSpecies}];
                            // eventSpecies = [eventSpecies];
                        }
                        if (!$scope.trip.startDate) {
                            $scope.trip.startDate = _.findWhere(respondent.responses, {question: 'date'}).answer;    
                        }                        
                        _.each(eventSpecies, function(species) {
                            var speciesObj = _.findWhere($scope.speciesCaught, {name: species.text});
                            if (!speciesObj) {
                                speciesObj = { name: species.text, events: [] };
                                $scope.speciesCaught.push(speciesObj);
                            } 
                            var event = {};
                            event.siteName = _.findWhere(respondent.responses, {question: 'site-name'}).answer;

                            $scope.notFound = { answer: 'Not Reported' };

                            var location = _.findWhere(respondent.responses, {question: 'map-set-location'}) || $scope.notFound,
                                block = _.findWhere(respondent.responses, {question: 'block-number'}) || $scope.notFound,
                                landmark = _.findWhere(respondent.responses, {question: 'landmark'}) || $scope.notFound;      

                            event.location = {  
                                lat: location.answer.lat || location.answer.split(',')[0],
                                lng: location.answer.lng || location.answer.split(',')[1],
                                block: block.answer,
                                landmark: landmark.answer !== 'NA' ? landmark.answer : $scope.notFound.answer
                            };

                            event.location.latDMS = $scope.convertToDMS(event.location.lat);
                            event.location.lngDMS = $scope.convertToDMS(event.location.lng);

                            var minDepth = _.findWhere(respondent.responses, {question: 'min-depth'}) || $scope.notFound,
                                maxDepth = _.findWhere(respondent.responses, {question: 'max-depth'}) || $scope.notFound,
                                hours = _.findWhere(respondent.responses, {question: 'hours'}) || $scope.notFound,
                                harvest = _.findWhere(respondent.responses, {question: 'harvest-species'}) || $scope.notFound,
                                weight = '',
                                grade = '';
                            if (harvest.answer.length) {
                                weight = _.findWhere(harvest.answer, {text: speciesObj.name}).lbs,
                                grade = _.findWhere(harvest.answer, {text: speciesObj.name}).grade;
                            }
                                
                            event.harvest = {
                                minDepth: minDepth !== $scope.notFound ? minDepth.answer : '?',
                                maxDepth: maxDepth !== $scope.notFound ? maxDepth.answer : '?',
                                hours: hours.answer,
                                weight: weight,
                                grade: grade
                            };

                            event.incidentals = _.findWhere(respondent.responses, {question: 'incidental-species'}) || { answer: [] };
                            // will need to loop through this list and output text (species name) and lbs (weight)

                            event.notes = _.findWhere(respondent.responses, {question: 'notes'}) || $scope.notFound;

                            speciesObj.weather =  _.findWhere(respondent.responses, {question: 'weather'}) || $scope.notFound;   

                            speciesObj.events.push(event);                                
                        });
                    }
                });
            });
        };    

        $scope.convertToDMS = function(position) {
            var deg = position | 0; // truncate dd to get degrees
            var frac = Math.abs(position - deg); // get fractional part
            var min = (frac * 60) | 0; // multiply fraction by 60 and truncate
            var sec = ((((frac * 3600 - min * 60) * 1000) | 0) / 1000);
            return [deg, min, sec];
        };    

        $scope.getAnswerFromRespondent = function(respondent, questionSlug) {
            var response = _.findWhere(respondent.responses, {question_slug: questionSlug});
            if (response && response.answer) {
                return response.answer;
            } 
            return undefined;
        };

        $scope.retrieveTripFromServer = function(trip_uuid) {
            var url = app.server 
                  + '/api/v1/tripreportdetails/'
                  + trip_uuid
                  + '/?format=json';        

            return $http.get(url)
                .success(function (data) {
                    //TODO
                    //construct $scope.trip to reflect expectations 
                    $scope.trip = {
                        user: {},
                        events: {},
                        uuid: data.uuid,
                        startDate: data.start_date
                    };
                    _.each(data.respondants, function(respondent) {
                        var event_type = respondent.survey_slug;
                        if (!$scope.trip.events[event_type]) {
                            $scope.trip.events[event_type] = {};
                            $scope.trip.events[event_type].respondents = [];
                        } 
                        $scope.trip.events[event_type].respondents.push(respondent); 
                        $scope.trip.events[event_type]['vessel-name'] = $scope.getAnswerFromRespondent(respondent, 'vessel-name');
                        $scope.trip.events[event_type]['permit-number'] = $scope.getAnswerFromRespondent(respondent, 'permit-number');
                        $scope.trip.events[event_type]['landing-port'] = $scope.getAnswerFromRespondent(respondent, 'landing-port');
                        $scope.trip.events[event_type]['dealer'] = $scope.getAnswerFromRespondent(respondent, 'dealer');
                        _.each(respondent.responses, function(response) {
                            response.question = response.question_slug;
                            response.answer = response.answer;
                        });
                    });
                    $scope.constructTripSummary();
                    $scope.working = false;
                    // var respondent = data;
                    // if (typeof(respondent.responses.question) !== 'string') {
                    //     _.each(respondent.responses, function(response, index) {
                    //         var questionSlug = response.question.slug;
                    //         try {
                    //             answer_raw = JSON.parse(response.answer_raw);
                    //         } catch(e) {
                    //             console.log('failed to parse answer_raw');
                    //             answer_raw = response.answer;
                    //         }
                    //         response.question = questionSlug;
                    //         response.answer = answer_raw;
                    //     });
                    // }
                    // respondent.survey = respondent.survey_slug;
                    // $scope.respondent = respondent;
                }).error(function (err) {
                    console.log(JSON.stringify(err));
                    debugger;
                }); 
        };
        
        if ($scope.calledFrom === 'maps') {
            $scope.working = true;
            $scope.calledFromMaps = true;
            $scope.retrieveTripFromServer($routeParams.uuid);
        } else if ($routeParams.uuid && app.unSubmittedTrips && app.unSubmittedTrips[$routeParams.uuid]) {
            $scope.trip = app.unSubmittedTrips[$routeParams.uuid];
            $scope.calledFromUnsubmittedTripList = true;
            try {
                $scope.constructTripSummary();
            } catch (e) {
                app.message = "Hmmm... We've experienced a problem with your trip. It's possible data was lost. Please try again later."
                $location.path('/unSubmittedTripList');
            }
        } else {
            $scope.trip = app.currentTrip;    
            $scope.calledFromUnsubmittedTripList = false; // at the moment it may actually have been called from Unsubmitted Trips (indirectly through complete.js) 
            try {                
                $scope.constructTripSummary();
            } catch (e) {
                app.message = "Hmmm... We've experienced a problem with your trip. It's possible data was lost. Please review your trip from the Unsubmitted Trips page."
                $location.path('/main');
            }
        }
        

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
                // not sure if this is still necessary...removing until the necessity arises again...
                if (!app.user.registration.logbooks) {
                    app.user.registration.logbooks = {};
                }
                if (!app.user.registration.logbooks[key]) {
                    app.user.registration.logbooks[key] = {};
                }
                if (app.user.registration.logbooks[key]) {
                    app.user.registration.logbooks[key]['permit-number'] = value['permit-number'];
                    app.user.registration.logbooks[key]['vessel-number'] = value['vessel-number'];
                    app.user.registration.logbooks[key]['vessel-name'] = value['vessel-name'];
                    if ( ! _.findWhere(app.user.registration.vessels, {name: value['vessel-name']}) ) {
                        // not sure if this is still necessary...removing until the necessity arises again...
                        // if (!app.user.registration.vessels) {
                        //     app.user.registration.vessels = [];
                        // }
                        app.user.registration.vessels.push( { name: value['vessel-name'], number: value['vessel-number'] } );
                    }
                }
            });
        };

        $scope.saveProfileToServer = function() {
            console.log(app.user.registration);
            var url = app.server + '/account/updateUser/';

            // not sure if this is still necessary...removing until the necessity arises again...
            // if (!app.user.registration.email) {
            //     app.user.registration.email = app.user.email;
            // }
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

                    // perhaps this will prevent the trip from being lost when there is a problem saving...
                    // app.respondents[$scope.trip.uuid] = $scope.trip;
                    // actually, app.respondents should not be a trip.uuid but a respondent uuid
                    _.each($scope.trip.events, function(value, key) {
                        _.each(value.respondents, function(respondent) {
                            app.respondents[respondent.uuid] = respondent;
                        });
                    });
                    
                    // might need to save the state of app at this time too...
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
                app.message = "View the Unsubmitted Trips page at anytime to complete your trip.";
                $location.path('/unSubmittedTripList');
            }

            // app.respondents[$routeParams.uuidSlug].complete = true;
            // app.respondents[$routeParams.uuidSlug].status = 'complete';
            // delete app.user.resumePath;
            // app.message = "You have completed a trip log.";


        };

        $scope.back = function() {
            if ($scope.calledFromMaps) {
                $location.path('/maps')
            } else if ($scope.calledFromUnsubmittedTripList) {
                $location.path('/unSubmittedTripList')
            } else {     
                $location.path('/survey/'+app.currentRespondent.survey+'/complete/'+app.currentRespondent.uuid);
            }
        }

});

var SpeciesSummaryCtrl = function ($scope, $modalInstance, speciesObj) {

    $scope.title = speciesObj.name;
    $scope.speciesObj = speciesObj;
    $scope.weather = speciesObj.weather.answer;

    $scope.ok = function () {
        $modalInstance.close();
    };

};