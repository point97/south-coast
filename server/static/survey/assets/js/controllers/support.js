
angular.module('askApp')
  .controller('SupportCtrl', ['$scope', '$location', '$http', 'storage', function MainCtrl($scope, $location, $http, storage) {
    $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

    $scope.title = "Support";

    $scope.version = app.version;
    $scope.stage = app.stage;
    

    $(window).on('resize', $scope.resizeMap);


    
    

  }]);
