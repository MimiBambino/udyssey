(function() {
  'use strict';

  /* MapMarkerSet class contains information of each location marker */
  var MapMarkerSet = function(marker, name, keyword, position) {
    this.marker = marker,
    this.name = name,
    this.keyword = keyword,
    this.position = position
  };

  /* Fixtures */
  var fixtureLocations = [
    "Chicago, IL, USA",
    "New York, NY, USA",
    "Austin, TX, USA",
    "Mountain View, CA, USA"
  ];

  /* Google Maps Model */
  var GoogleMap = function() {
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

    // ===========
    //  Variables
    // ===========

    var self = this;
    var map;
    var geocoder;
    var infowindow;
    var service;
    var newLocation;
    var previousLocation;
    var locationMarkers = [];


    // =============
    //  Observables
    // =============

    self.locations = ko.observableArray([]);
    self.locationInput = ko.observable('');


    // ==============
    //  VM functions
    // ==============

    // search for new location. This will place a marker on the map
    self.searchNewLocation = function() {
      // remove previous location from map
      // if it's not added to locations array
      if (self.locations().indexOf(previousLocation) === -1) {
        locationMarkers[locationMarkers.length-1].marker.setMap(null);
        locationMarkers.pop();
      }

      // request location info if it's not already added to locations array
      if (self.locationInput().length > 0) {
        if (self.locations().indexOf(self.locationInput()) === -1) {
          requestNewLocation(self.locationInput());
        } else {
          locationMarkers.forEach(function(markerSet) {
            if (markerSet.keyword === self.locationInput().toLowerCase()) {
              map.panTo(markerSet.position);
            }
          });
        }
        infowindow.close();
      }
    };

    // remove location from locations array
    // and remove marker from the map
    self.removeLocation = function() {
      self.locations.remove(this);
      removeMarker(this);
    };


    // ==================
    //  Helper functions
    // ==================

    // initialize the app
    function initialize() {
      map = new GoogleMap();
      geocoder = new GoogleMapsGeocoder();
      infowindow = new google.maps.InfoWindow();

      // initialize fixture data
      fixtureLocations.forEach(function(location) {
        requestNewLocation(location);
        self.locations.push(location);
      });
    }

    // remove marker from map and locationMakrers array
    function removeMarker(location) {
      for (var i=0; i < locationMarkers.length; i++) {
        if (locationMarkers[i].keyword === location.toLowerCase()) {
          locationMarkers[i].marker.setMap(null);
          locationMarkers.splice(i, 1);
        }
      }
    }

    // get location information and set new location marker on the map
    function getNewLocationInfo(placeData) {
      var lat = placeData.geometry.location.lat();
      var lng = placeData.geometry.location.lng();
      newLocation = new google.maps.LatLng(lat, lng);
      map.setCenter(newLocation);

      createMarker(placeData);
    }

    // callback method for new location
    function newLocationCallback(results, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        getNewLocationInfo(results[0])
      }
    }

    // request new location data from PlaceService
    function requestNewLocation(newLocation) {
      var request = {
        query: newLocation
      };
      service = new google.maps.places.PlacesService(map);
      service.textSearch(request, newLocationCallback);
    }

    // create a map marker for new location
    function createMarker(placeData) {
      var position = placeData.geometry.location;
      var name = placeData.name;
      var keyword = placeData.formatted_address;
      previousLocation = keyword;

      // marker for new location
      var marker = new google.maps.Marker({
        map: map,
        position: position,
        title: name,
      });

      locationMarkers.push(new MapMarkerSet(marker, name.toLowerCase(), keyword.toLowerCase(), position));

      // content of the infowindow
      var content = document.createElement('div');
      content.classList.add('infowindow');
      content.innerHTML = '<p><h4 class="iw-title">' + keyword + '</h4></p>';

      // a button inside the infowindow
      var button = content.appendChild(document.createElement('button'));
      button.classList.add('btn', 'btn-primary', 'iw-btn');
      button.innerHTML = 'Add';
      google.maps.event.addDomListener(button, 'click', function() {
        self.locations.push(keyword);
        button.style.display = 'none';
        infowindow.close();
        self.locationInput('');
      });

      google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(content);
        infowindow.open(map, this);
        map.panTo(position);
      });
    }


    $( function() {
      // instantiate the addressPicker suggestion engine (based on bloodhound)
      var addressPicker = new AddressPicker({map: {id: '#map-canvas'}, marker: {draggable: true, visible: true}, zoomForLocation: 18, reverseGeocoding: true});

      // instantiate the typeahead UI
      $('#address').typeahead(null, {
        displayKey: 'description',
        source: addressPicker.ttAdapter()
      });
      addressPicker.bindDefaultTypeaheadEvent($('#address'));
    });

    $(document).ready(initialize);
  };

  ko.applyBindings(new AppViewModel());
})();