define(['knockout', 'require'], function(ko, require) {
    function ViewModel() {
        var self = this;

        // Array of all places found by ajax requests.
        // It is deferred, as it's a dependency of the whole app,
        // and it will be repeatedly pushed to when ajax requests return
        self.places = ko.observableArray().extend({deferred: true});

        // Subscribe to the places array to keep it sorted
        self.places.subscribe(function(places) {
            places.sort (function(a, b) {
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
         * Location change section
         */
        self.locationInput = ko.observable('');
        self.locationSubmit = function() {
            var app = require('./app');
            app.updateLocation(self.locationInput());
        }

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
    return viewModel;
});
