//'use strict';

angular.module('askApp')
.controller('LogbookCtrl', function ($scope, $modal, $routeParams, $http, $location, storage, profileService) {
    //$http.defaults.headers.post['Content-Type'] = 'application/json';
    $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

    $scope.title = "New Logbook";
    $scope.loading = false;
    // $scope.width = 0;

    // retrieve a copy of the profile 
    $scope.profile = profileService.getProfile();

    /*** will need to fetch from profileService ***/
    $scope.remainingLogbookTypes = profileService.getRemainingLogbookTypes();
    /*** end BETA ***/

    $scope.getVesselReference = function(vesselNumber) {
        return _.findWhere($scope.profile.vessels, {number: vesselNumber});
    };
    
    if (profileService.hasLogbookToEdit()) {
        $scope.logbookToEdit = profileService.getLogbookToEdit();    
        $scope.title = "Edit Logbook";  
        if ($scope.logbookToEdit.vessel) {
            $scope.logbookToEdit.vessel = $scope.getVesselReference($scope.logbookToEdit.vessel.number); 
        }
    } else {
        $scope.logbook = { type: $scope.remainingLogbookTypes[0] };
        if ($scope.profile.vessels.length) {
            $scope.logbook = { vessel: $scope.profile.vessels[0] };
        }
    }

    $scope.updateProfile = function(form) {
        if (!$scope.logbookToEdit) {
            // validate
            if (!form.logbook.permit) {
                $scope.missingPermit = true;
            } else {
                // add logbook in profile
                profileService.addLogbook(form.logbook.type, form.logbook.permit, form.logbook.vessel, $scope.profile.vessels);
                // return to profile view
                $location.path('/profile'); 
            }
        } else { // if $scope.logbookToEdit
            if (!$scope.logbookToEdit.permit) {
                $scope.missingPermit = true;
            } else {
                // update logbook to profile
                profileService.updateLogbook($scope.logbookToEdit.type, $scope.logbookToEdit.permit, $scope.logbookToEdit.vessel, $scope.profile.vessels);
                // return to profile view
                $location.path('/profile'); 
            }
        }
        
    };

    $scope.$watch('logbook.permit', function(newVal, oldVal) {
        if (newVal != "") {
            $scope.missingPermit = false;
        }
    });

    $scope.$watch('logbookToEdit.permit', function(newVal, oldVal) {
        if (newVal != "") {
            $scope.missingPermit = false;
        }
    });

    /*** Modals ***/

    $scope.addVessel = function () {

        var modalInstance = $modal.open({
            templateUrl: 'addVessel',
            controller: AddVesselCtrl
        });

        modalInstance.result.then(function (vessel) {
            $scope.profile.vessels.push(vessel);
            if ($scope.logbookToEdit) {
                $scope.logbookToEdit.vessel = vessel;
            } else {
                $scope.logbook.vessel = vessel;
            }
        });
    };

    $scope.editVessels = function () {

        var modalInstance = $modal.open({
            templateUrl: 'editVessels',
            controller: EditVesselCtrl,
            resolve: {
                vessels: function () {
                  return $scope.profile.vessels;
                }
            }
        });

        modalInstance.result.then(function (vessels) {
            $scope.profile.vessels = vessels;
            if ($scope.logbookToEdit && !_.findWhere(vessels, {number: $scope.logbookToEdit.vessel.number})) {
                if (vessels.length) {
                    $scope.logbookToEdit.vessel = vessels[0];    
                } else {
                    $scope.logbookToEdit.vessel = {};
                }           
            } else if (!$scope.logbookToEdit) {
                if ($scope.logbook.vessel && !_.findWhere(vessels, {number: $scope.logbook.vessel.number})) {
                    if (vessels.length) {
                        $scope.logbook.vessel = vessels[0];    
                    } else {
                        $scope.logbook.vessel = {};
                    }
                }
            }
        });
    };
    
});

var AddVesselCtrl = function ($scope, $modalInstance) {

    $scope.vessel = {};

    $scope.ok = function () {
        $modalInstance.close($scope.vessel);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }; 
};

var EditVesselCtrl = function ($scope, $modalInstance, vessels) {

    $scope.editVessels = angular.copy(vessels);

    $scope.removeVessel = function(index) {
        $scope.editVessels.splice(index, 1);
    }

    $scope.ok = function () {
        $modalInstance.close($scope.editVessels);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }; 
};

