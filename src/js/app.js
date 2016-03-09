$(function() {
    'use strict';
    // Create a map object and specify the DOM element for display.
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -37.8647, lng: 144.9696},
        scrollwheel: true,
        zoom: 14,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
    });
    // TODO: handle map fail

    function ViewModel() {
        var self = this;
        self.places = ko.observableArray();

        // Set suburbFilter to display only result from that suburb
        self.suburbFilter = ko.observable('');
        self.setSuburbFilter = function(data, event) {
            self.suburbFilter(data);
        };

        self.filteredPlaces = ko.computed(function() {
            var filtered = [];
            var uniqueSuburbs = new Set();
            self.places().forEach(function(place) {
                if (self.suburbFilter() == '' || place.suburb == self.suburbFilter()) {
                    filtered.push(place);
                }
            });
            return filtered;
        });
        // Hide markers which aren't in selected suburb
        self.suburbFilter.subscribe(function(suburbFilter) {
            self.places().forEach(function(place) {
                if (place.suburb == suburbFilter) {
                    place.marker.setMap(map);
                } else {
                    place.marker.setMap(null);
                }
            });
        });

        self.uniqueSuburbs = ko.computed(function() {
            var suburbSet = new Set();
            self.places().forEach(function(place) {
                suburbSet.add(place.suburb);
            });
            return Array.from(suburbSet).sort();
        });

    }
    var viewModel = new ViewModel();
    ko.applyBindings(viewModel);


    function createMarker(place)
    {
        // Make marker a property of place,
        // so it can be easily updated based on
        // the properties of the place
        place.marker = new Marker({
            position: place.geometry.location,
            map: map,
            icon: {
                path: MAP_PIN,
                fillColor: '#00CCBB',
                fillOpacity: 0.5,
                strokeColor: '',
                strokeWeight: 0
            },
            map_icon_label: '<span class="map-icon map-icon-bicycle-store"></span>',
        });
        var infowindow = new google.maps.InfoWindow({
                content: 'XXX',
            })
        place.marker.addListener('click', function() {
            infowindow.open(map, place.marker);
        });
    }

    /**
     * API requests
     */

    // Google places
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch({
        location: new google.maps.LatLng(-37.867556, 144.980302),
        radius: 3000,
        type: 'bicycle_store',
    }, gotPlaces);

    function gotPlaces(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            console.log(results);
            for (var i = 0; i < results.length; i++) {
                results[i].suburb = results[i].vicinity.split(',')[1].trim()
                createMarker(results[i]);
                viewModel.places.push(results[i]);
            }
            viewModel.places.sort(function(a, b) {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            });
        } else {
            // TODO: handle request fail
        }
    }

    // Foursquare search
    var request = $.ajax('https://api.foursquare.com/v2/venues/search', {
        dataType: 'json',
        data: {
            client_id: fourSquareTokens.clientId,
            client_secret: fourSquareTokens.clientSecret,
            ll: '-37.8647,144.9696',
            query: 'bicycle',
            v: 20160310,
        },
    });
    request.done(function(msg) {
        console.log('done');
        console.log(msg);
    });
    request.fail(function(jqXHR, textStatus) {
        console.log('failed');
        console.log(jqXHR);
        console.log(textStatus);
    });


    // Yelp API

    // OAuth functions courtesy of MarkN from Udacity forums
    // https://discussions.udacity.com/t/how-to-make-ajax-request-to-yelp-api/13699/5
    // and Marco Bettiolo's Javascript OAuth Signature Generator
    // https://github.com/bettiolo/oauth-signature-js

    /**
     ** Generates a random number and returns it as a string for OAuthentication
     ** @return {string}
     **/
    function nonce_generate() {
        return (Math.floor(Math.random() * 1e12).toString());
    }

    var yelp_url = 'https://api.yelp.com/v2/search';

    var parameters = {
        oauth_consumer_key: yelpTokens.consumerKey,
        oauth_token: yelpTokens.token,
        oauth_nonce: nonce_generate(),
        oauth_timestamp: Math.floor(Date.now()/1000),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version : '1.0',
        term: 'bicycle_store',
        cll: '-37.8647,144.9696',
        location: 'St Kilda',
        callback: 'cb'              // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
    };

    parameters.oauth_signature = oauthSignature.generate(
        'GET',
        yelp_url,
        parameters,
        yelpTokens.consumerSecret,
        yelpTokens.tokenSecret
    );

    // Send the API reqest
    var request = $.ajax({
        url: yelp_url,
        data: parameters,
        cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
        dataType: 'jsonp',
    });
    request.done(function(msg) {
        console.log(msg);
    });
    request.fail(function(jqXHR, textStatus) {
        console.log('failed');
        console.log(jqXHR);
        console.log(textStatus);
    });
    function cb(res) {
        console.log('GOT CBb');
    }

});

