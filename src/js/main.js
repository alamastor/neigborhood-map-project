requirejs.config({
    baseUrl: 'js/lib',
    paths: {
        //;tokens: '../tokens',
        //map_icons: '../../lib/js/map.icons.min',
        async: 'async'
    },
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

requirejs(['../app']);
