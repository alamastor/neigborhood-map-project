/**
 * Main app module. Responsible for creating the Google Map, making the API calls
 * to Google Places, Foursquare, and Yelp, and adding the results to the map. Also
 * loads the view module with RequireJS, and interacts with it - primarily to provide
 * it with a list of the to places it received from the APIs.
 */
define(['jquery', 'google', 'oauthSignature', './tokens', 'mapIcons', './view-model'],
function($, google, oauthSignature, tokens, mapIcons, viewModel) {
'use strict';
// default values for the centre of the search, will be used if
// values for neigborhoodMapCenterCoords and neigborhoodMapCenterName
// are not found in the users brower localStorage.
var DEFAULT_CENTER_LOCATION_COORDS = {lat: -37.8647, lng: 144.9696};
var DEFAULT_CENTER_LOCATION_NAME = 'St Kilda, Australia';

/**
 * Global objects for module
 */

/*
 * map is the Google Map object and is initialized in createMap.
 * Accessed by the callbacks from the API requests to add markers
 * to the map.
 */
var map = {};

/**
 * placesObject stores the the indiviual place objects which are created
 * from the results of the API calls. Each API call converts its results into
 * 
 */
var placesObject = {};


function Place(
    lat, lng, name, suburb, address, image, description,
    open_now, phone, fourSquareUrl, yelpSnippet, yelpUrl
) {
    this.latLng = {lat: lat, lng: lng};
    this.name = name;
    this.suburb = suburb;
    this.address = address;
    this.image = image;
    this.description = description;
    this.open_now = open_now;
    this.phone = phone;
    this.fourSquareUrl = fourSquareUrl;
    this.yelpSnippet = yelpSnippet;
    this.yelpUrl = yelpUrl;
}


function init() {
    setTextClear();
    createMap();
    getGooglePlaces();
    getFourSquarePlaces();
    getYelpPlaces();
}

// code to add clear button to input text based
// on http://www.bootply.com/130682
function setTextClear() {
    $(".hasclear").keyup(function () {
        var self = $(this);
        self.next('span').toggle(Boolean(self.val()));
    });

    $(".clearer").hide($(this).prev('input').val());

    $(".clearer").click(function () {
        viewModel.searchTextFilter('');
        $(this).prev('input').focus();
        $(this).hide();
    });
}

function updateLocation(location) {
    var lat = location.geometry.location.lat();
    var lng = location.geometry.location.lng();
    var placeName = location.formatted_address;
    setLocalStorageMapCenter({lat: lat, lng: lng}, placeName);
    viewModel.searchLocation(getMapCenterName());
    viewModel.suburbFilter('');
    map.panTo({lat: lat, lng: lng});

    // Need to delete the markers and infowindows manually,
    // or they stay attached to map after their object is destroyed.
    for(var place in placesObject) {
        if (placesObject.hasOwnProperty(place)) {
            placesObject[place].marker.setMap(null);
            delete placesObject[place].infoWindow;
        }
    }
    placesObject = {};
    getGooglePlaces();
    getFourSquarePlaces();
    getYelpPlaces();
}

function setLocalStorageMapCenter(coords, name) {
    localStorage.setItem('neigborhoodMapCenterCoords', JSON.stringify(coords));
    localStorage.setItem('neigborhoodMapCenterName', name);
}

function getMapCenterCoords() {
    if (localStorage.hasOwnProperty('neigborhoodMapCenterCoords')) {
        return JSON.parse(localStorage.neigborhoodMapCenterCoords);
    } else {
        return DEFAULT_CENTER_LOCATION_COORDS;
    }
}

function getMapCenterName() {
    return localStorage.neigborhoodMapCenterName || DEFAULT_CENTER_LOCATION_NAME;
}

function createMap() {
    // Create a map object and specify the DOM element for display.
    var centerLocationCoords = getMapCenterCoords();
    var centerLocationName = getMapCenterName();
    viewModel.searchLocation(centerLocationName);
    if (!(google.load == 'fail')) {
        map = new google.maps.Map(document.getElementById('map'), {
            center: centerLocationCoords,
            scrollwheel: true,
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.TERRAIN,
        });
        var locationInput = $('#location-input')[0];
        var autocomplete = new google.maps.places.Autocomplete(locationInput, {types: ['(regions)']});
        autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();
            updateLocation(place);
            viewModel.locationInput('');
        });
        viewModel.googleFail(false);
    } else {
        // google maps load fail app cannot run, show fail text
        viewModel.googleFail(true);
    }
}

