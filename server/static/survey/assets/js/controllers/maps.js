//'use strict';


angular.module('askApp')
    .controller('MapsCtrl', function($scope, $routeParams, $http, $location, $interpolate, $timeout) {
        var $el = "maps-page";
        $scope.title = "Map View";

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

        // Map init
        var initPoint = new L.LatLng(33.5, -118),
            initialZoom = 8;
        
        var map = new L.Map($el, {
            inertia: false
        }).addLayer(bing).setView(initPoint, initialZoom);

        map.attributionControl.setPrefix('');
        map.zoomControl.options.position = 'bottomleft';

        // Layer picker init
        var baseMaps = { "Satellite": bing, "Nautical Charts": nautical };
        var options = { position: 'topright' };
        L.control.layers(baseMaps, null, options).addTo(map);

        // var marker = L.marker();
        map.on('click', function(e) {
            // repositionMarker(e.latlng);                                     
            //alert('Latitude: ' + ConvertDDToDMS(position.lat) + '\n' + 'lnggitude: ' + ConvertDDToDMS(position.lng));
            // marker.setLatLng([position],{draggable:'true'}).bindPopup(position).update();
        });
        // var repositionMarker = function (latlng) {
        //     console.log(latlng);
        //     map.removeLayer(marker);
        //     marker = new L.marker(latlng, {draggable: 'true'});
        //     marker.addTo(map);
        //     setPositionFields(latlng);
        //     marker.on('dragend', function(event) {
        //         setPositionFields(event.target.getLatLng());
        //     });
        // };


        $scope.submittedSpinner = true;
        $scope.getSubmittedSurveysListFromServer = function() {
            var url = app.server 
                      + '/api/v1/reportrespondant/?user__username__exact=' 
                      + $scope.user.username 
                      + '&limit=0'
                      + '&format=json';
            
            return $http.get(url).error(function (err) {
                console.log(JSON.stringify(err));
            });            
        };


        $scope.getSubmittedSurveysList = function() {
            $scope.getSubmittedSurveysListFromServer()
                .success(function (data) {
                    $scope.respondentList = [];
                    _.each(data.objects, function(respondent, index) {
                        $scope.respondentList.push(respondent);
                    });
                    $scope.submittedSpinner = false;
                    // console.log($scope.respondentList);
                }).error(function (data) {
                    $scope.error = true;
                    // $location.path('/signin?error=not-logged-in');
                }); 
        };

        $scope.getSubmittedSurveysList();  



});