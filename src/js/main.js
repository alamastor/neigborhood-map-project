/**
 * Entry point into app. Uses Require JS to load all dependecies and then
 * starts app.js. See http://requirejs.org/ for Require JS useage.
 */
requirejs.config({
    baseUrl: 'js/lib',
    shim: {
        bootstrap: {
            deps: ['jquery']
        },
        '../../lib/js/map-icons.min': {
            deps: ['google'],
            exports: 'mapIcons',
        }
    },
    paths: {
        bootstrap: '../../lib/js/bootstrap.min',
    }
});

define('google', ['async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBlllhsbJmuXJL9a1EMp8sax8CNUnBC_JM&libraries=places'], function () {
    return window.google;
});

define('oauthSignature', ['oauth-signature.min'], function () {
    return window.oauthSignature;
});

define('mapIcons', ['../../lib/js/map-icons.min'], function () {
    return {
        Marker: Marker,
        MAP_PIN: MAP_PIN,
    };
});

// Call bootstrap to force it to load and be used.
requirejs(['bootstrap'], function () { });

requirejs(['jquery', '../app'],
    function ($, app) {
        $(app.init());
    }, function (err) {
        console.log(err);
        if (err.requireModules.indexOf("async!https://maps.googleapis.com/maps/api/js?libraries=places_unnormalized2") !== -1) {
            // Couldn't get google maps library, will have to disable most functionality.
            // Alternative would be to fall back to local version of the library,
            // but the library has other external depencies, which would also have to be
            // stored locally, and whose URLs would need to altered to the local location.
            requirejs.undef('google');
            define('google', function () {
                return {
                    load: 'fail',
                };
            });
            requirejs.undef('mapIcons');
            define('mapIcons', function () {
                return {
                    load: 'fail',
                };
            });
        }
        requirejs.undef('../app');
        requirejs(['jquery', '../app'],
            function ($, app) {
                // Original function that errored will be called again now
            });
    });