Place.prototype.createMarker = function() {
    // Make marker a property of place,
    // so it can be easily updated based on
    // the properties of the place
    if (!(mapIcons.load == 'fail')) {
        this.marker = new mapIcons.Marker({
            position: this.latLng,
            map: map,
            icon: {
                path: mapIcons.MAP_PIN,
                fillColor: 'darkslategrey',
                fillOpacity: 0.8,
                strokeColor: '',
                strokeWeight: 0
            },
            map_icon_label: '<span class="map-icon map-icon-bicycle-store"></span>',
        });
        var self = this;
        this.marker.addListener('click', function() {
            self.openInfoWindow();
        });
    }
}
mapIcons.Marker.prototype.show = function() {
    this.setMap(map);
};

mapIcons.Marker.prototype.hide = function() {
    this.setMap(null);
};


Place.prototype.addInfoWindow = function() {
    if (!(mapIcons.load == 'fail')) {
        this.infoWindow = new google.maps.InfoWindow();
        this.updateInfoWindowContent();
    }
};

Place.prototype.openInfoWindow = function() {
    closeAllInfoWindows();
    if (this.hasOwnProperty('marker')) {
        this.infoWindow.open(map, this.marker);
    }
}

function closeAllInfoWindows() {
    viewModel.places().forEach(function(place) {
        if (place.hasOwnProperty('infoWindow')) {
            place.infoWindow.close();
        }
    });
}

Place.prototype.updateInfoWindowContent = function() {
    var content = $('<div class="info-window-content"></div>')[0];
    $('<h3>' + this.name + '</h3>').appendTo(content);
    if (this.description) {
        $('<h4 class="info-window-place-description">' + this.description + '</h4>').appendTo(content);
    }
    var infoWindowBody = $('<div class="info-window-body"></div>').appendTo(content);
    var infoWindowBodyText = $('<div class="info-window-body-text"></div>').appendTo(infoWindowBody);
    $('<h5>' + this.address + '</h5>').appendTo(infoWindowBodyText);
    if (this.phone) {
        $('<p>' + this.phone + '</p>').appendTo(infoWindowBodyText);
    }
    if (this.fourSquareUrl) {
        $('<p><a href=' + this.fourSquareUrl + '><img src="images/Connect-to-Foursquare-150.png"></a></p>').appendTo(infoWindowBodyText);
    }
    if (this.yelpUrl) {
        $('<p><a href=' + this.yelpUrl + '><img src="images/yelp_review_btn_dark.png"></a></p>').appendTo(infoWindowBodyText);
    }
    if (this.open_now != null) {
        if (this.open_now) {
            $('<p>Now Open!</p>').appendTo(infoWindowBodyText);
        } else {
            $('<p>Currently Closed</p>').appendTo(infoWindowBodyText);
        }
    }
    if (this.yelpSnippet) {
        $('<p>"' + this.yelpSnippet + '"</p>').appendTo(infoWindowBodyText);
    }
    if (this.image) {
        $('<div class="info-window-image-container"><img class="info-window-image" src=' + this.image + '></div>').appendTo(infoWindowBody);
    }
    this.infoWindow.setContent(content);
}

