//'use strict';

angular.module('askApp')
.controller('LogbookCtrl', function ($scope, $routeParams, $http, $location, storage) {
    //$http.defaults.headers.post['Content-Type'] = 'application/json';
    $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

    $scope.title = "New Logbook";
    $scope.loading = true;
    $scope.width = 0;

    /*** BETA -- will need to fetch from server ***/
    $scope.remainingLogbooks = [ { slugname: 'cpfv' }, { slugname: 'trap' } ];
    /*** end BETA ***/
    
    if (app.user) {
        $scope.user = app.user;
    } else {
        $scope.user = false;
    }

    $scope.loading = false;


    $scope.closeView = function() {
        $location.path('/profile'); 
    };
    
});
