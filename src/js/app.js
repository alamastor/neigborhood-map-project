function initMap() {
    'use strict';
    // Create a map object and specify the DOM element for display.
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -37.8647, lng: 144.9696},
        scrollwheel: true,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.HYBRID
    });
    // TODO: handle map fail
    map.setTilt(45);

    var home = new google.maps.LatLng(-37.8, 144.9);
    var request = {
        location: home,
        radius: 50000,
        type: 'store'
    };

    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, gotPlaces)

    function gotPlaces(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }
        } else {
            // TODO: handle request fail
        }
    }

    function createMarker(place)
    {
        var marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
        });
        var infowindow = new google.maps.InfoWindow({
                content: marker.title
            })
        marker.addListener('click', function() {
            infowindow.open(map, marker);
        });
    }
}

onload = initMap;

