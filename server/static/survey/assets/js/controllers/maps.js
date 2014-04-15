//'use strict';


angular.module('askApp')
    .controller('MapsCtrl', function($scope, $routeParams, $http, $location, $interpolate, $timeout, storage) {
        var $el = "maps-page";
        $scope.title = "Maps";
        $scope.markers = [];

        if (app.user) {
            $scope.user = app.user;
        } else {
            $scope.user = false;
        }
        if (!app.maps) {
            app.maps = {};
        }
        if (app.maps.previousState) {
            $scope.previousState = {
                'zoom': app.maps.previousState.zoom,
                'center': app.maps.previousState.center,
                'basemap': app.maps.previousState.basemap,
                'overlays': app.maps.previousState.overlays
            };
        }

        // Layer init
        var nautical = L.tileLayer.wms("http://egisws02.nos.noaa.gov/ArcGIS/services/RNC/NOAA_RNC/ImageServer/WMSServer", {
            format: 'img/png',
            transparent: true,
            layers: null,
            attribution: "NOAA Nautical Charts"
        });

        var bing = new L.BingLayer("Av8HukehDaAvlflJLwOefJIyuZsNEtjCOnUB_NtSTCwKYfxzEMrxlKfL1IN7kAJF", {
            type: "AerialWithLabels"
        });

        var esriOcean = L.esri.basemapLayer("Oceans");

        var mpas = L.geoJson();

        $http.get("assets/data/MPA_CA_Simplified_0001.json").success(function(data) {
            layerControl.removeLayer(mpas);
            mpas = L.geoJson(data, { 
                style: function(feature) {
                    return {
                        "color": "#005AE7",
                        "weight": 1,
                        "opacity": 0.6,
                        "fillOpacity": 0.2
                    };
                }
            });
            layerControl.addOverlay(mpas, "MPAs");
            // mpas.addTo(map);

            if ($scope.previousState && $scope.previousState.overlays.length) {
                if (_.indexOf($scope.previousState.overlays, "MPAs") !== -1) {
                    map.addLayer(mpas);
                    // some trickery to force activeOverlayLayers to recognize the adding of this layer
                    // would have been handled automatically had the add taking place via the layer switcher control...
                    // unfortunately we would also need to remove this layer from activeOverlayLayers whenever the layer is deactivated...
                    // bailing on this for now...
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
        var initialPoint = new L.LatLng(33, -119);
        var initialZoom = 7;
        var initialBasemap = esriOcean;

        // Layer picker init
        var baseMaps = { "ESRI Ocean": esriOcean, "Satellite": bing, "Nautical Charts": nautical };        
        var overlays = { "MPAs": mpas };
        var options = { position: 'topright' };

        // inits from previously saved state
        if ($scope.previousState) {
            initialPoint = $scope.previousState.center;
            initialZoom = $scope.previousState.zoom;
            initialBasemap = baseMaps[$scope.previousState.basemap];
        }
        
        var map = new L.Map($el, {
            inertia: false,
            maxZoom: 13, 
        }).addLayer(initialBasemap).setView(initialPoint, initialZoom);

        map.attributionControl.setPrefix('');
        map.zoomControl.options.position = 'bottomleft';

        map.on("blur", function(e) {
            $scope.updateMapState();
        });

        $scope.updateMapState = function() {
            // adding timeout in hopes of catching the basemap switch
            $timeout(function() {
                    app.maps.previousState = { 
                    "center": map.getCenter(),
                    "zoom": map.getZoom(),
                    "basemap": layerControl.getActiveBaseLayer().name,
                    "overlays": _.pluck(layerControl.getActiveOverlayLayers(), 'name'),
                };
                storage.saveState(app);
            }, 100);
        };
        
        // L.control.layers(baseMaps, null, options).addTo(map);
        var layerControl = L.control.activeLayers(baseMaps, overlays, options);
        layerControl.addTo(map);


        $scope.availableColors = [
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

        $scope.getSubmittedTripsFromServer = function() {
            var url = app.server 
                      + '/api/v1/tripreport/?user__username__exact=' 
                      + $scope.user.username 
                      + '&limit=0'
                      + '&format=json';
            
            if ($scope.tripFilter.start) {
                url += '&start_date__gte=' + $scope.tripFilter.start; 
            }
            if ($scope.tripFilter.end) {
                url += '&start_date__lte=' + new Date($scope.tripFilter.end).add(2).days().toString('yyyy-MM-dd');
            }

            return $http.get(url).error(function (err) {
                console.log(JSON.stringify(err));
                // debugger;
                console.log('ERROR: ' + err);
                TraceKit.report({message: 'ERROR: ' + err});
            }) 
        };

        $scope.getSubmittedTrips = function() {
            $scope.getSubmittedTripsFromServer()
                .success(function (data) {
                    $scope.addTripsToMap(data.objects);
                    $scope.submittedSpinner = false;
                    // console.log($scope.respondentList);
                    // TraceKit.report({message: 'SUCCESS: ' + data});
                }).error(function (data) {
                    $scope.error = true;
                    TraceKit.report({message: 'ERROR: ' + data});
                    // $location.path('/signin?error=not-logged-in');
                }); 
        };

        $scope.addTripsToMap = function(trips) {
            $scope.trips = trips;
            // $scope.respondentList = [];
            _.each($scope.trips, function(trip, index) {
                _.each(trip.respondants, function(respondent, index) {
                    // $scope.respondentList.push(respondent);
                    var event = respondent.type.charAt(0).toUpperCase() + respondent.type.slice(1),
                        date_obj = new Date(respondent.date),
                        date = (date_obj.getUTCMonth()+1) +"/"+ date_obj.getUTCDate() + "/" + date_obj.getUTCFullYear(),
                        popupContent = event + ' -- ' + date,
                        popuplink = app.viewPath + '#/tripSummary/maps/' + trip.uuid,
                        popupContentWithLink = '<a href="' + popuplink + '">' + popupContent + '</a>',
                        color = $scope.availableColors[trip.uuid % 10],
                        marker = new L.marker(respondent.location, {icon: L.AwesomeMarkers.icon({icon: 'anchor', color: color}) });
                    marker.bindPopup(popupContentWithLink);
                    // marker.options.color = color;
                    marker.addTo(map);
                    $scope.markers.push(marker);
                });
            });
        };

        $scope.updateTripList = function() {
            _.each($scope.markers, function(marker) {
                map.removeLayer(marker);    
            });
            $scope.markers = [];
            $scope.getSubmittedTrips();
        }

        $scope.submittedSpinner = true;

        if (app.maps && app.maps.tripFilter && (app.maps.tripFilter.start || app.maps.tripFilter.end)) {
            $scope.tripFilter = app.maps.tripFilter;
        } else {
            var date = new Date(),
            firstDayOfCurrentMonth = new Date(date.getFullYear(), date.getMonth(), 1),
            today = date.toString('yyyy-MM-dd'),
            start_date = firstDayOfCurrentMonth.toString('yyyy-MM-dd'),
            end_date = today;

        $scope.tripFilter = {start: start_date, end: end_date};
        }
        

        $scope.$watch('tripFilter', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                // $scope.getSubmittedSurveysList(newValue);
                // $scope.updateEnabled = true;
                if (!app.maps) {
                    app.maps = {};
                }
                app.maps.tripFilter = newValue;
            }
        }, true);


        $scope.getSubmittedTrips($scope.tripFilter);


});