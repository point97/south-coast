//'use strict';

angular.module('askApp')
  .factory('profileService', function ($http, $location) {

    var getProfileFromServer = function() {
        var profile = {};
        profile.logbooks = [];
        profile.vessels = [];
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

    var saveState = function(name, email, cfl) {
        if (name) {
            profile.fullName = name;
        } 
        if (email) {
            profile.user.email = email;
        }
        if (cfl) {
            profile.cfl = cfl;
        }
    };

    /*** this is what the profile JSON looks like
    profileJSON = {
        user: {
            email: ""
        },
        fullName: "", // NOTE:  might need to split this into 2 fields for First and Last names...
        cfl: "", 
        logbooks: [
            {},
            ...
        ],
        vessels = [ 
            { name: "", number: "" },
            ...    
        ],
        ...
    }
    ***/
   

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
