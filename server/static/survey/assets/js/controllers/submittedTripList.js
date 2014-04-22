//'use strict';

angular.module('askApp')
    .controller('submittedTripListCtrl', function($scope, $http, $routeParams, $location, survey, history, storage) {
        $http.defaults.headers.post['Content-Type'] = 'application/json';

        if (app.user) {
            $scope.user = app.user;    
        } else {
            $location.path('/');
        }

        $scope.title = 'Submitted Trips';

        $scope.path = $location.path().slice(1,5);

        $scope.showTripList = true;

        if (app.submittedTrips && app.submittedTrips.numberOfTrips) {
            $scope.limit = app.submittedTrips.numberOfTrips;
        } else {
            $scope.limit = 8;
            app.submittedTrips = { numberOfTrips: $scope.limit };
        }

        $scope.getSubmittedTripsFromServer = function() {
            var url = $scope.next20 ? $scope.next20 : 
                    app.server 
                    + '/api/v1/tripreport/?user__username__exact=' 
                    + $scope.user.username 
                    + '&limit=' + $scope.limit
                    + '&format=json';
            
            return $http.get(url).error(function (err) {
                console.log(JSON.stringify(err));
                // debugger;
                console.log('ERROR: ' + err);
                TraceKit.report({message: 'ERROR: ' + err});
            }).success(function (callback) { $scope.next20 = callback.meta.next; $scope.gettingNext20 = false; }); 
        };

        $scope.showNext20 = function() {
            $scope.gettingNext20 = true;
            $scope.getSubmittedTrips();
        };

        $scope.getSubmittedTrips = function() {
            $scope.getSubmittedTripsFromServer()
                .success(function (data) {
                    $scope.addTripsToList(data.objects);
                    $scope.submittedSpinner = false;
                    $scope.busy = false;
                    // console.log($scope.respondentList);
                    // TraceKit.report({message: 'SUCCESS: ' + data});
                }).error(function (data) {
                    $scope.error = true;
                    $scope.busy = false;
                    TraceKit.report({message: 'ERROR: ' + data});
                    // $location.path('/signin?error=not-logged-in');
                }); 
        };

        $scope.addTripsToList = function(trips) {
            _.each(trips, function(trip) {
                var numberOfEvents = trip.respondants.length;
                var date_obj = new Date(trip.start_date);
                trip.title = (date_obj.getUTCMonth()+1) +"/"+ date_obj.getUTCDate() + "/" + date_obj.getUTCFullYear();
                if (numberOfEvents > 1) {
                    trip.title +=  ' -- ' + numberOfEvents + ' Events';
                } else {
                    trip.title +=  ' -- ' + numberOfEvents + ' Event';
                }
            });
            $scope.tripList.push.apply($scope.tripList, trips);
            app.submittedTrips.numberOfTrips = $scope.tripList.length;
        };

        $scope.viewTripSummary = function(trip) {
            $location.path(app.viewPath + '/tripSummary/submittedTrips/' + trip.uuid);
        };

        $scope.tripList = [];
        $scope.busy = true;
        $scope.getSubmittedTrips();
        

});