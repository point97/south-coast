
angular.module('askApp')
    .directive('buoyWeather', function($http, survey) {
    _survey = survey;
    return {
        templateUrl: 'views/buoyWeather.html',
        restrict: 'EA',
        replace: true,
        transclude: true,
        scope: {
            question: "=question" //scope.question.geojson, scope.question.zoom, etc
        },
        link: function (scope, element, attrs) {

            // offshore buoy locations in So Cal
            var buoyLocations = [   {id: 46011, coords: {lat: 35.000, lng: -120.992}},
                                    {id: 46025, coords: {lat: 33.749, lng: -119.053}},
                                    {id: 46028, coords: {lat: 35.741, lng: -121.884}},
                                    {id: 46054, coords: {lat: 34.265, lng: -120.477}},
                                    {id: 46069, coords: {lat: 33.670, lng: -120.200}},
                                    {id: 46086, coords: {lat: 32.491, lng: -118.034}},
                                    {id: 46215, coords: {lat: 35.204, lng: -120.859}},
                                    {id: 46216, coords: {lat: 34.333, lng: -119.803}},
                                    {id: 46217, coords: {lat: 34.167, lng: -119.435}},
                                    {id: 46218, coords: {lat: 34.458, lng: -120.782}},
                                    {id: 46219, coords: {lat: 33.221, lng: -119.881}},
                                    {id: 46221, coords: {lat: 33.854, lng: -118.633}},
                                    {id: 46222, coords: {lat: 33.618, lng: -118.317}},
                                    {id: 46223, coords: {lat: 33.459, lng: -117.767}},
                                    {id: 46224, coords: {lat: 33.179, lng: -117.471}},
                                    {id: 46225, coords: {lat: 32.930, lng: -117.392}},
                                    {id: 46231, coords: {lat: 32.747, lng: -117.370}},
                                    {id: 46232, coords: {lat: 32.530, lng: -117.431}},
                                    {id: 46242, coords: {lat: 33.220, lng: -117.439}},
                                    {id: 46251, coords: {lat: 33.762, lng: -119.552}}
            ];  
            //var weatherXML = '  <observation id="46025" name="Santa Monica Basin - 33NM WSW of Santa Monica, CA" lat="33.749" lon="-119.053"><datetime>2014-01-27T20:50:00UTC</datetime><winddir uom="degT">240</winddir><windspeed uom="kt">1.9</windspeed><windgust uom="kt">3.9</windgust><waveht uom="ft">5.9</waveht><domperiod uom="sec">15</domperiod><avgperiod uom="sec">10.1</avgperiod><meanwavedir uom="degT">266</meanwavedir><pressure uom="in" tendency="falling">30.06</pressure><airtemp uom="F">60.1</airtemp><watertemp uom="F">61.3</watertemp><dewpoint uom="F">53.8</dewpoint></observation>';


            var getWeather = function(buoyID) {
                $http.get(app.server + '/proxies/buoys/?station=' + buoyID)
                .success(function(data) { 
                    var xml = data,
                        xmlDoc = $.parseXML(xml),
                        $xml = $(xmlDoc);
                    scope.weather.buoyName = $xml.find("observation").attr("name");
                    scope.weather.buoyLat = $xml.find("observation").attr("lat");
                    scope.weather.buoyLon = $xml.find("observation").attr("lon");
                    var datestring = $xml.find("datetime").text(),
                        datetime = datestring.replace('UTC',''),
                        dateobj = new Date(datetime);
                        // offset = dateobj.getTimezoneOffset() / 60;
                        // dateobj.setHours(dateobj.getHours()-offset);
                    scope.weather.datetime = dateobj;
                    scope.weather.windDirection = $xml.find("winddir").text();
                    scope.weather.windDirectionUOM = $xml.find("winddir").attr("uom");
                    scope.weather.windSpeed = $xml.find("windspeed").text();
                    scope.weather.windSpeedUOM = $xml.find("windspeed").attr("uom");
                    scope.weather.windGust = $xml.find("windgust").text();
                    scope.weather.windGustUOM = $xml.find("windgust").attr("uom");
                    scope.weather.waveHeight = $xml.find("waveht").text();
                    scope.weather.waveHeightUOM = $xml.find("waveht").attr("uom");
                    scope.weather.domPeriod = $xml.find("domperiod").text();
                    scope.weather.domPeriodUOM = $xml.find("domperiod").attr("uom");
                    scope.weather.avgPeriod = $xml.find("avgperiod").text();
                    scope.avgPeriodUOM = $xml.find("avgperiod").attr("uom");
                    scope.weather.meanWaveDirection = $xml.find("meanwavedir").text();
                    scope.weather.meanWaveDirectionUOM = $xml.find("meanwavedir").attr("uom");
                    scope.weather.pressure = $xml.find("pressure").text();
                    scope.weather.pressureUOM = $xml.find("pressure").attr("uom");
                    scope.weather.pressureTendency = $xml.find("pressure").attr("tendency");
                    scope.weather.airTemp = $xml.find("airtemp").text();
                    scope.weather.airTempUOM = $xml.find("airtemp").attr("uom");
                    scope.weather.waterTemp = $xml.find("watertemp").text();
                    scope.weather.waterTempUOM = $xml.find("watertemp").attr("uom");

                    scope.question.answer = scope.weather;
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
                var mapLocation = survey.getAnswer('map-set-location');

                if (mapLocation.lat && mapLocation.lng) {
                    return {lat: mapLocation.lat, lng: mapLocation.lng};
                } else {
                    return {lat: 33.5, lng: -119};
                }
            };                    

            var getBuoyDistances = function(location) {
                var buoyDistances = [];
                _.each(buoyLocations, function(buoy) {
                    buoyDistances.push( { id: buoy.id, distance: getDistanceFromLatLngInKm(location.lat, location.lng, buoy.coords.lat, buoy.coords.lng) } );
                });
                return buoyDistances;
            };

            var getDistanceFromLatLngInKm = function(lat1,lng1,lat2,lng2) {
                var R = 6371; // Radius of the earth in km
                var dLat = deg2rad(lat2-lat1);  // deg2rad below
                var dLng = deg2rad(lng2-lng1); 
                var a = 
                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
                    Math.sin(dLng/2) * Math.sin(dLng/2); 
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                var d = R * c; // Distance in km
                return d;
            };

            var deg2rad = function(deg) {
                return deg * (Math.PI/180)
            };

            scope.weather = {};
            scope.weather.closestBuoy = getClosestBuoy();
            if (scope.question.answer && scope.question.answer.length && (scope.question.answer[0].closestBuoy === scope.weather.closestBuoy)) {
                scope.weather = scope.question.answer[0];
            } else {
                getWeather(scope.weather.closestBuoy);
            }
            
        }
    }
});