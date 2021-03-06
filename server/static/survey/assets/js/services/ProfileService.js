//'use strict';

angular.module('askApp')
  .factory('profileService', function ($http, $location, storage) {

    var getEmptyProfile = function() {
        var profile = {};
        if (app.user) {
            profile.email = app.user.email || "";
            profile.firstName = app.user.firstName || "";
            profile.lastName = app.user.lastName || "";
        }
        profile.logbooks = {};
        profile.vessels = [];
        // profile.ports = [];
        // profile.buoys = [];
        // profile.crew = [];        
        return profile;
    };

    var ensureProfileComponentsExist = function(profile) {
        if (app.user) {
            if (!profile.email) {
                profile.email = app.user.email || "";
            }
            if (!profile.firstName && app.user.registration) {
                profile.firstName = app.user.registration.firstName || "";
            }
            if (!profile.lastName && app.user.registration) {
                profile.lastName = app.user.registration.lastName || "";
            }            
        }
        if (!profile.logbooks) {
            profile.logbooks = {};
        }
        if (!profile.vessels) {
            profile.vessels = [];
        }
        return profile;       
    };
    
    var getProfile = function() {
        if (app.user.registration && app.user.registration !== "{}") {
            profile = ensureProfileComponentsExist(app.user.registration); 
        } else {
            profile = app.user.registration = getEmptyProfile();
        }
        return angular.copy(profile);        
    };
    var profile = getProfile();
    
    var logbookToEdit = undefined;

    var addLogbook = function(type, urchinPermit, cucumberPermit, vessel, vessels) {
        var logbook = { 'type': type,
                        'urchin-permit-number': urchinPermit,
                        'sea-cucumber-permit-number': cucumberPermit,
                        'vessel-name': vessel.name,
                        'vessel-number': vessel.number };
        if (!profile.logbooks) {
            profile.logbooks = {};
        }
        profile.logbooks[type] = logbook;   
        profile.vessels = vessels;             
    };

    var updateLogbook = function(type, urchinPermit, cucumberPermit, vessel, vessels) {
        var newLogbook = {  'type': type,
                            'urchin-permit-number': urchinPermit,
                            'sea-cucumber-permit-number': cucumberPermit,
                            'vessel-name': vessel.name,
                            'vessel-number': vessel.number };
        // var oldLogbook = profile.logbooks[type];
        profile.logbooks[type] = newLogbook;     
        logbookToEdit = undefined;  
        profile.vessels = vessels;       
    };

    var getRemainingLogbookTypes = function() {
        // will want to get Logbook Types from Server 
        var remainingTypes = [];
        if (!profile.logbooks) {
            remainingTypes = ['dive'];
        } else if (!profile.logbooks['dive']) {
            remainingTypes.push('dive');
        } 
        // if (!profile.logbooks['cpfv']) {
        //     remainingTypes.push('cpfv');
        // }
        // if (!profile.logbooks['trap']) {
        //     remainingTypes.push('trap');
        // }
        return remainingTypes;
    };

    var prepLogbookToEdit = function(type) {
        logbookToEdit = profile.logbooks[type];
        logbookToEdit.type = type;
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

    var saveState = function(firstName, lastName, email, license, logbooks, vessels) {
        if (firstName) {
            profile.firstName = firstName;
        } 
        if (lastName) {
            profile.lastName = lastName;
        }
        if (email) {
            profile.email = email;
        }
        if (license) {
            profile.license = license;
        }
        profile.logbooks = logbooks;
        profile.vessels = vessels;
        // profile.buoys = buoys;
        // profile.crew = crew;
    };

    var saveToServer = function() {
        var url = app.server + '/account/updateUser/';
        
        $http.post(url, {username: app.user.username, firstname: profile.firstName, lastname: profile.lastName, registration: profile, email: profile.email})
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
                    // $scope.showError = data;  
                    // debugger;
                    console.log('ERROR: ' + data);
                } else {
                    // $scope.showError = "There was a problem saving your information.  Please try again later."
                    // debugger;
                    console.log('ERROR: ');
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
