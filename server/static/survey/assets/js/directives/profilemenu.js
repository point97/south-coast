
angular.module('askApp')
    .directive('profilemenu', function() {

    return {
        templateUrl: 'views/profileMenu.html',
        restrict: 'EA',
        replace: true,
        transclude: true,
        scope: false,
        link: function (scope, element, attrs) {
        }
    }
});