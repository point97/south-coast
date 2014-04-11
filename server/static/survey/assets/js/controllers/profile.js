//'use strict';

angular.module('askApp')
.controller('ProfileCtrl', function ($scope, $modal, $routeParams, $http, $location, storage, profileService) {
    //$http.defaults.headers.post['Content-Type'] = 'application/json';
    $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

    $scope.title = "Profile";
    $scope.loading = false;
    $scope.width = 0;
    $scope.savePage = true;
    $scope.message = false;

    profileService.purgeLogbookToEdit();
    
    $scope.closeView = function() {
        $location.path('/main'); 
    };    

    $scope.profile = profileService.getProfile();

    $scope.addLogbook = function() {
        if (profileService.getRemainingLogbookTypes().length) {
            profileService.saveState($scope.profile.firstName, $scope.profile.lastName, $scope.profile.email, $scope.profile.license, $scope.profile.logbooks, $scope.profile.vessels);
            $location.path('/profile/logbook'); 
        } else {   
            $scope.noRemainingLogbooks();
        }        
    };

    $scope.editLogbook = function(logbookType) {
        profileService.saveState($scope.profile.firstName, $scope.profile.lastName, $scope.profile.email, $scope.profile.license, $scope.profile.logbooks, $scope.profile.vessels);
        profileService.prepLogbookToEdit(logbookType)
        $location.path('/profile/logbook');
    };

    $scope.validity = {};
    
    $scope.cancel = function() {
        profileService.cancelState();
        $location.path('/main');
    };

    $scope.updateProfile = function (profileQuestions) {
        profileService.saveState($scope.profile.firstName, $scope.profile.lastName, $scope.profile.email, $scope.profile.license, $scope.profile.logbooks, $scope.profile.vessels);
        profileService.saveToServer();
        $location.path('/main');
    };

    $scope.updatePassword = function (passwords) {
        var url = app.server + "/account/updatePassword";
        $scope.showError = false;
        $http.post(url, {username: app.user.username, passwords: passwords})
            .success(function (data) {
                $scope.passwords = null;
                $scope.changingPassword = false;
                $scope.message = "Your password has been changed.";
            })
            .error(function (data) {
                $scope.showError = data;                
            });
    };
    

    /*** Modals ***/

    $scope.noRemainingLogbooks = function () {

        var modalInstance = $modal.open({
            templateUrl: 'noRemainingLogbooks',
            controller: NoRemainingLogbooksCtrl,
            windowClass: 'padding-top-20',
        });

    };

    /*** Modals ***/

    $scope.addVessel = function () {

        var modalInstance = $modal.open({
            templateUrl: 'addVessel',
            controller: AddVesselCtrl,
            windowClass: 'padding-top-20',
        });

        modalInstance.result.then(function (vessel) {
            if (vessel.name && vessel.number) {
                if (!$scope.profile.vessels) {
                    $scope.profile.vessels = [];
                }
                $scope.profile.vessels.push(vessel);
                // if ($scope.logbookToEdit) {
                //     $scope.logbookToEdit.vessel = vessel;
                // } else {
                //     $scope.logbook.vessel = vessel;
                // }
            }            
        });
    };

    $scope.editVessel = function (vessel) {

        var modalInstance = $modal.open({
            templateUrl: 'editVessel',
            controller: EditVesselCtrl,
            windowClass: 'padding-top-20',
            resolve: {
                vessel: function () {
                  return vessel;
                },
                vessels: function () {
                  return $scope.profile.vessels;
                }
            }
        });

        // modalInstance.result.then(function (vessel) {
        //     $scope.profile.vessels = vessels;
        //     if ($scope.logbookToEdit && !_.findWhere(vessels, {number: $scope.logbookToEdit.vessel.number})) {
        //         if (vessels.length) {
        //             $scope.logbookToEdit.vessel = vessels[0];    
        //         } else {
        //             $scope.logbookToEdit.vessel = {};
        //         }           
        //     } else if (!$scope.logbookToEdit) {
        //         if ($scope.logbook.vessel && !_.findWhere(vessels, {number: $scope.logbook.vessel.number})) {
        //             if (vessels.length) {
        //                 $scope.logbook.vessel = vessels[0];    
        //             } else {
        //                 $scope.logbook.vessel = {};
        //             }
        //         }
        //     }
        // });
    };


    // $scope.addBuoy = function () {

    //     var modalInstance = $modal.open({
    //         templateUrl: 'addBuoy',
    //         controller: AddBuoyCtrl,
    //         windowClass: 'padding-top-20',
    //     });

    //     modalInstance.result.then(function (buoy) {
    //         if (!$scope.profile.buoys) {
    //             $scope.profile.buoys = [];
    //         }
    //         $scope.profile.buoys.push(buoy);
    //     });
    // };

    // $scope.editBuoys = function () {

    //     var modalInstance = $modal.open({
    //         templateUrl: 'editBuoys',
    //         controller: EditBuoyCtrl,
    //         windowClass: 'padding-top-20',
    //         resolve: {
    //             buoys: function () {
    //               return $scope.profile.buoys;
    //             }
    //         }
    //     });

    //     modalInstance.result.then(function (buoys) {
    //         $scope.profile.buoys = buoys;            
    //     });
    // };

    // $scope.addCrewMember = function () {

    //     var modalInstance = $modal.open({
    //         templateUrl: 'addCrewMember',
    //         controller: AddCrewMemberCtrl
    //     });

    //     modalInstance.result.then(function (crewMember) {
    //         if (!$scope.profile.crew) {
    //             $scope.profile.crew = [];
    //         }
    //         $scope.profile.crew.push(crewMember);
    //     });
    // };

    // $scope.editCrew = function () {

    //     var modalInstance = $modal.open({
    //         templateUrl: 'editCrew',
    //         controller: EditCrewCtrl,
    //         resolve: {
    //             crew: function () {
    //               return $scope.profile.crew;
    //             }
    //         }
    //     });

    //     modalInstance.result.then(function (crew) {
    //         $scope.profile.crew = crew;            
    //     });
    // };

    // $scope.addPort = function () {

    //     var modalInstance = $modal.open({
    //         templateUrl: 'addPort',
    //         controller: AddPortCtrl
    //     });

    //     modalInstance.result.then(function (port) {
    //         if (!$scope.profile.ports) {
    //             $scope.profile.ports = [];
    //         }
    //         $scope.profile.ports.push(buoy);
    //     });
    // };

    // $scope.editPorts = function () {

    //     var modalInstance = $modal.open({
    //         templateUrl: 'editPorts',
    //         controller: EditPortCtrl,
    //         resolve: {
    //             ports: function () {
    //               return $scope.profile.ports;
    //             }
    //         }
    //     });

    //     modalInstance.result.then(function (ports) {
    //         $scope.profile.ports = ports;            
    //     });
    // };

    
});

