requirejs.config({
    baseUrl: 'js/lib',
    shim: {
        '../../lib/js/map-icons.min': {
            deps: ['google'],
            exports: 'mapIcons',
        }
    }
});

define('google', ['async!https://maps.googleapis.com/maps/api/js?libraries=places'], function() {
    return window.google;
});

define('oauthSignature', ['oauth-signature'], function() {
    return window.oauthSignature;
});

define('mapIcons', ['../../lib/js/map-icons.min'], function() {
    return {
        Marker: Marker,
        MAP_PIN: MAP_PIN,
    }
})

requirejs(['jquery', '../app'],
function(         $,     app) {
    $(app.init());
}, function(err) {
    console.log(err);
    if (err.requireModules.indexOf("async!https://maps.googleapis.com/maps/api/js?libraries=places_unnormalized2") != -1) {
        // Couldn't get google maps library, will have to disable most functionality.
        // Alternative would be to fall back to local version of the library,
        // but the library has other external depencies, which would also have to be
        // stored locally, and whose URLs would need to altered to the local location.
        requirejs.undef('google');
        define('google', function() {
            return {
                load: 'fail',
            };
        });
        requirejs.undef('mapIcons');
        define('mapIcons', function() {
            return {
                load: 'fail',
            };
        });
    }
    requirejs.undef('../app');
    requirejs(['jquery', '../app', 'google', 'mapIcons'],
    function(         $,     app) {
        // Original function that errored will be called again now
    });
});
