(function() {
  'use strict';

  // prototype method for Arrays. This method takes another array as an input
  // and returns true if both arrays have same values in same order, otherwise false.
  Array.prototype.isSameAs = function(arrayB) {
    if (this.length !== arrayB.length) {
      return false;
    } else {
      for (var i=0; i < this.length; i++) {
        if (this[i] !== arrayB[i]) {
          return false;
        }
      }
      return true;
    }
  };

  /**
   * MapMarkerSet class contains information of each location marker
   * 
   *  - marker: a map marker of the location
   *  - name: a short name of the location from PlaceSearch
   *  - keyword: formatted address from PlaceSearch, which will be displayed as keyword
   *  - position: LatLng object of the location, which contains lat and lon values
   */
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
    var directionsService;
    var locationMarkers = [];
    var directionsDisplayOptions = {
      preserveViewport: true,
      markerOptions: {icon: ""}
    };
    // DirectionsRenderer objects
    // there are 6 of them, so current maximum is 55 locations
    // (max locations = 10 + 9 + 9 + 9 + 9 + 9 = 55)
    var directionsDisplay1, directionsDisplay2,
    directionsDisplay3, directionsDisplay4,
    directionsDisplay5, directionsDisplay6;


    // =============
    //  Observables
    // =============

    self.locations = ko.observableArray([]);
    self.locationInput = ko.observable('');
    self.locationTab = ko.observable(true);

    // computes optimized route when user adds a new location
    self.optimizedRoute = ko.computed(function() {
      // this should be an "actual" optimized route later
      // currently, it's just a list of user added locations
      var optimizedRoute = self.locations();
      var optLen = optimizedRoute.length;

      if (optLen > 2) {
        // TODO: compute optimized route when locations is changed
        // this will be using AJAX call to Udyssey backend.

        // example
        // var optimizedRoute = [];
        // $.getJson('udysseyApiUrl', function() {...});
        
        // example of rendering route on the map
        // this will be modified to use optimized route
        calcRoute(directionsDisplay1, optimizedRoute.slice(0, 10));

        // since DirectionsRenderer has max 10 locations limit per request,
        // we need to make request every time number of locations is increased by 9
        // still needs better a way to implement this.
        if (optLen > 10 && optLen < 20) {
          console.log("2nd dirDisp");
          console.log(optLen);
          calcRoute(directionsDisplay2, optimizedRoute.slice(9, 19));
        }
        if (optLen > 19 && optLen < 29) {
          console.log("3rd dirDisp");
          console.log(optLen);
          calcRoute(directionsDisplay3, optimizedRoute.slice(18, 28));
        }
        if (optLen > 28 && optLen < 38) {
          console.log("4th dirDisp");
          console.log(optLen);
          calcRoute(directionsDisplay4, optimizedRoute.slice(27, 37));
        }
        if (optLen > 37 && optLen < 47) {
          console.log("5th dirDisp");
          console.log(optLen);
          calcRoute(directionsDisplay5, optimizedRoute.slice(36, 46));
        }
        if (optLen > 46 && optLen < 56) {
          console.log("6th dirDisp");
          console.log(optLen);
          calcRoute(directionsDisplay6, optimizedRoute.slice(45, 55));
        }
      }
    });


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

    // trigger click event to markers when list item is clicked
    self.clickMarker = function(location) {
      locationMarkers.forEach(function(markerSet) {
        if (markerSet.keyword === location.toLowerCase()) {
          google.maps.event.trigger(markerSet.marker, 'click');
          map.panTo(markerSet.position);
        }
      });
    };

    // make tabs more interative and display content accordingly
    self.clickTab = function(vm, event) {
      $('.bottom-line').removeClass('selected');
      $(event.target).siblings().addClass('selected');

      if ($(event.target).text() === 'LOCATIONS') {
        self.locationTab(true);
      } else {
        self.locationTab(false);
      }
    };


    // ==================
    //  Helper functions
    // ==================

    // initialize the app
    function initialize() {
      map = new GoogleMap();
      geocoder = new GoogleMapsGeocoder();
      infowindow = new google.maps.InfoWindow();
      directionsService = new google.maps.DirectionsService();

      initDirectionsRenderers();

      // initialize fixture data
      fixtureLocations.forEach(function(location) {
        requestNewLocation(location);
        self.locations.push(location);
      });
    }

    // initialize DirectionsRenderer objects
    function initDirectionsRenderers() {
      directionsDisplay1 = new google.maps.DirectionsRenderer(directionsDisplayOptions);
      directionsDisplay2 = new google.maps.DirectionsRenderer(directionsDisplayOptions);
      directionsDisplay3 = new google.maps.DirectionsRenderer(directionsDisplayOptions);
      directionsDisplay4 = new google.maps.DirectionsRenderer(directionsDisplayOptions);
      directionsDisplay5 = new google.maps.DirectionsRenderer(directionsDisplayOptions);
      directionsDisplay6 = new google.maps.DirectionsRenderer(directionsDisplayOptions);
      directionsDisplay1.setMap(map);
      directionsDisplay2.setMap(map);
      directionsDisplay3.setMap(map);
      directionsDisplay4.setMap(map);
      directionsDisplay5.setMap(map);
      directionsDisplay6.setMap(map);
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

      // make sure initial markers have no add buttons
      if (fixtureLocations.isSameAs(self.locations()) && fixtureLocations.indexOf(keyword) !== -1) {
        button.style.display = 'none';
      }

      google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(content);
        infowindow.open(map, this);
        map.panTo(position);
      });
    }

    // get routes from DirectionsService and render on the map.
    function calcRoute(dirDisp, routes) {
      var start = routes[0];
      var end = routes[routes.length-1];
      var waypts = [];

      for (var i=1; i < routes.length-1; i++) {
        waypts.push({
          location: routes[i],
          stopover: true
        });
      }

      var request = {
        origin: start,
        destination: end,
        waypoints: waypts,
        optimizeWaypoints: false, // if this is set to true, then waypoints between start and end will be reordered with shortest route
        // unitSystem: UnitSystem.IMPERIAL, // will be interatively toggled by user
        travelMode: google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          console.log(response);
          dirDisp.setDirections(response);
        }
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