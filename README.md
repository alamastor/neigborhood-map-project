# Local Bike Shops Project
This project uses Google Maps, Google Places, the Yelp search API, and the
Foursquare API to show users bike shops near their selected location.

## Features
- Search local bike shops using the Google Places, Yelp search and Foursquare
search APIs.
- Update save search location in browser storage using *Your Location* text
input.
- Search results using the *Search* text input, and autocomplete.
- Filter results by suburb, using the *Select Suburb* menu.
- View results from all three APIs by clicking marker at location, or by
selecting a place from the side bar or search text.

## Usage
A built version of project is inside the *dist* directory, the project can be
viewed locally by opening dist/index.html in a browser.

The source code is viewable in the *src* directory.

The project uses JSDoc, and the generated HTML documentation is viewable in
docs/index.html.

The project can be built from source as follows (requires NPM, Bower & Grunt installed):
``` bash
$ cd /path/to/project/dir
$ npm install
$ bower install
$ grunt
```

## Dependencies
This project uses the following libraries:
- [Google Maps](https://developers.google.com/maps/)
- [Knockout JS](http://knockoutjs.com/)
- [JQuery](https://jquery.com/)
- [Require JS](http://requirejs.org/)
- [Bootstrap](http://getbootstrap.com/)
- [map-icons](http://map-icons.com/)
- [Oauth-Signature-Js](https://github.com/bettiolo/oauth-signature-js)
- [JS Doc](http://usejsdoc.org/)

## Notes
- API keys are kept in src/js/tokens.js. This is bad practice,
on a real project they should be kept on the the server, and out of version
control, with API calls also made server side.
- The project uses [Require JS](http://requirejs.org/) to manage module loading
and keep the global namespace clean. *js/main.js* is the entry point into the app.

## Contributors
Alistair McKelvie

