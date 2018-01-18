var defaultIcon;
var highlightedIcon;

var makeMarkerIcon;
var addMarkersToMap = function () {};

var slideout = new Slideout({
	'panel': document.getElementById('panel'),
	'menu': document.getElementById('menu'),
	'padding': 256,
	'tolerance': 70
});

// Toggle button
document.querySelector('.toggle-button').addEventListener('click', function () {
	slideout.toggle();
});

function mapError() {
	$('header').append('<h1>Error Connecting To Google Maps. Please Check Your Internet Connection and Try Again.</h1>');
}

function initMap() {
	var CLIENT_ID = 'MIMRUUHMV0OQBFETX21GR3ZMR4GW3KPZ0M21BQVWARUEI2BQ';
	var CLIENT_SECRET = 'MOPXMPW0IIPSFMHLKQ33OH14GHJRTS4GSXKWS1WZBIPYUOEC';
	var API_ENDPOINT = 'https://api.foursquare.com/v2/venues/explore' +
		'?ll=41.946,-87.727' +
		'&client_id=' + CLIENT_ID +
		'&client_secret=' + CLIENT_SECRET +
		'&v=20171004' +
		'&limit=30';

	makeMarkerIcon = function (markerColor) {
		var markerImage = new google.maps.MarkerImage(
			'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
			'|40|_|%E2%80%A2',
			new google.maps.Size(21, 34),
			new google.maps.Point(0, 0),
			new google.maps.Point(10, 34),
			new google.maps.Size(21, 34));
		return markerImage;
	};

	defaultIcon = makeMarkerIcon('0091ff');
	highlightedIcon = makeMarkerIcon('FFFF24');
	var largeInfoWindow = new google.maps.InfoWindow();

	addMarkersToMap = function (arrayOfLocations) {
		var bounds = new google.maps.LatLngBounds();

		var underlying = appViewModel.locationArray();

		var length = arrayOfLocations.length;


		for (var j = 0; j < length; j++) {

			// Get the position from the location array.
			var position = arrayOfLocations[j].location;
			var title = arrayOfLocations[j].name;
			var addr = arrayOfLocations[j].address;
			var cat = arrayOfLocations[j].category;

			// Create a marker per location, and put into markers array.
			var marker = new google.maps.Marker({
				map: appViewModel.map,
				position: position,
				title: title,
				address: addr,
				category: cat,
				animation: google.maps.Animation.DROP,
				icon: defaultIcon,
				id: j
			});
			// Push the marker to our array of markers.
			appViewModel.markers.push(marker);
			// Create an onclick event to open an infowindow at each marker.
			/* jshint ignore:start */
			marker.addListener('click', function () {
				//this.setIcon(highlightedIcon);
				appViewModel.populateInfoWindow(this, largeInfoWindow);
			});
			/* jshint ignore:end */
			bounds.extend(appViewModel.markers[j].position);
			appViewModel.map.fitBounds(bounds);

		}
	};


	appViewModel.map = new google.maps.Map(document.getElementById('map'), {
		center: {
			lat: -41,
			lng: 82
		},
		zoom: 13
	});


	//Ajax call to foursquare endpoint
	$.ajax({
		url: API_ENDPOINT,
		crossDomain: true,
		dataType: 'jsonp',
		success: function (data) {
			//loop through returned data and extract needed points.

			for (var i = 0; i < data.response.groups[0].items.length; i++) {
				var name = data.response.groups[0].items[i].venue.name;
				var location = {
					lat: data.response.groups[0].items[i].venue.location.lat,
					lng: data.response.groups[0].items[i].venue.location.lng
				};
				var rating = data.response.groups[0].items[i].venue.rating;
				var address = data.response.groups[0].items[i].venue.location.address;
				var category = data.response.groups[0].items[i].venue.categories[0].name;
				var locationObject = {};

				//Using name, location and rating right now.
				locationObject.name = name;
				locationObject.location = location;
				locationObject.rating = rating;
				locationObject.address = address;
				locationObject.category = category;
				appViewModel.locationArray.push(locationObject);
			}

			addMarkersToMap(appViewModel.locationArray());


		},
		error: function (e) {
			$('#menu').append('<h1>Please Check Your Internet Connection And Try Again!</h1>');
		}

	});

}


var openInfoWindow = function (data) {
	var largeInfoWindow = new google.maps.InfoWindow();


	for (var k = 0; k < appViewModel.markers.length; k++) {

		if (appViewModel.markers[k].title === data.name) {
			appViewModel.populateInfoWindow(appViewModel.markers[k], largeInfoWindow);
		}

	}

};

function AppViewModel() {
	var self = this;

	//observable array
	self.locationArray = ko.observableArray();
	self.currentFilter = ko.observable("");
	self.map;
	self.markers = [];
	self.largeInfoWindow;
	var underlying = self.locationArray();


	/**
	 * Filter function, return filtered food by
	 * matching with user's keyword
	 */
	self.filterList = ko.computed(() => {
		if (!this.currentFilter()) {

			// No input found, return all food
			if (typeof appViewModel != 'undefined') {
				if (appViewModel.markers.length > 0) {
					deleteMarkers();
					addMarkersToMap(this.locationArray());
				}
			}
			return this.locationArray();
		} else {
			// input found, match keyword to filter

			var temp = ko.utils.arrayFilter(this.locationArray(), (location) => {

				return location.name.toLowerCase().indexOf(this.currentFilter().toLowerCase()) !== -1;
			});
			deleteMarkers();

			addMarkersToMap(temp);


			return temp;
		} //.conditional
	});


	// This function populates the infowindow when the marker is clicked. We'll only allow
	// one infowindow which will open at the marker that is clicked, and populate based
	// on that markers position.
	self.populateInfoWindow = function (marker, infowindow) {
		marker.setIcon(highlightedIcon);
		if (infowindow.marker != marker) {
			infowindow.marker = marker;
			infowindow.setContent('<div>' + marker.title + '<br>' + marker.address + '<br>' + marker.category + '</div>');
			infowindow.open(this.map, marker);
			// Make sure the marker property is cleared if the infowindow is closed.
			infowindow.addListener('closeclick', function () {
				marker.setIcon(defaultIcon);
				infowindow.setMarker = null;
			});
		}
	};

	var deleteMarkers = function () {
		//Loop through all the markers and remove

		for (var i = 0; i < self.markers.length; i++) {
			self.markers[i].setMap(null);
		}
		self.markers = [];
	};


}

var appViewModel = new AppViewModel();

ko.applyBindings(appViewModel);