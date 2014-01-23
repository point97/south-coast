/*** Not sure this is being used... ***/
/*** mobilemenu is being used as a directive ***/
angular.module('askApp')
    .controller('MobileMenuCtrl', function($scope, $http, $routeParams, $location) {
        $scope.$watch(function () { return $location.path() }, function () {
            $scope.path = $location.path();
        });
});