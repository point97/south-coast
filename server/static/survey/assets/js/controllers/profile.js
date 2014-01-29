//'use strict';

angular.module('askApp')
.controller('ProfileCtrl', function ($scope, $routeParams, $http, $location, storage) {
    //$http.defaults.headers.post['Content-Type'] = 'application/json';
    $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

    $scope.title = "Profile";
    $scope.loading = false;
    $scope.width = 0;
    $scope.savePage = true;
    
    $scope.closeView = function() {
        $location.path('/main'); 
    };    

    /*** BETA -- will need to fetch from server ***/
    $scope.logbooks = [ { slugname: 'dive' } ];
    /*** end BETA ***/

    var getProfileQuestions = function () {
        var profileQuestions = [];

        _.each($scope.surveys, function(survey, i) {
            // QUESTION - why doesn't survey.questions include the profile questions?
            // survey.questions is no longer relevant
            _.each(survey.pages, function(page, j) {
                _.each(page.questions, function(question, k) {
                    if (question.attach_to_profile) {
                        profileQuestions.push(question);
                    } 
                })
            });
        });

        $scope.loading = false;
        return _.uniq(profileQuestions, false, function(question) {
            return question.slug;
        });
    };

    $scope.validity = {};

    if (app.user) {
        $scope.user = app.user;
        $scope.answers = app.user.registration;
    } else {
        $scope.user = false;
    }
    $scope.path = false;

    if (app.surveys) {
        $scope.surveys = app.surveys;
        $scope.profileQuestions = getProfileQuestions();
    } else {
        //updateSurveys();
    }
    $scope.userEmail = $scope.user.email;
    
    $scope.updateProfile = function (profileQuestions) {
        var url = app.server + '/account/updateUser/',
            registration = {};

        _.each(profileQuestions, function(item, i) {
            registration[item.slug] = item.answer;
        });
        $http.post(url, {username: app.user.username, registration: registration, fullName: $scope.fullName, email: $scope.userEmail, cfl: $scope.cflNumber})
            .success(function (data) {
                app.user.registration = registration;
                storage.saveState(app);
                $location.path('/main');
            })
            .error(function (data, status) {
                if (status === 0) {
                    app.user.registration = registration;
                    storage.saveState(app);
                    $location.path('/main');      
                }
                else if (data) {
                    $scope.showError = data;    
                } else {
                    $scope.showError = "There was a problem creating an account.  Please try again later."
                }            
            });
    };

    
});