// Store API results in object with address as key.
// This object will the be converted to array for Knockout, after cleanup.
function addPlaceToPlacesObject(place) {
    if (!placesObject.hasOwnProperty(place.address.toLowerCase())) {
        placesObject[place.address.toLowerCase()] = place;
    } else {
        // Place is already in object just add properties it doesn't already have
        var existingPlace = placesObject[place.address.toLowerCase()];
        var propertiesToCheck = [
            'phone',
            'image',
            'description',
            'open_now',
            'fourSquareUrl',
            'yelpUrl',
            'yelpSnippet',
        ];
        propertiesToCheck.forEach(function(property) {
            if (place[property] != null && existingPlace[property] === null) {
                existingPlace[property] = place[property];
            }
            // if connect to google failed, will have no place
            if (existingPlace.hasOwnProperty('infoWindow')) {
                existingPlace.updateInfoWindowContent(existingPlace);
            }
            if (place.hasOwnProperty('marker')) {
                place.marker.setMap(null);
            }
        });
    }
};

function updatePlacesArray() {
    viewModel.places([]);
    for (var place in placesObject) {
        if (placesObject.hasOwnProperty(place)) {
            viewModel.places.push(placesObject[place]);
        }
    }
};

/**
 * API requests
 */
function getGooglePlaces() {
    if (google.load == 'fail') {
        // google failed to load don't continue
        return
    }
    // Google places
    var service = new google.maps.places.PlacesService(map);
    var centerLocationCoords = getMapCenterCoords();
    service.nearbySearch({
        location: new google.maps.LatLng(centerLocationCoords.lat, centerLocationCoords.lng),
        radius: 3000,
        type: 'bicycle_store',
    }, gotGooglePlaces);

    function gotGooglePlaces(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            console.log(results);
            for (var i = 0; i < results.length; i++) {
                var place = googlePlaceToPlace(results[i]);
                place.createMarker();
                place.addInfoWindow();
                addPlaceToPlacesObject(place);
            }
        } else {
            // TODO: handle request fail
        }
        updatePlacesArray();
    }

    function googlePlaceToPlace(googlePlace) {
        var lat = googlePlace.geometry.location.lat();
        var lng = googlePlace.geometry.location.lng();
        var name = googlePlace.name;
        var suburb = fixSuburb(googlePlace.vicinity.split(',')[1].trim());
        var address = fixAddress(googlePlace.vicinity.split(',')[0].trim()) + ', ' + suburb;

        var image;
        if (googlePlace.hasOwnProperty('photos') && googlePlace.photos.length > 0) {
            image = googlePlace.photos[0].getUrl({
                maxWidth: 100,
                maxHeight: 100,
            });
        }

        // description is capitalized in css
        var description = googlePlace.types[0].replace('_', ' ');

        var open_now;
        if (googlePlace.hasOwnProperty('opening_hours')) {
            open_now = googlePlace.opening_hours.open_now;
        }

        return new Place(
            lat, lng, name, suburb, address, image,
            description, open_now, null, null, null, null
        );
    }
}

function getFourSquarePlaces() {
    var centerLocationCoords = getMapCenterCoords();
    // Foursquare search
    var request = $.ajax('https://api.foursquare.com/v2/venues/search', {
        dataType: 'json',
        data: {
            client_id: tokens.fourSquareTokens.clientId,
            client_secret: tokens.fourSquareTokens.clientSecret,
            ll: centerLocationCoords.lat.toString() + ',' + centerLocationCoords.lng.toString(),
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
                place.createMarker();
                place.addInfoWindow(place)
                addPlaceToPlacesObject(place);
            }
        });
        updatePlacesArray();
        viewModel.foursqrFail(false);
    });
    request.fail(function(jqXHR, textStatus) {
        console.log('Foursquare ajax failed');
        viewModel.foursqrFail(true);
    });

    function fourSqrVenueToPlace(venue) {
        var lat = venue.location.lat;
        var lng = venue.location.lng;
        var name = venue.name;
        var suburb = fixSuburb(venue.location.city.split(',')[0].trim());
        var address = fixAddress(venue.location.address) + ', ' + suburb;

        var phone;
        if (venue.hasOwnProperty('contact') && venue.contact.hasOwnProperty('formattedPhone')) {
            phone = venue.contact.formattedPhone;
        }

        var description;
        // create place description from catagories
        if (venue.categories.length > 0) {
            description = venue.categories[0].name;
            if (venue.categories.length > 1) {
                for (var i = 1; i > venue.categories.length - 1; i++) {
                    description += ', ' + venue.categories[i];
                }
                description += ' and ' + venue.categories[venue.categories.length - 1];
            }
        }

        var fourSquareUrl = 'https://foursquare.com/v/' + venue.id + '?ref=' + tokens.fourSquareTokens.clientId;

        return new Place(
            lat, lng, name, suburb, address, null, description,
            null, description, phone, fourSquareUrl, null, null
        );
    }
}