var NoRemainingLogbooksCtrl = function ($scope, $modalInstance) {

    $scope.ok = function () {
        $modalInstance.close();
    };

};

var AddVesselCtrl = function ($scope, $modalInstance) {

    $scope.vessel = {};

    $scope.ok = function () {
        $modalInstance.close($scope.vessel);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }; 
};

var EditVesselCtrl = function ($scope, $modalInstance, vessel, vessels) {

    // $scope.editVessel = angular.copy(vessel);
    $scope.vessel = vessel;
    $scope.vessels = vessels;
    $scope.index = _.indexOf(vessels, vessel);

    $scope.removeVessel = function() {
        $scope.vessels.splice($scope.index, 1);
        $modalInstance.close($scope.vessel);
    }

    $scope.ok = function () {
        $modalInstance.close($scope.vessel); //$scope.editVessel
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }; 
};


// var AddBuoyCtrl = function ($scope, $modalInstance) {

//     $scope.buoy = {};

//     $scope.ok = function () {
//         $modalInstance.close($scope.buoy);
//     };

//     $scope.cancel = function () {
//         $modalInstance.dismiss('cancel');
//     }; 
// };

// var EditBuoyCtrl = function ($scope, $modalInstance, buoys) {

//     $scope.editBuoys = angular.copy(buoys);

//     $scope.removeBuoy = function(index) {
//         $scope.editBuoys.splice(index, 1);
//     }

//     $scope.ok = function () {
//         $modalInstance.close($scope.editBuoys);
//     };

//     $scope.cancel = function () {
//         $modalInstance.dismiss('cancel');
//     }; 
// };

// var AddCrewMemberCtrl = function ($scope, $modalInstance) {

//     $scope.crewMember = {};

//     $scope.ok = function () {
//         $modalInstance.close($scope.crewMember);
//     };

//     $scope.cancel = function () {
//         $modalInstance.dismiss('cancel');
//     }; 
// };

// var EditCrewCtrl = function ($scope, $modalInstance, crew) {

//     $scope.editCrew = angular.copy(crew);

//     $scope.removeCrewMember = function(index) {
//         $scope.editCrew.splice(index, 1);
//     }

//     $scope.ok = function () {
//         $modalInstance.close($scope.editCrew);
//     };

//     $scope.cancel = function () {
//         $modalInstance.dismiss('cancel');
//     }; 
// };

// var AddPortCtrl = function ($scope, $modalInstance) {

//     $scope.port = {};

//     $scope.ok = function () {
//         $modalInstance.close($scope.port);
//     };

//     $scope.cancel = function () {
//         $modalInstance.dismiss('cancel');
//     }; 
// };

// var EditPortCtrl = function ($scope, $modalInstance, ports) {

//     $scope.editPorts = angular.copy(ports);

//     $scope.removeBuoy = function(index) {
//         $scope.editPorts.splice(index, 1);
//     }

//     $scope.ok = function () {
//         $modalInstance.close($scope.editPorts);
//     };

//     $scope.cancel = function () {
//         $modalInstance.dismiss('cancel');
//     }; 
// };


