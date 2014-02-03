//'use strict';

angular.module('askApp')
.controller('ProfileCtrl', function ($scope, $routeParams, $http, $location, storage, profileService) {
    //$http.defaults.headers.post['Content-Type'] = 'application/json';
    $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

    $scope.title = "Profile";
    $scope.loading = false;
    $scope.width = 0;
    $scope.savePage = true;
    
    profileService.purgeLogbookToEdit();
    
    $scope.closeView = function() {
        $location.path('/main'); 
    };    

    $scope.profile = profileService.getProfile();

    $scope.addLogbook = function() {
        profileService.saveState($scope.profile.fullName, $scope.profile.user.email, $scope.profile.cflNumber);
        $location.path('/profile/logbook')    
    };

    $scope.editLogbook = function(logbookType) {
        profileService.prepLogbookToEdit(logbookType)
        $location.path('/profile/logbook');
    };

    $scope.validity = {};
    
    $scope.cancel = function() {
        profileService.cancelState();
        $location.path('/main');
    };

    /*** should we migrate this functionality to profileService...? ***/
    $scope.updateProfile = function (profileQuestions) {
        profileService.saveState($scope.profile.fullName, $scope.profile.user.email, $scope.profile.cflNumber);
        $location.path('/main');
        // var url = app.server + '/account/updateUser/',
        //     registration = {};

        // _.each(profileQuestions, function(item, i) {
        //     registration[item.slug] = item.answer;
        // });
        // $http.post(url, {username: app.user.username, registration: registration, fullName: $scope.fullName, email: $scope.userEmail, cfl: $scope.cflNumber})
        //     .success(function (data) {
        //         app.user.registration = registration;
        //         storage.saveState(app);
        //         $location.path('/main');
        //     })
        //     .error(function (data, status) {
        //         if (status === 0) {
        //             app.user.registration = registration;
        //             storage.saveState(app);
        //             $location.path('/main');      
        //         }
        //         else if (data) {
        //             $scope.showError = data;    
        //         } else {
        //             $scope.showError = "There was a problem creating an account.  Please try again later."
        //         }            
        //     });
    };

    
});
