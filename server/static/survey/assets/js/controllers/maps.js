//'use strict';


angular.module('askApp')
    .controller('MapsCtrl', function($scope, $routeParams, $http, $location, $interpolate, $timeout) {
        var $el = "maps-page";
        $scope.title = "Maps";
        $scope.markers = [];

        if (app.user) {
            $scope.user = app.user;
        } else {
            $scope.user = false;
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

        $http.get("/static/survey/assets/data/MPA_CA_Simplified_0001.json").success(function(data) {
            var mpas = L.geoJson(data, { 
                style: function(feature) {
                    return {
                        "color": "#E6D845",
                        "weight": 1,
                        "opacity": 0.6,
                        "fillOpacity": 0.2
                    };
                }
            });
            layerControl.addOverlay(mpas, "MPAs");
        });

        // Map init
        var initPoint = new L.LatLng(33, -119);
        var initialZoom = 7;
        
        var map = new L.Map($el, {
            inertia: false
        }).addLayer(bing).setView(initPoint, initialZoom);

        map.attributionControl.setPrefix('');
        map.zoomControl.options.position = 'bottomleft';

        // Layer picker init
        var baseMaps = { "Satellite": bing, "Nautical Charts": nautical };
        var options = { position: 'topright' };
        // L.control.layers(baseMaps, null, options).addTo(map);
        var layerControl = L.control.layers(baseMaps, null, options);
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
        

        /**
         * @return {string} Returns the color to be applied to the next marker.
         */
        // $scope.getNextColor = function() {
        //     var availableColors = [],
        //         colorPalette = [
        //                 'red',
        //                 'orange',
        //                 'green',
        //                 'darkgreen',
        //                 'darkred',
        //                 'blue',
        //                 'darkblue',
        //                 'purple',
        //                 'darkpurple',
        //                 'cadetblue'
        //         ];

        //     availableColors = angular.copy(colorPalette);
        //     _.each($scope.locations, function(marker) {
        //         if (_.has(marker, 'color')) {
        //             availableColors = _.without(availableColors, marker.color);
        //         }
        //         if (availableColors.length == 0) {
        //             // Recyle the colors if we run out.
        //             availableColors = angular.copy(colorPalette);
        //         }
        //     });
        //     return _.first(availableColors);
        // };

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
                debugger;
            }) 
        };

        $scope.getSubmittedTrips = function() {
            $scope.getSubmittedTripsFromServer()
                .success(function (data) {
                    // $scope.updateEnabled = false;
                    $scope.trips = data.objects;
                    $scope.respondentList = [];
                    _.each($scope.trips, function(trip, index) {
                        // var color = $scope.availableColors[index % 10];
                        _.each(trip.respondants, function(respondent, index) {
                            $scope.respondentList.push(respondent);
                            var event = respondent.type.charAt(0).toUpperCase() + respondent.type.slice(1),
                                date_obj = new Date(respondent.date),
                                date = (date_obj.getUTCMonth()+1) +"/"+ date_obj.getUTCDate() + "/" + date_obj.getUTCFullYear(),
                                popupContent = event + ' -- ' + date,
                                popuplink = app.viewPath + '#/tripSummary/maps/' + trip.uuid,
                                popupContentWithLink = '<a href="' + popuplink + '">' + popupContent + '</a>',
                                color = $scope.availableColors[date_obj.getUTCDate() % 10],
                                marker = new L.marker(respondent.location, {icon: L.AwesomeMarkers.icon({icon: 'anchor', color: color}) });
                            marker.bindPopup(popupContentWithLink);
                            // marker.options.color = color;
                            marker.addTo(map);
                            $scope.markers.push(marker);
                        });
                    });
                    $scope.submittedSpinner = false;
                    // console.log($scope.respondentList);
                }).error(function (data) {
                    $scope.error = true;
                    // $location.path('/signin?error=not-logged-in');
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