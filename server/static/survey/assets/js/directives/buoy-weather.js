
angular.module('askApp')
    .directive('buoyWeather', function($http) {

    return {
        templateUrl: 'views/buoyWeather.html',
        restrict: 'EA',
        replace: true,
        transclude: true,
        scope: {
            question: "=question" //scope.question.geojson, scope.question.zoom, etc
        },
        link: function (scope, element, attrs) {

            var buoyLocations = [   {id: 46222, coords: {lat: 33.618, lon: 118.317}},
                                    {id: 46025, coords: {lat: 33.749, lon: 119.053}},
                                    {id: 46221, coords: {lat: 33.854, lon: 118.633}} 
            ];  
            //var weatherXML = '  <observation id="46025" name="Santa Monica Basin - 33NM WSW of Santa Monica, CA" lat="33.749" lon="-119.053"><datetime>2014-01-27T20:50:00UTC</datetime><winddir uom="degT">240</winddir><windspeed uom="kt">1.9</windspeed><windgust uom="kt">3.9</windgust><waveht uom="ft">5.9</waveht><domperiod uom="sec">15</domperiod><avgperiod uom="sec">10.1</avgperiod><meanwavedir uom="degT">266</meanwavedir><pressure uom="in" tendency="falling">30.06</pressure><airtemp uom="F">60.1</airtemp><watertemp uom="F">61.3</watertemp><dewpoint uom="F">53.8</dewpoint></observation>';


            var getWeather = function(buoyID) {
                $http.get('/proxies/buoys/?station=' + buoyID)
                .success(function(data) { 
                    var xml = data,
                        xmlDoc = $.parseXML(xml),
                        $xml = $(xmlDoc);
                    scope.buoyName = $xml.find("observation").attr("name");
                    scope.waterTemp = $xml.find("watertemp").text() || 'not reported';
                    scope.waterTempUOM = $xml.find("watertemp").attr("uom");
                    scope.windSpeed = $xml.find("windspeed").text() || 'not reported';
                    scope.windSpeedUOM = $xml.find("windspeed").attr("uom");
                })
                .error(function(data) {
                    debugger;
                });
                
            };

            var getClosestBuoy = function() {
                var location = getLocation();
                var buoyDistances = getBuoyDistances(location);
                var sortedBuoyDistances = buoyDistances.sort(function(a, b) {
                    return a.distance - b.distance;
                });
                return sortedBuoyDistances[0].id;
            };

            var getLocation = function() {
                // var location = scope.$parent.$parent.getAnswer('map-set-location');
                var location = {lat: 33.5, lon: -119};
                return location;
            };                    

            var getBuoyDistances = function(location) {
                var buoyDistances = [];
                _.each(buoyLocations, function(buoy) {
                    buoyDistances.push( { id: buoy.id, distance: getDistanceFromLatLonInKm(location.lat, location.lon, buoy.coords.lat, buoy.coords.lon) } );
                });
                return buoyDistances;
            };

            var getDistanceFromLatLonInKm = function(lat1,lon1,lat2,lon2) {
                var R = 6371; // Radius of the earth in km
                var dLat = deg2rad(lat2-lat1);  // deg2rad below
                var dLon = deg2rad(lon2-lon1); 
                var a = 
                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2); 
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                var d = R * c; // Distance in km
                return d;
            };

            var deg2rad = function(deg) {
                return deg * (Math.PI/180)
            };

            scope.closestBuoy = getClosestBuoy();
            scope.weather = getWeather(scope.closestBuoy);
            
        }
    }
});