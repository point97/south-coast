//'use strict';

angular.module('askApp')
.controller('ProfileCtrl', function ($scope, $modal, $routeParams, $http, $location, storage, profileService) {
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
        profileService.saveState($scope.profile.fullName, $scope.profile.email, $scope.profile.license, $scope.profile.logbooks, $scope.profile.buoys, $scope.profile.crew);
        $location.path('/profile/logbook')    
    };

    $scope.editLogbook = function(logbookType) {
        profileService.saveState($scope.profile.fullName, $scope.profile.email, $scope.profile.license, $scope.profile.logbooks, $scope.profile.buoys, $scope.profile.crew);
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
        profileService.saveState($scope.profile.fullName, $scope.profile.email, $scope.profile.license, $scope.profile.logbooks, $scope.profile.buoys, $scope.profile.crew);
        profileService.saveToServer();
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

    /*** Modals ***/

    $scope.addBuoy = function () {

        var modalInstance = $modal.open({
            templateUrl: 'addBuoy',
            controller: AddBuoyCtrl
        });

        modalInstance.result.then(function (buoy) {
            $scope.profile.buoys.push(buoy);
        });
    };

    $scope.editBuoys = function () {

        var modalInstance = $modal.open({
            templateUrl: 'editBuoys',
            controller: EditBuoyCtrl,
            resolve: {
                buoys: function () {
                  return $scope.profile.buoys;
                }
            }
        });

        modalInstance.result.then(function (buoys) {
            $scope.profile.buoys = buoys;            
        });
    };

    $scope.addCrewMember = function () {

        var modalInstance = $modal.open({
            templateUrl: 'addCrewMember',
            controller: AddCrewMemberCtrl
        });

        modalInstance.result.then(function (crewMember) {
            $scope.profile.crew.push(crewMember);
        });
    };

    $scope.editCrew = function () {

        var modalInstance = $modal.open({
            templateUrl: 'editCrew',
            controller: EditCrewCtrl,
            resolve: {
                crew: function () {
                  return $scope.profile.crew;
                }
            }
        });

        modalInstance.result.then(function (crew) {
            $scope.profile.crew = crew;            
        });
    };

    $scope.addPort = function () {

        var modalInstance = $modal.open({
            templateUrl: 'addPort',
            controller: AddPortCtrl
        });

        modalInstance.result.then(function (port) {
            $scope.profile.ports.push(buoy);
        });
    };

    $scope.editPorts = function () {

        var modalInstance = $modal.open({
            templateUrl: 'editPorts',
            controller: EditPortCtrl,
            resolve: {
                ports: function () {
                  return $scope.profile.ports;
                }
            }
        });

        modalInstance.result.then(function (ports) {
            $scope.profile.ports = ports;            
        });
    };


    
});

var AddBuoyCtrl = function ($scope, $modalInstance) {

    $scope.buoy = {};

    $scope.ok = function () {
        $modalInstance.close($scope.buoy);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }; 
};

var EditBuoyCtrl = function ($scope, $modalInstance, buoys) {

    $scope.editBuoys = angular.copy(buoys);

    $scope.removeBuoy = function(index) {
        $scope.editBuoys.splice(index, 1);
    }

    $scope.ok = function () {
        $modalInstance.close($scope.editBuoys);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }; 
};

var AddCrewMemberCtrl = function ($scope, $modalInstance) {

    $scope.crewMember = {};

    $scope.ok = function () {
        $modalInstance.close($scope.crewMember);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }; 
};

var EditCrewCtrl = function ($scope, $modalInstance, crew) {

    $scope.editCrew = angular.copy(crew);

    $scope.removeCrewMember = function(index) {
        $scope.editCrew.splice(index, 1);
    }

    $scope.ok = function () {
        $modalInstance.close($scope.editCrew);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }; 
};

var AddPortCtrl = function ($scope, $modalInstance) {

    $scope.port = {};

    $scope.ok = function () {
        $modalInstance.close($scope.port);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }; 
};

var EditPortCtrl = function ($scope, $modalInstance, ports) {

    $scope.editPorts = angular.copy(ports);

    $scope.removeBuoy = function(index) {
        $scope.editPorts.splice(index, 1);
    }

    $scope.ok = function () {
        $modalInstance.close($scope.editPorts);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }; 
};


