(function() {
  'use strict';

  /* Fixtures */
  var fixtureLocations = [
    "Chicago, IL",
    "New York, NY",
    "Austin, TX",
    "Mountain View, CA"
  ];

  /* Google Maps Model */
  var GoogleMap = function() {
    var self = this;

    var mapCanvas = $('#map-canvas')[0];

    var mapOptions = {
      center: { lat: 34.397, lng: -90.644},
      zoom: 4,
      panControl: false
    };

    var map = new google.maps.Map(mapCanvas, mapOptions);
    return map;
  };

  /* Main application view model */
  var AppViewModel = function() {
    var self = this;
    var map;

    function initialize() {
      map = new GoogleMap();

      // initialize fixture data
      fixtureLocations.forEach(function(location) {
        self.locations.push(location);
      });
    }

    // initialize our observables
    self.locations = ko.observableArray([]);
    self.locationInput = ko.observable('');

    // add location function
    self.addLocation = function() {
      self.locations.push(self.locationInput());
      self.locationInput('');
    };

    $(document).ready(initialize);
  };

  ko.applyBindings(new AppViewModel());
})();