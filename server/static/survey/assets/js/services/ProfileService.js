//'use strict';

angular.module('askApp')
  .factory('profileService', function ($http, $location) {

    var getEmptyProfile = function() {
        var profile = {};
        if (app.user) {
            profile.email = app.user.email;
        }
        profile.logbooks = [];
        profile.vessels = [];
        profile.ports = [];
        profile.buoys = [];
        profile.crew = [];        
        return profile;
    };
    var profile = getEmptyProfile();
    var logbookToEdit = undefined;
    
    var getProfile = function() {
        if (app.user && app.user.registration) {
            profile = app.user.registration; 
        } else {
            profile = getEmptyProfile();
        }
        return angular.copy(profile);
        
    };

    var addLogbook = function(type, permit, vessel, vessels) {
        var logbook = { 'type': type,
                        'permit': permit,
                        'vessel': vessel };
        profile.logbooks.push(logbook);   
        profile.vessels = vessels;             
    };

    var updateLogbook = function(type, permit, vessel, vessels) {
        var newLogbook = {  'type': type,
                            'permit': permit,
                            'vessel': vessel  };
        var oldLogbook = _.findWhere(profile.logbooks, {'type': type});
        oldLogbook = newLogbook;     
        logbookToEdit = undefined;  
        profile.vessels = vessels;       
    };

    var getRemainingLogbookTypes = function() {
        // will want to get Logbook Types from Server 
        var allTypes = ['DIVE', 'CPFV', 'TRAP'];
        var existingTypes = _.pluck(profile.logbooks, 'type');
        return _.difference(allTypes, existingTypes);
    };

    var prepLogbookToEdit = function(type) {
        logbookToEdit = _.findWhere(profile.logbooks, {'type': type});
    };

    var purgeLogbookToEdit = function(type) {
        logbookToEdit = undefined;
    };

    var hasLogbookToEdit = function() {
        if (logbookToEdit) {
            return true;
        } else {
            return false;
        }
    }

    var getLogbookToEdit = function() {
        return logbookToEdit;   
    };

    var cancelState = function() {
        profile = null;
    };

    var saveState = function(name, email, license, logbooks, buoys, crew) {
        if (name) {
            profile.fullName = name;
        } 
        if (email) {
            profile.email = email;
        }
        if (license) {
            profile.license = license;
        }
        profile.logbooks = logbooks;
        profile.buoys = buoys;
        profile.crew = crew;
    };

    var saveToServer = function() {
        var url = app.server + '/account/updateUser/';
        
        $http.post(url, {username: app.user.username, registration: profile, email: profile.email})
            .success(function (data) {
                app.user.registration = profile;
                storage.saveState(app);
                $location.path('/main');
            })
            .error(function (data, status) {
                if (status === 0) {
                    app.user.registration = profile;
                    storage.saveState(app);
                    $location.path('/main');      
                }
                else if (data) {
                    $scope.showError = data;    
                } else {
                    $scope.showError = "There was a problem saving your information.  Please try again later."
                }            
            });
    };

    // Public API here
    return {
      'getProfile': getProfile,
      'saveState': saveState,
      'saveToServer': saveToServer,
      'cancelState': cancelState,
      'addLogbook': addLogbook,
      'updateLogbook': updateLogbook,
      'prepLogbookToEdit': prepLogbookToEdit,
      'purgeLogbookToEdit': purgeLogbookToEdit,
      'getLogbookToEdit': getLogbookToEdit,
      'hasLogbookToEdit': hasLogbookToEdit,      
      'getRemainingLogbookTypes': getRemainingLogbookTypes
    };
  });
