

angular.module('askApp')
  .factory('loggingService', function ($http) {

	var log = function(logEntry) {
		var message = {};
		if (app && app.user && app.user.username) {
			message['user'] = app.user.username;
		}  
		if (app && app.version) {
        	message['version'] = app.version;
		}  
		message['logEntry'] = logEntry;    
        console.log(JSON.stringify(message));
        console.log(JSON.stringify({'message': message}));
        return $.post(app.server + '/tracekit/error/', {
            stackinfo: JSON.stringify({'message': message})
        });
    };

    // Public API
    return {
      'log': log,
    };
});