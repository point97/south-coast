
angular.module('askApp')
    .directive('mobileLeftNav', function() {

    return {
        templateUrl: 'views/mobileLeftNav.html',
        restrict: 'EA',
        replace: true,
        transclude: true,
        scope: false,
        link: function (scope, element, attrs) {
        }
    }
});