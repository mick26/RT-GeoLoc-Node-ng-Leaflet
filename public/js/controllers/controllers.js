/*

Ref.
https://www.mapbox.com/mapbox.js/example/v1.0.0/disable-world-wrapping/
http://thunderforest.com/tutorials/leaflet/

http://thunderforest.com/tutorials/tile-format/
Map Tiles
{z}/{x}/{y}.png, 
where z is zoom, 
x is the tile number from left to right, 
and y is the tile number from top to bottom. 
For example, the solitary tile on zoom 0 is named 0/0/0.png


*/
'use strict';

/*================================================
Module - for Controllers
================================================ */
angular.module('myApp.controllers', [])


/*================================================
Controller
================================================ */
.controller('MainCtrl', function ($scope, $rootScope, $http, $location, socket) {

	/*
	 * create Date Object
	 * Date.now() returns the number of milliseconds elapsed since 1 January 1970 00:00:00 UTC.
	 */
	$scope.date = new Date();	

	/*
	 * Declare variables
	 */
	var map;
	var info = $scope.infobox="";
	var info = $scope.infobox;
	var sentData = {};
	var connects = {}; //other users on map
	var markers = {};
	var active = false;
	var emit;
	$scope.errorMsg="";


	/*
	 * Generate unique user id
	 */
	var userId = Math.random().toString(16).substring(2,15);


	/*
	 * custom marker's icon styles
	 */
	var tinyIcon = L.Icon.extend({
		options: {
			shadowUrl: '../assets/marker-shadow.png',
			iconSize: [25, 39],
			iconAnchor:   [12, 36],
			shadowSize: [41, 41],
			shadowAnchor: [12, 38],
			popupAnchor: [0, -30]
		}
	});


	/*
	 * Icons - yellow and red
	 */
	var redIcon = new tinyIcon({ iconUrl: '../assets/marker-red.png' });  //new user
	var yellowIcon = new tinyIcon({ iconUrl: '../assets/marker-yellow.png' }); 


   	/*
   	 * Recieved coordinates from Node server
   	 * When a new user connects Node broadcasts the users coords to all users except the new user
   	 * An example Node socket broadcast is:
  	 * load:coords data= {"id":"1e0933d755851","active":true,"coords":[{"lat":50.2.,"lng":-7.2,"acr":0}]}
   	 */
	socket.on('load:coords', function(data) {
		
		/*
		 * Existing user - we have stored its loc details already in connects{} Object
		 */
		if (!(data.id in connects)) {
			setMarker(data);
		}

		/*
		 * A new user 
		 * - we Do Not have the user stored in connects{} Object
		 */
		connects[data.id] = data; //Add user to object
		
		//console.log("connects = "+JSON.stringify(connects)); //TEST
		/*
		 * Add timestamp to data Object
		 * data ={"id":"48614f75b1fa2","active":true,"coords":[{"lat":50.2.,"lng":-7.2,"acr":0}],"updated":1415195059693}
		 */
		connects[data.id].updated = Date.now();

		/*
		 An example of the connects object
		 connects = {
		 	"fa7cac44":{"id":"fa7cac44","active":true,"coords":[{"lat":50.2.,"lng":-7.2,"acr":0}],"updated":1415197515003},
		 	"2d41e88":{"id":"2d41e88","active":true,"coords":[{"lat":50.2.,"lng":-7.2,"acr":0}],"updated":1415197529048},
		 	"bd3e6247":{"id":"bd3e6247","active":true,"coords":[{"lat":50.2.,"lng":-7.2,"acr":0}]}}
		*/
	});


	/*
	 * check browser support for HTML5 GeoLocation API
	 */
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
	} 
	else {
		$scope.errorMsg = 'Your browser does not support GeoLocation!';
	}


	/*********************************************
	 * GeoLocation was got - successCallback 
	 *********************************************/
	function positionSuccess(position) {
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;
		var acr = position.coords.accuracy;

		/*
		 * mark user's position with a Red icon
		 */
		var userMarker = L.marker([lat, lng], {
			icon: redIcon
		});

		/*
		 * uncomment for testing
		 * lets you show another marker on the map at a different location
		 */
		//userMarker = L.marker([51.4, 30.0], { icon: redIcon });


		/*
		 * load Leaflet map
		 */
		map = L.map('map');

		/*
		 * Create a new tile layer
		 */
		L.tileLayer('https://{s}.tiles.mapbox.com/v3/examples.map-i87786ca/{z}/{x}/{y}.png', { maxZoom: 18, detectRetina: true, noWrap: true }).addTo(map);


		/*
		 * set map bounds
		 */
		map.fitWorld();
		userMarker.addTo(map);
		userMarker.bindPopup('<p>You are there! Your ID is ' + userId + '</p>').openPopup();



	    /*
	     * This is another Map option that Works 
	     * Adding a Thunderforest map layer
	     */
		/*
	    var tileUrl = 'http://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png',
	    layer = new L.TileLayer(tileUrl, {
			    	maxZoom: 18,         
			        // This option disables loading tiles outside of the world bounds.
			        noWrap: true
			    }
		);
		*/


		/*
		 * variable to hold the date
		 * needed to calculate 
		 */
		emit = Date.now();

	  	/*
		 * A user is active when the mouse is moving over the map area
		 * If Active then send coords
		 */
		$scope.mouseMoveAction = function() {

			active = true;

			sentData = {
				id: userId,
				active: active,
				coords: [{
					lat: lat,
					lng: lng,
					acr: acr
				}]
			};

			/*
			 * if more that30ms
			 */
			if (Date.now() - emit > 30) {
				socket.emit('send:coords', sentData);
				emit = Date.now();
			}
		};
	}


	/*
	 * User Not Active on map 
	 */

	$scope.mouseLeaveAction=function() {
		active = false;
	};



	/*
	 * showing markers for connections
	 */
	function setMarker(data) {
		for (var i = 0; i < data.coords.length; i++) {
			var marker = L.marker([data.coords[i].lat, data.coords[i].lng], { icon: yellowIcon }).addTo(map);
			marker.bindPopup('<p>One more external user is here!</p>');
			markers[data.id] = marker;
		}
	};



	/*********************************************
	 * GeoLocation was NOT got - errorCallback 
	 * - handle geolocation api errors
	 *********************************************/
	function positionError(error) {
		var errors = {
			1: 'Authorization fails', // permission denied
			2: 'Can\'t detect your location', //position unavailable
			3: 'Connection timeout' // timeout
		};

		//Create the error message string that will be displayed
		$scope.errorMsg = "Error:" + errors[error.code];
	};




	/*
	 * Delete inactive users every 15 sec
	 */
	setInterval(function() {
		for (var ident in connects) {

			if (Date.now() - connects[ident].updated > 15000) {
				delete connects[ident];
				map.removeLayer(markers[ident]);
			}
		}
	}, 15000);

});
