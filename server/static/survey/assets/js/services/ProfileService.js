//'use strict';

angular.module('askApp')
  .factory('profileService', function ($http, $location) {

    var getProfileFromServer = function() {
        var profile = {};
        profile.logbooks = [];
        profile.vessels = [];
        profile.ports = [];
        profile.buoys = [];
        profile.crew = [];
        if (app.user) {
            profile.user = app.user;
            //$scope.answers = app.user.registration;
        } else {
            profile.user = {};
        }
        return profile;
    };
    var profile = getProfileFromServer();
    var logbookToEdit = undefined;
   
    if (app.user) {
        profile.user = app.user;
        //$scope.answers = app.user.registration;
    } 
    
    var getProfile = function() {
        if (profile) {
            return angular.copy(profile);    
        } else {
            profile = getProfileFromServer();
            return angular.copy(profile);
        }
        
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
            profile.user.email = email;
        }
        if (license) {
            profile.license = license;
        }
        profile.logbooks = logbooks;
        profile.buoys = buoys;
        profile.crew = crew;
    };

    // Public API here
    return {
      'getProfile': getProfile,
      'saveState': saveState,
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
