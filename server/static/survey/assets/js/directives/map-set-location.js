angular.module('askApp')
    .directive('mapSetLocation', function($http, $timeout, storage, loggingService) {
        return {
            // template: '<div style="height: 100%; width: 100%; position: fixed; margin-left: -50px; margin-top: -60px"><div class="map"></div><div style="position: absolute;"><div>Lat</div><div>lng</div><input type="text"/></div></div>',
            templateUrl: 'views/mapSetLocation.html',
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                question: "=question" 
            },
            link: function(scope, element) {
                if (scope.question.answer) {
                    //debugger;
                } else {
                    scope.question.answer = {};
                }

                var previousPoints = [];
                // acquire any points from previous events on this trip
                if (app.currentTrip && app.currentTrip.events) {
                    _.each(app.currentTrip.events, function(value, key) {
                        _.each(value.respondents, function(respondent) {
                            if (!app.currentRespondent || (app.currentRespondent.uuid !== respondent.uuid)) {
                                var previousPoint = _.findWhere(respondent.responses, { 'question': 'map-set-location'}).answer;
                                previousPoints.push(previousPoint);
                            }
                        });
                    });
                }

                if (!app.mapQuestion) {
                    app.mapQuestion = {};
                }
                var previousState = undefined;
                
                if (app && app.mapQuestion && app.mapQuestion.previousState) {
                    loggingService.log(app.mapQuestion.previousState); 
                } else {
                    loggingService.log("no previous state in map Question")
                }

                if (app.mapQuestion.previousState) {
                    previousState = {
                        'zoom': app.mapQuestion.previousState.zoom,
                        'center': app.mapQuestion.previousState.center,
                        'basemap': app.mapQuestion.previousState.basemap,
                        'overlays': app.mapQuestion.previousState.overlays
                    };
                }
                var $el = "set-location-map";

                // Layer init
                var nautical = L.tileLayer.wms("http://egisws02.nos.noaa.gov/ArcGIS/services/RNC/NOAA_RNC/ImageServer/WMSServer", {
                    format: 'img/png',
                    transparent: true,
                    layers: null,
                    attribution: "NOAA Nautical Charts"
                });

                var esriOcean = L.esri.basemapLayer("Oceans");

                var bing = new L.BingLayer("Av8HukehDaAvlflJLwOefJIyuZsNEtjCOnUB_NtSTCwKYfxzEMrxlKfL1IN7kAJF", {
                    type: "AerialWithLabels"
                });

                $http.get("assets/data/MPA_CA_Simplified_0001.json").success(function(data) {
                    var mpas = L.geoJson(data, { 
                        style: function(feature) {
                            return {
                                // "color": "#E6D845",
                                "color": "#005AE7",
                                "weight": 1,
                                "opacity": 0.6,
                                "fillOpacity": 0.2
                            };
                        }
                    });
                    layerControl.addOverlay(mpas, "MPAs");
                    
                    if (previousState && previousState.overlays.length) {
                        if (_.indexOf(previousState.overlays, "MPAs") !== -1) {
                            map.addLayer(mpas);
                            // some trickery to force activeOverlayLayers to recognize the adding of this layer
                            // would have been handled automatically had the add taking place via the layer switcher control...
                            // layerControl._activeOverlayLayers = {
                            //     1098: {
                            //         layer: mpas,
                            //         name: "MPAs",
                            //         overlay: true
                            //     }
                            // }
                        }
                    }
                });

                // Map init
                var initialPoint = new L.LatLng(45.52847, -122.68067);
                if (scope.question.lat && scope.question.lng) {
                    initialPoint = new L.LatLng(scope.question.lat, scope.question.lng);
                }
                var initialZoom = 11;
                if (scope.question.zoom) {
                    initialZoom = scope.question.zoom;
                }
                var initialBasemap = esriOcean;

                // Layer picker init
                var baseMaps = { "ESRI Ocean": esriOcean, "Satellite": bing, "Nautical Charts": nautical }; // "Satellite": bing, 
                var options = { position: 'topright' };

                // inits from previously saved state
                if (previousState) {
                    initialPoint = previousState.center;
                    initialZoom = previousState.zoom;
                    initialBasemap = baseMaps[previousState.basemap];
                }

                var map = new L.Map($el, {
                    inertia: false,
                    maxZoom: 13, 
                }).addLayer(initialBasemap).setView(initialPoint, initialZoom);

                map.attributionControl.setPrefix('');
                map.zoomControl.options.position = 'bottomleft';

                var layerControl = L.control.activeLayers(baseMaps, null, options);
                layerControl.addTo(map);

                map.on("blur", function(e) {
                    scope.updateMapState();
                });

                scope.updateMapState = function() {
                    // adding timeout in hopes of catching the basemap switch
                    $timeout(function() {
                            app.mapQuestion.previousState = { 
                            "center": map.getCenter(),
                            "zoom": map.getZoom(),
                            "basemap": layerControl.getActiveBaseLayer().name,
                            "overlays": _.pluck(layerControl.getActiveOverlayLayers(), 'name'),
                        };
                        console.log(app.mapQuestion.previousState);
                        storage.saveState(app);
                    }, 100);
                };
        
                var availableColors = [
                    'red',
                    'orange',
                    'green',
                    'darkgreen',
                    'darkred',
                    'blue',
                    'darkblue',
                    'purple',
                    'darkpurple',
                    'cadetblue'
                ];

                var color = 'orange';
                // if (app.currentRespondent && app.currentRespondent.date) {
                // if (app.currentTrip && app.currentTrip.uuid) {
                //     // var date_obj = new Date(app.currentRespondent.date);
                //     // var color = availableColors[date_obj.getUTCDate() % 10];
                //     var color = availableColors[app.currentTrip.uuid % 10];
                // } 

                _.each(previousPoints, function(point) {
                    L.marker(point, {icon: L.AwesomeMarkers.icon({icon: 'anchor', color: 'blue'})}).addTo(map);
                });
                    
                var marker = L.marker();
                map.on('click', function(e) {
                    repositionMarker(e.latlng);                                     
                    //alert('Latitude: ' + ConvertDDToDMS(position.lat) + '\n' + 'lnggitude: ' + ConvertDDToDMS(position.lng));
                    // marker.setLatLng([position],{draggable:'true'}).bindPopup(position).update();
                });
                var repositionMarker = function (latlng) {
                    map.removeLayer(marker);

                    marker = new L.marker(latlng, {icon: L.AwesomeMarkers.icon({icon: 'anchor', color: color}), draggable: 'true'});
                    
                    // marker = new L.marker(latlng, {draggable: 'true'});
                    marker.addTo(map);
                    setPositionFields(latlng);
                    marker.on('dragend', function(event) {
                        setPositionFields(event.target.getLatLng());
                    });
                };

                var setPositionFields = function(latlng) {
                    var convertedLat = convertToDMS(latlng.lat);
                    var convertedLng = convertToDMS(latlng.lng);
                    // scope.$apply(function () {
                    $timeout(function() {
                        scope.question.latDegrees = convertedLat[0];
                        scope.question.latMinutes = convertedLat[1];
                        scope.question.latSeconds = convertedLat[2];
                        scope.question.lngDegrees = convertedLng[0];
                        scope.question.lngMinutes = convertedLng[1];
                        scope.question.lngSeconds = convertedLng[2];
                        scope.question.answer = latlng;
                    });
                }
                
                var convertToDMS = function(position) {
                    var deg = position | 0; // truncate dd to get degrees
                    var frac = Math.abs(position - deg); // get fractional part
                    var min = (frac * 60) | 0; // multiply fraction by 60 and truncate
                    var sec = ((((frac * 3600 - min * 60) * 1000) | 0) / 1000);
                    return [deg, min, sec];

                    //return deg + " degrees " + min + " minutes " + sec + " seconds";
                }
                var convertToLatLng = function(latdeg, latmin, latsec, lngdeg, lngmin, lngsec) {
                    var lat = Math.abs(parseFloat(latdeg)) + (((parseFloat(latmin) * 60)+parseFloat(latsec)) / 3600);
                    var lng = Math.abs(parseFloat(lngdeg)) + (((parseFloat(lngmin) * 60)+parseFloat(lngsec)) / 3600);
                    if (latdeg < 0) {
                        lat = -lat;
                    } 
                    if (lngdeg < 0) {
                        lng = -lng;
                    }
                    return {lat: lat, lng: lng};
                };

                /*** GeoLocating ***/

                function foundLocation(position) {
                    var lat = position.coords.latitude,
                        lng = position.coords.longitude,
                        latlng = L.latLng(lat, lng);

                    repositionMarker(latlng); 

                    console.log('Found location: ' + lat + ', ' + lng);
                }
                function noLocation() {
                    // alert('Could not find location');
                    console.log('position not found');
                }
                /*** End GeoLocating ***/

                scope.$watch('[question.latDegrees,question.latMinutes,question.latSeconds,question.lngDegrees,question.lngMinutes,question.lngSeconds]', function(values, oldValues) {
                    if (values !== oldValues) {                      
                        var numValues = _.map(values, function(num) { return parseFloat(num); });
                        var nonNumbers = _.filter(numValues, function(num) { return _.isNaN(num); });
                        if ( nonNumbers.length ) {
                            map.removeLayer(marker);
                            scope.question.answer = {};
                        } else {
                            var latlng = convertToLatLng(scope.question.latDegrees, scope.question.latMinutes, scope.question.latSeconds, scope.question.lngDegrees, scope.question.lngMinutes, scope.question.lngSeconds);
                            if ( Math.abs(latlng.lat - marker._latlng.lat) > .0001 || Math.abs(latlng.lng - marker._latlng.lng) > .0001) {
                                repositionMarker(latlng);
                            }
                        }     
                    }               
                }, true);

                if (scope.question.answer && !_.isEmpty(scope.question.answer)) {
                    repositionMarker(scope.question.answer);
                } else {
                    navigator.geolocation.getCurrentPosition(foundLocation, noLocation);
                }

            }
        }
    });