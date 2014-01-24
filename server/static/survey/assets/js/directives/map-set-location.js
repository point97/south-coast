angular.module('askApp')
    .directive('mapSetLocation', function($http) {
        return {
            // template: '<div class="map" style="height: 400px"></div>',
            templateUrl: 'views/mapSetLocation.html',
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                question: "=question" //scope.question.geojson, scope.question.zoom, etc
            },
            link: function(scope, element) {
                if (scope.question.answer) {

                    //debugger;
                } else {
                    scope.question.answer = [];
                }
                var $el = element[0];

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
                var initPoint = new L.LatLng(18.35, -64.85);
                if (scope.question.lat && scope.question.lng) {
                    initPoint = new L.LatLng(scope.question.lat, scope.question.lng);
                }
                var initialZoom = 11;
                if (scope.question.zoom) {
                    initialZoom = scope.question.zoom;
                }
                var map = new L.Map($el, {
                    inertia: false
                }).addLayer(bing).setView(initPoint, initialZoom);

                map.attributionControl.setPrefix('');
                map.zoomControl.options.position = 'bottomleft';

                // Layer picker init
                var baseMaps = { "Satellite": bing, "Nautical Charts": nautical };
                var options = { position: 'topright' };
                L.control.layers(baseMaps, null, options).addTo(map);

                var marker = L.marker();
                map.on('click', function(e) {
                    map.removeLayer(marker);
                    marker = new L.marker(e.latlng, {draggable: 'true'});
                    marker.addTo(map);
                    marker.on('dragend', function(event) {
                        // var marker = event.target;
                        var position = event.target.getLatLng();
                        alert('Latitude: ' + ConvertDDToDMS(position.lat) + '\n' + 'Longitude: ' + ConvertDDToDMS(position.lng));
                        // marker.setLatLng([position],{draggable:'true'}).bindPopup(position).update();
                    });
                });
                var ConvertDDToDMS = function(dd) {
                    var deg = dd | 0; // truncate dd to get degrees
                    var frac = Math.abs(dd - deg); // get fractional part
                    var min = (frac * 60) | 0; // multiply fraction by 60 and truncate
                    var sec = ((((frac * 3600 - min * 60) * 1000) | 0) / 1000);
                    return deg + " degrees " + min + " minutes " + sec + " seconds";
                }

            }
        }
    });