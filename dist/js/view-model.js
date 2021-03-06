/**
 * View-model for Local Bike Shops project. Uses [http://knockoutjs.com/ KnockoutJS] to
 * create bindings between JS objects and the HTML view.
 * @module view-model
 */
define(['knockout', 'require'], function(ko, require) {
    'use strict';
    function ViewModel() {
        var self = this;

        /**
         * Array of all places found by AJAX requests.
         * It is deferred, as it's a dependency of the whole app,
         * and it will be repeatedly pushed to when AJAX requests return
         * @var places
         * @type {observableArray}
         * @memberof! module:view-model
         * @instance
         */
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
         * Name of of the current search location, displayed at the top of page.
         * @var searchLocation
         * @type {obsevable}
         * @memberof! module:view-model
         * @instance
         */
        self.searchLocation = ko.observable('');



        /**
         * Places filtering section; code for removing places from sidebar and
         * map, based on suburb filter and search text input box.
         */

        /**
         * Observable; set by, and sets the search box text.
         * One of the values used to filter the filteredPlaces array.
         * @var searchTextFilter
         * @type {observable}
         * @memberof! module:view-model
         * @instance
         */
        self.searchTextFilter = ko.observable('');

        /**
         * Observable; set by by the select suburb menu.
         * One of the values used to filter the filteredPlaces array.
         * @var suburbFilter
         * @type {observable}
         * @memberof! module:view-model
         * @instance
         */
        self.suburbFilter = ko.observable('');

        /**
         * Function to change the value of suburb filter, used by the view.
         * @function setSuburbFilter
         * @instance
         */
        self.setSuburbFilter = function(data, event) {
            self.suburbFilter(data);
        };

        /**
         * Computed array of filtered places, for use in side bar and autocomplete.
         * This depends on two filters; suburbFilter and searchTextFilter
         * @var filteredPlaces
         * @type {computedObservable}
         * @memberof! module:view-model
         * @instance
         */
        self.filteredPlaces = ko.computed(function() {
            var filtered = [];
            // Need to call dependancy here to make it register as a dependancy, as it's used by inner function.
            self.searchTextFilter();
            // For each place check if it passes filter.
            self.places().forEach(function(place) {
                // If there is a suburb filter check it matches place.
                var suburbOK = self.suburbFilter() === '' || place.suburb === self.suburbFilter();
                // Check the first part of the string matches the search text.
                var strLen = self.searchTextFilter().length;
                var searchTextOK = place.longName().slice(0, strLen).toLowerCase() === self.searchTextFilter().toLowerCase();
                if (suburbOK && searchTextOK) {
                    // Passed filter, add to array and show marker.
                    filtered.push(place);
                    place.marker.show();
                } else {
                    // Didn't pass filter, don't add to array and hide marker.
                    place.marker.hide();
                }
            });
            return filtered;
        });



        /**
         * Observable; set by by the select suburb .
         * One of the values used to filter the filteredPlaces array.
         * @var locationInput
         * @type {observable}
         * @memberof! module:view-model
         * @instance
         */
        self.locationInput = ko.observable('');

        /**
         * Boolean observable; used when the browser window is mobile width to show / hide nav.
         * @var hideNav
         * @type {observable}
         * @memberof! module:view-model
         * @instance
         */
        self.hideNav = ko.observable(true);

        /**
         * Function to toggle visiblility of nav when browser window is mobile width.
         * @function toggleNav
         */
        self.toggleNav = function() {
            self.hideNav(!self.hideNav());
        };



        /*
         * Search form section
         */

        /**
         * Function to handle form submit from the the search form. If able to determine
         * single place, either because it was selected from the autocomplete menu or
         * because there is only one place left in the filterPlaces list, then select it.
         * Otherwise, do nothing.
         * @function searchSubmit
         * @instance
         */
        self.searchSubmit = function() {
            if (self.autoCompHighlightItem()) {
                // On submit, if an autocomplete item is highlighted, then use it
                self.autoCompSelect(self.autoCompHighlightItem());
            } else if (self.filteredPlaces().length === 1) {
                // If there's only one place in the filter list, then accept it
                self.autoCompSelect(self.filteredPlaces()[0]);
            } else {
                // Not done selecting, do nothing
                self.showAutoCompMenu(false);
            }
        };

        /*
         * Search form autocomplete section. This implements an autocomplete menu on the
         * search text input.
         */

        /**
         * Boolean observable, sets whether autocomplete menu is visible.
         * @var showAutoCompMenu
         * @type {observable}
         * @memberof! module:view-model
         * @instance
         */
        self.showAutoCompMenu = ko.observable(false);

        /**
         * Subscribe to seachTextFilter, to update the autocomplete menu whenever text changes.
         */
        self.searchTextFilter.subscribe(function(searchTextFilter) {
            self.autoCompHighlightItem(null);
            // Only show the autocomplete menu if the number of options is between 1 and 9.
            if ((0 < self.filteredPlaces().length) && (self.filteredPlaces().length < 10)) {
                self.showAutoCompMenu(true);
                // add listener to page body to hide this menu if clicked outside.
                $('body').click(function() {
                    self.showAutoCompMenu(false);
                });
            } else {
                self.showAutoCompMenu(false);
            }
        });

        /**
         * Function to accept the autocomplete option, and set filtering based on it.
         * @function autoCompSelect
         * @instance
         * @param {Place} place - Place selected by autocomplete.
         */
        self.autoCompSelect = function(place) {
            self.searchTextFilter(place.longName());
            self.showAutoCompMenu(false);
            self.selectPlace(self.filteredPlaces()[0]);
        };

        /**
         * Observable which represents the place which is currently highlighted
         * in the autocomplete menu.
         * @var autoCompHighlightItem
         * @type {observable}
         * @memberof! module:view-model
         * @instance
         */
        self.autoCompHighlightItem = ko.observable();

        /**
         * Function for setting the autoCompleteHighlightItem.
         * @function setAutoCompHighlight
         * @instance
         * @param {object} data - List item dom element to be hightlighted.
         */
        self.setAutoCompHighlight = function(data) {
            self.autoCompHighlightItem(data);
        };

        /**
         * Function for handling keypresses, used to allow hightlighting items in
         * autocomplete list.
         * @function inputKeyPress
         * @instance
         */
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

        /**
         * Function to move the currently hightlighted item in the autocomplete list.
         * @function moveAutoCompHighlight
         * @instance
         * @param {string} dir - Direction to move hightlight, 'up' or 'down'.
         */
        self.moveAutoCompHighlight = function(dir) {
            // If the menu is not currently visible then just return function
            if (!self.showAutoCompMenu()) {
                return true;
            }

            // Get index of currently hightlighted item, set to -1 if none currently hightlighted.
            var itemIndex;
            if (self.autoCompHighlightItem()) {
                itemIndex = self.filteredPlaces().indexOf(self.autoCompHighlightItem());
            } else {
                itemIndex = -1;
            }

            // Change index based on direction of movement.
            if (dir === 'up') {
                itemIndex--;
            } else if (dir === 'down') {
                itemIndex++;
            } else {
                console.log('!! got unexpected input to moveAutoCompHighlight');
            }

            // This allows wrapping from top of list to bottom, ideally would just use mod,
            // but JS does not have proper mod function. This also handles the case where
            // there was no previous highlighted item, as in that case the index will now be 0/-2.
            //
            if (itemIndex < 0) {
                // Highlight has moved off the top of the list, move to bottom.
                itemIndex = self.filteredPlaces().length - 1;
            } else if (itemIndex >= self.filteredPlaces().length) {
                // Hightlight has moved off the bottom of the list, move to top.
                itemIndex = 0;
            }

            // Highlight new item.
            self.autoCompHighlightItem(self.filteredPlaces()[itemIndex]);
            return true;
        };



        /**
         * Function to select a place, opening its infoWindow, and hiding nav if in mobile view width.
         * @funtion selectPlace
         * @instance
         * @param {Place} place - The place to select.
         */
        self.selectPlace = function(place) {
            place.open();
            self.hideNav(true);
        };

        /**
         * Computed observable array of unique suburbs in placesArray,
         * used by the suburb selector menu.
         * @var uniqueSuburbs
         * @type {computed}
         * @memberof! module:view-model
         * @instance
         */
        self.uniqueSuburbs = ko.computed(function() {
            var suburbSet = new Set();
            self.places().forEach(function(place) {
                suburbSet.add(place.suburb);
            });
            return Array.from(suburbSet).sort();
        });

        /**
         * Observable to set whether the Google fail text is visible.
         * @var googleFail
         * @type {observable}
         * @memberof! module:view-model
         * @instance
         */
        self.googleFail = ko.observable(false);
        /**
         * Observable to set whether the Yelp fail text is visible.
         * @var fourSqrFail
         * @type {observable}
         * @memberof! module:view-model
         * @instance
         */
        self.fourSqrFail = ko.observable(false);
        /**
         * Observable to set whether the Yelp fail text is visible.
         * @var yelpFail
         * @type {observable}
         * @memberof! module:view-model
         * @instance
         */
        self.yelpFail = ko.observable(false);
    }
    var viewModel = new ViewModel();
    ko.applyBindings(viewModel);
    return viewModel;
});