function getYelpPlaces() {
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
    var centerLocationCoords = getMapCenterCoords();
    var centerLocationName = getMapCenterName();
    var parameters = {
        oauth_consumer_key: tokens.yelpTokens.consumerKey,
        oauth_token: tokens.yelpTokens.token,
        oauth_nonce: nonce_generate(),
        oauth_timestamp: Math.floor(Date.now()/1000),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version: '1.0',
        term: 'bicycle_store',
        cll: centerLocationCoords.lat.toString() + ',' + centerLocationCoords.lng.toString(),
        location: centerLocationName,
        callback: 'cb'              // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
    };

    parameters.oauth_signature = oauthSignature.generate(
        'GET',
        yelp_url,
        parameters,
        tokens.yelpTokens.consumerSecret,
        tokens.yelpTokens.tokenSecret
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
        msg.businesses.forEach(function(business) {
            // Don't keep results that don't include an address.
            // Could determine this from coords, but all results
            // without an address contain very little information,
            // and are hard to use with other API results.
            if (business.location.hasOwnProperty('address') && business.location.address.length > 0) {
                var place = yelpBusToPlace(business);
                place.createMarker();
                place.addInfoWindow()
                addPlaceToPlacesObject(place);
            }
        });
        updatePlacesArray();
        viewModel.yelpFail(false);
    });
    request.fail(function(jqXHR, textStatus) {
        console.log('yelp ajax failed');
        viewModel.yelpFail(true);
    });
    function cb(res) {
        console.log('Got Cb');
    }

    function yelpBusToPlace(business) {
        var lat = business.location.coordinate.latitude;
        var lng = business.location.coordinate.longitude;
        var name = business.name;
        var suburb = fixSuburb(business.location.city);
        var address = fixAddress(business.location.address[0]) + ', ' + suburb;

        var image;
        if (business.hasOwnProperty('image_url')) {
            image = business.image_url;
        }

        var description;
        // create place description from catagories
        if (business.categories.length > 0) {
            description = business.categories[0][0];
            if (business.categories.length > 1) {
                for (var i = 1; i > business.categories.length - 1; i++) {
                    description += ', ' + business.categories[i][0];
                }
                description += ' and ' + business.categories[business.categories.length - 1];
            }
        }

        var phone = business.phone;

        var yelpSnippet;
        if (business.hasOwnProperty('snippet_text')) {
            yelpSnippet = business.snippet_text;
        }

        var yelpUrl = business.url;

        return new Place(
            lat, lng, name, suburb, address, image, description,
            null, phone, null, yelpSnippet, yelpUrl
        );
    }
}



// Function to remove minor differences in addresses,
// which prevent results for the same place from different
// APIs from matching.
function fixAddress(address) {
    address = address.replace('.', '');
    address = address.replace(/St$/, 'Street');
    address = address.replace(/Rd$/, 'Road');
    return address;
}

// Function to remove minor differences in suburb,
// which prevent results for the same place from different
// APIs from matching.
function fixSuburb(suburb) {
    suburb = suburb.replace('.', '');
    // Fix abreviation of Saint Kilda
    suburb = suburb.replace('St', 'Saint');
    return suburb;
}

return {
    init: init,
    updateLocation: updateLocation,
    closeAllInfoWindows: closeAllInfoWindows,
};

});
