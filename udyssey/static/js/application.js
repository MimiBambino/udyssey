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

    // create our map object
    var map = new google.maps.Map(mapCanvas, mapOptions);    

    return map;
  };

  var GoogleMapsGeocoder = function() {

    // the geocoder object allows us to do latlng lookup based on address
    var geocoder = new google.maps.Geocoder();

    return geocoder;

  };

  /* Main application view model */
  var AppViewModel = function() {
    var self = this;
    var map;
    var geocoder;    

    function initialize() {
      map = new GoogleMap();
      geocoder = new GoogleMapsGeocoder();      

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
      console.log(self.locationInput());
      self.locations.push(self.locationInput());
      self.locationInput('');
    };    

    // remove location function
    self.removeLocation = function() {
      self.locations.remove(this);
    };

    $( function() {
      // instantiate the addressPicker suggestion engine (based on bloodhound)
      var addressPicker = new AddressPicker({map: {id: '#map-canvas'}, marker: {draggable: true, visible: true}, zoomForLocation: 18, reverseGeocoding: true});

      // instantiate the typeahead UI
      $('#address').typeahead(null, {
        displayKey: 'description',
        source: addressPicker.ttAdapter()
      });
      addressPicker.bindDefaultTypeaheadEvent($('#address'));      
    }) 

    $(document).ready(initialize);
  };

  ko.applyBindings(new AppViewModel());
})();