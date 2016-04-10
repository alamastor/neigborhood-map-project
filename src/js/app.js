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

        // Array of all places found by ajax requests.
        // It is deferred, as it's a dependency of the whole app,
        // and it will be repeatedly pushed to when ajax requests return
        self.places = ko.observableArray().extend({deferred: true});

        // Subscribe to the places array to keep it sorted
        self.places.subscribe(function(places) {
            places.sort(function(a, b) {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            });
        });


        /**
         * Places filtering section
         */

        // This observable is set by, and can set the search box text.
        // It is used to generate the filteredPlaces array
        self.searchTextFilter = ko.observable('');

        // This observable is used to generate the filteredPlaces array
        self.suburbFilter = ko.observable('');

        // Function used by the view to set the suburb filter
        self.setSuburbFilter = function(data, event) {
            self.suburbFilter(data);
        };

        // Computed array of filtered places, for use in side bar and autocomplete.
        // This depends on two filters; suburbFilter and searchTextFilter
        self.filteredPlaces = ko.computed(function() {
            var filtered = [];
            // need to call dependancy here to make it register as a dependancy, as it's used by inner function
            self.searchTextFilter();
            self.places().forEach(function(place) {
                var suburbOK = self.suburbFilter() === '' || place.suburb == self.suburbFilter();
                var strLen = self.searchTextFilter().length;
                var searchTextOK = self.longName(place).slice(0, strLen).toLowerCase() == self.searchTextFilter().toLowerCase();
                if (suburbOK && searchTextOK) {
                    filtered.push(place);
                }
            });
            return filtered;
        });

        self.placeSelected = function(place) {
            // TODO: Do things with selected places here
            console.log('TODO: Search complete stuff');
            console.log(place);
        };

        /*
         * Search form section
         */
        self.searchSubmit = function() {
            if (self.autoCompHighlightItem()) {
                // On submit, if an autocomplte item is highlighted, then use it
                self.autoCompSelect(self.autoCompHighlightItem());
            } else if (self.filteredPlaces().length == 1) {
                // If there's only one place in the filter list, then accept it
                self.autoCompSelect(self.filteredPlaces()[0]);
            } else {
                // Not done selecting, do nothing
                return;
            }
            self.placeSelected(self.filteredPlaces[0]);
        };

        // Clear search text, called by view
        self.clearSearch = function() {
            self.searchTextFilter('');
        };


        /*
         * Search form autocomplete section
         */

        // Boolean observable, sets whether autocomplete menu is visible
        self.showAutoCompMenu = ko.observable(false);
        self.searchTextFilter.subscribe(function(searchTextFilter) {
            self.autoCompHighlightItem(null);
            if ((0 < self.filteredPlaces().length) && (self.filteredPlaces().length < 10)) {
                self.showAutoCompMenu(true);
            } else {
                self.showAutoCompMenu(false);
            }
        });

        // Call to accept the autocomple option, and set filtering based on it
        self.autoCompSelect = function(place) {
            self.searchTextFilter(self.longName(place));
            self.showAutoCompMenu(false);
        };

        // Observable which represents the place which is
        // currently highlighted in the autocomplete menu
        self.autoCompHighlightItem = ko.observable();

        // function for setting the autoCompleteHighlightItem,
        // used by the view
        self.setAutoCompHighlight = function(data, event) {
            console.log(data);
            self.autoCompHighlightItem(data);
        };

        // Up / down arrow key handling for navigating autocomplete menu
        // And enter handling for submit
        self.inputKeyPress = function(data, event) {
            switch (event.keyCode) {
                case 13:
                    // enter
                    self.searchSubmit();
                    break;
                case 38:
                    // up
                    self.moveAutoCompHighlight('up');
                    break;
                case 40:
                    // down
                    self.moveAutoCompHighlight('down');
                    break;
                default:
                    return true;
            }
        };

        self.moveAutoCompHighlight = function(dir) {
            // If the menu is not currently visible then just return function
            if (!self.showAutoCompMenu()) {
                return true;
            }

            var itemIndex;
            if (self.autoCompHighlightItem()) {
                itemIndex = self.filteredPlaces().indexOf(self.autoCompHighlightItem());
            } else {
                itemIndex = -1;
            }

            if (dir == 'up') {
                itemIndex--;
            } else if (dir == 'down') {
                itemIndex++;
            } else {
                console.log('!! got unexpected input to moveAutoCompHighlight');
            }

            // This allows wrapping from top of list from bottom to top,
            // ideally would just use mod but js does not
            // have proper mod. This also handles the case where allows
            // handling of the case where there was no previous
            // highlighted item, as in that case the index will now be -2.
            if (itemIndex < 0) {
                itemIndex = self.filteredPlaces().length - 1;
            } else if (itemIndex >= self.filteredPlaces().length) {
                itemIndex = 0;
            }

            self.autoCompHighlightItem(self.filteredPlaces()[itemIndex]);
            return true;
        };

        /*
         * Misc
         */

        self.selectPlace = function(place) {
            console.log(place);
            place.infoWindow.open(map, place.marker);
        };

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

        // Populates the suburb selector dropdown
        self.uniqueSuburbs = ko.computed(function() {
            var suburbSet = new Set();
            self.places().forEach(function(place) {
                suburbSet.add(place.suburb);
            });
            return Array.from(suburbSet).sort();
        });
        // utility function for generating name + suburb for a place
        self.longName = function(place) {
            if (place.suburb) {
                return place.name + ', ' + place.suburb;
            }
            return place.name;
        };
    }
    var viewModel = new ViewModel();
    ko.applyBindings(viewModel);


    function createMarker(place) {
        // Make marker a property of place,
        // so it can be easily updated based on
        // the properties of the place
        place.marker = new Marker({
            position: place.latLng,
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
        place.marker.addListener('click', function() {
            closeAllInfoWindows();
            place.infoWindow.open(map, place.marker);
        });
    }

    function createInfoWindow(place) {
        var content = document.createElement('div');
        $('<h3>' + place.name + '</h3>').appendTo(content);
        if (place.hasOwnProperty('description')) {
            $('<h4>' + place.description + '</h4>').appendTo(content);
        }
        $('<h5>' + place.address + '</h5>').appendTo(content);
        if (place.hasOwnProperty('image')) {
            $('<img src=' + place.image + '>').appendTo(content);
        }
        if (place.hasOwnProperty('fourSquareUrl')) {
            $('<a href=' + place.fourSquareUrl + '>Four Square Link</a>').appendTo(content);
        }
        if (place.hasOwnProperty('yelpUrl')) {
            $('<a href=' + place.yelpUrl + '>Yelp Link</a>').appendTo(content);
        }


        if (place.hasOwnProperty('open_now')) {
            if (place.open_now) {
                $('<p>Now Open!</p>').appendTo(content);
            } else {
                $('<p>Currently Closed</p>').appendTo(content);
            }
        }

        if (place.hasOwnProperty('text')) {
            $('<p>"' + place.text + '"</p>').appendTo(content);
        }

        place.infoWindow = new google.maps.InfoWindow();
        place.infoWindow.setContent(content);
    }

    function closeAllInfoWindows() {
        viewModel.places().forEach(function(place) {
            place.infoWindow.close();
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
                var place = googlePlaceToPlace(results[i]);
                createMarker(place);
                createInfoWindow(place);
                viewModel.places.push(place);
            }
        } else {
            // TODO: handle request fail
        }
    }

    function googlePlaceToPlace(googlePlace) {
        var place = {};
        place.latLng = {
            lat: googlePlace.geometry.location.lat(),
            lng: googlePlace.geometry.location.lng()
        };
        place.name = googlePlace.name;
        place.api = 'google';
        place.suburb = googlePlace.vicinity.split(',')[1].trim();
        place.address = googlePlace.vicinity;

        if (googlePlace.hasOwnProperty('photos') && googlePlace.photos.length > 0) {
            place.image = googlePlace.photos[0].getUrl({
                maxWidth: 100,
                maxHeight: 100,
            });
        }

        // TODO: capitalize this string with css
        place.description = googlePlace.types[0].replace('_', ' ');

        if (googlePlace.hasOwnProperty('opening_hours')) {
            place.open_now = googlePlace.opening_hours.open_now;
        }

        if (googlePlace.hasOwnProperty('rating')) {
            place.rating = googlePlace.rating;
        }

        return place;
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
        console.log(msg);
        msg.response.venues.forEach(function(venue) {
            // Don't keep results that don't include an address.
            // Could determine this from coords, but all results
            // without an address contain very little information,
            // and are hard to use with other API results.
            if (venue.location.hasOwnProperty('address')) {
                var place = fourSqrVenueToPlace(venue);
                createMarker(place);
                createInfoWindow(place);
                viewModel.places.push(place);
            }
        });
    });
    request.fail(function(jqXHR, textStatus) {
        console.log('failed');
        console.log(jqXHR);
        console.log(textStatus);
    });

    function fourSqrVenueToPlace(venue) {
        var place = {};
        place.latLng = {
            lat: venue.location.lat,
            lng: venue.location.lng
        };
        place.name = venue.name;
        place.api = 'Foursquare';
        place.suburb = venue.location.city.split(',')[0].trim();
        place.address = venue.location.address + ', ' + venue.location.city;

        if (place.hasOwnProperty('contact') && place.contact.hasOwnProperty('formattedPhone')) {
            place.phone = venue.contact.formattedPhone;
        }

        // create place description from catagories
        if (venue.categories.length > 0) {
            place.description = venue.categories[0].name;
            if (venue.categories.length > 1) {
                for (var i = 1; i > venue.categories.length - 1; i++) {
                    place.description += ', ' + venue.categories[i];
                }
                place.description += ' and ' + venue.categories[venue.categories.length - 1];
            }
        }

        place.fourSquareUrl = 'https://foursquare.com/v/' + venue.id + '?ref=' + fourSquareTokens.clientId;

        return place;
    }

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
        oauth_version: '1.0',
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
    request = $.ajax({
        url: yelp_url,
        data: parameters,
        cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
        dataType: 'jsonp',
    });
    request.done(function(msg) {
        console.log(msg);
        msg.businesses.forEach(function(business) {
            var place = yelpBusToPlace(business);
            createMarker(place);
            createInfoWindow(place);
            viewModel.places.push(place);
        });
    });
    request.fail(function(jqXHR, textStatus) {
        console.log('failed');
        console.log(jqXHR);
        console.log(textStatus);
    });
    function cb(res) {
        console.log('Got Cb');
    }

    function yelpBusToPlace(business) {
        var place = {};
        place.api = 'Yelp';
        place.latLng = {
            lat: business.location.coordinate.latitude,
            lng: business.location.coordinate.longitude
        };
        place.name = business.name;
        place.suburb = business.location.city;
        place.address = business.location.address + ', ' + business.location.city;

        // create place description from catagories
        if (business.categories.length > 0) {
            place.description = business.categories[0][0];
            if (business.categories.length > 1) {
                for (var i = 1; i > business.categories.length - 1; i++) {
                    place.description += ', ' + business.categories[i][0];
                }
                place.description += ' and ' + business.categories[business.categories.length - 1];
            }
        }

        if (place.hasOwnProperty('image_url')) {
            place.image = business.image_url;
        }

        if (business.hasOwnProperty('snippet_text')) {
            place.text = business.snippet_text;
        }

        place.yelpUrl = business.url;
        place.phone = business.phone;

        return place;
    }
});

$(window).resize(function () {
    var h = $(window).height(),
        offsetTop = 60; // Calculate the top offset

    $('#map').css('height', (h - offsetTop));
}).resize();
