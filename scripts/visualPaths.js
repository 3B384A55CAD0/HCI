visualPaths = {
	/* Constants */
	
	zoom: 18,
	numCircles: 10,
	movementStep: 5,
	useMetres: true,
	moveCameraBoundPercentage: 0.1,
	movementSleep: 200,
	
	/* Globals */
	onFinishCallback: null,
	stepCallback: null,
	paused: false,
	stopped: true,
	useStreetView: false,
	directionsService: null,
	map: null,
	panorama: null,
	polyline: null,
	mapBounds: null,
	circles: new Array(this.numCircles),
	coveredDistance: 0,
	totalDistance: null,
	heading: -Number.MAX_VALUE,
	alpha: 0,
	
	/* Library functions */
	
	rad2deg: function (radiants) {
		return radiants * 180 / Math.PI;
	},
	
	deg2rad: function (degrees) {
		return degrees * Math.PI / 180;
	},
	
	/* Calculate the meters distance of two point given their coords
	 * http://en.wikipedia.org/wiki/Haversine_formula
	 */
	latLngDistance: function (lat1, lng1, lat2, lng2) {
		/* Earth radius in meters 
		 * http://en.wikipedia.org/wiki/Figure_of_the_Earth
		 */
		var R = 6378136.6; 
		var dLat = this.deg2rad(lat2-lat1);
		var dLon = this.deg2rad(lng2-lng1);
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
				Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2));
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		return R * c;
	},
	
	/* Calculate the length of a path in metres */
	pathLength: function (path) {
		var dist = 0;
		for (var i = 0; i < path.getLength() - 1; i++) {
			dist += this.latLngDistance(
				path.getAt(i).lat(), 
				path.getAt(i).lng(), 
				path.getAt(i+1).lat(), 
				path.getAt(i+1).lng()
			);
		}
		return dist;
	},
	
	/* Returns the point in a path that is exactly tot meters distant from the 
	 * beginning of the path itself.
	 * If a negative number of meters is provided the first point of the path is returned.
	 * If the number of meters exceed the length of the path the last point is returned instead. 
	 */
	getPathPointByMetres: function (path, metres) {
		if (metres <= 0) 
			return path.getAt(0);
		
		/* Get the consecutive points P1 and P2 such that the distance of P1 from the beginning of the path
		 * is less that meters and the distance of P2 is greater than meters.
		 */
		var i;
		var dist = new Array(0, 0);
		var p = new Array(null, path.getAt(0));
		
		for (i = 0; (i < path.getLength() - 1) && (dist[1] < metres); i++) {
			dist[0] = dist[1];
			p[0] = p[1];
			dist[1] += this.latLngDistance(
				path.getAt(i).lat(), 
				path.getAt(i).lng(), 
				path.getAt(i+1).lat(), 
				path.getAt(i+1).lng()
			);
			p[1] = path.getAt(i+1);
		}

		if (dist[1] < metres) 
			return path.getAt(path.getLength() - 1);
		
		if (dist[0] == dist[1]) 
			return(p[0]);
			
		/* Calculate the exact position of the point between P1 and P2 at a 
		 * distance of tot meters from the beginning of the path.
		 */
		var m = (metres - dist[1])/(dist[0] - dist[1]);
		return new google.maps.LatLng(
			p[1].lat() + m * (p[0].lat() - p[1].lat()), 
			p[1].lng() + m * (p[0].lng() - p[1].lng())
		);
	},
	
	pointExceedMaximumBoundsDistancePercentage: function (pos, percentage) {
		var mapBounds = this.map.getBounds();
		var swMapBounds = mapBounds.getSouthWest();
		var neMapBounds = mapBounds.getNorthEast();
		var mapBoundsSize = {
			'width':  neMapBounds.lat() - swMapBounds.lat(),
			'height': neMapBounds.lng() - swMapBounds.lng()
		};

		var mapConstrainedBounds = new google.maps.LatLngBounds(
			new google.maps.LatLng(
				swMapBounds.lat() + mapBoundsSize.width  * percentage,
				swMapBounds.lng() + mapBoundsSize.height * percentage
			),
			new google.maps.LatLng(
				neMapBounds.lat() - mapBoundsSize.width  * percentage,
				neMapBounds.lng() - mapBoundsSize.height * percentage
			)
		);
		
		if (!mapConstrainedBounds.contains(pos))
			return true;
			
		return false;
	},
	
	getCurrentPOV: function () {
		var firstCircleCoords = this.circles[0].getCenter();
		var lastCircleCoords  = this.circles[this.numCircles-1].getCenter();
		
		var latDistance = this.latLngDistance(
			lastCircleCoords.lat(), 0, 
			firstCircleCoords.lat(), 0
		);
		var lngDistance = this.latLngDistance(
			0, lastCircleCoords.lng(), 
			0, firstCircleCoords.lng()
		);
		
		if (lastCircleCoords.lat() < firstCircleCoords.lat())
			latDistance *= -1;

		if (lastCircleCoords.lng() < firstCircleCoords.lng())
			lngDistance *= -1;

		return this.rad2deg(Math.atan2(lngDistance, latDistance));
	},
	
	angleDeviation: function (alpha, meters) {		
		return Math.exp(-Math.abs(alpha));
	},
	
	stop: function() {
		this.coveredDistance = 0;
		this.stopped = true;
		this.paused = false;

		/* to move the circles to the fist point */
		this.animatePath();
	},

	pause: function() {
		this.paused = true;
	},

	play: function() {
		this.stopped = false;
		this.paused = false;
		this.animatePath();
	},

	animatePath: function () {
		var oldThis = this;

		/* End iterations if the end of the path is reached */
		if (this.coveredDistance >= this.totalDistance) {
			if(this.onFinishCallback != null && typeof(this.onFinishCallback) != undefined)
				this.onFinishCallback();

			return;
		}

		if (this.paused) 
			return;

		if (this.stopped)
			this.coveredDistance = 0;

		/* Retrive current position */
		if (this.useMetres)
			var pos = this.getPathPointByMetres(this.polyline.getPath(), this.coveredDistance);
		else
			var pos = this.polyline.getPath().getAt(this.coveredDistance);
		
		/* Move map if current position is too near to map bounds */
		if (this.pointExceedMaximumBoundsDistancePercentage(pos, this.moveCameraBoundPercentage))
			this.map.panTo(pos);
		
		/* Update circles positions */
		for (j = 0; j < this.numCircles - 1; j++) {
			this.circles[j].setCenter(this.circles[j+1].getCenter());
		}
		this.circles[this.numCircles-1].setCenter(pos);
		
		if (this.useStreetView) {
			/* Update street-view position */
			this.panorama.setPosition(pos);
			
			/* Use circles positions to retrive current stree-view point of view 
			 * and update pov if it is changed of at least 2 degrees 
			 * 
			 * NOTE: just to avoid image shakings. 
			 */
			var newHeading = this.getCurrentPOV();
			if (Math.abs(newHeading - this.heading) > 2){
				this.heading = newHeading;
				this.panorama.setPov({
					heading: this.heading,
					pitch: 0,
					zoom: 1
				});
			}
		}
		
		/* Update covered distance by going faster on straight 
		 * streets and slower on turns.
		 */
		
		var alpha = this.alpha;
		var newAlpha = this.getCurrentPOV();
		var speed = this.movementStep * this.angleDeviation(newAlpha - alpha);
		this.alpha = newAlpha;

		if (this.useStreetView) {
			this.coveredDistance += speed;
		} else {
			this.coveredDistance += this.movementStep;
		}

		/* Loop back again */
		var sleepTime;
		
		if (this.useStreetView)
			sleepTime = Math.min(500, this.movementSleep / this.angleDeviation(newAlpha - alpha));
		else
			sleepTime = this.movementSleep;
		
		if(this.stepCallback != null && typeof(this.stepCallback) != undefined) 
			this.stepCallback();

		if (this.stopped) {
			for (j=0; j < this.numCircles; j++) this.circles[j].setCenter(pos);
		} else {
			setTimeout(function () { oldThis.animatePath(); }, sleepTime);
		}
	},

	/* User callable functions */
	
	init: function (canvas, useStreetView, stepCallback, onFinishCallback) {
		/* Initialize direction service to retrive routing informations */
		this.directionsService = new google.maps.DirectionsService();

		this.useStreetView = useStreetView;
		this.stepCallback = stepCallback;
		this.onFinishCallback = onFinishCallback;

		/* Initialize circles on the map with decreasing radius size */
		for (var i = 0; i < this.numCircles; i++) {
			this.circles[i] = new google.maps.Circle({
				fillColor: "#FF0000",
				strokeColor: "#FF0000",
				fillOpacity: 0.35,
				strokeOpacity: 0.8,
				strokeWeight: 1,
				center: new google.maps.LatLng(44.496, 11.338),
				radius: i/2
			});
		}

		/* Initialize polyline used to manage routing 
		 * points and to show current path 
		 */
		this.polyline = new google.maps.Polyline({
			path : [],
			strokeColor : '#00FF00',
			strokeWeight : 2
		});

		/* Initialize map and link it to desired dom element */
		this.map = new google.maps.Map(canvas, {
			center: new google.maps.LatLng(44.496, 11.338),
			zoom: this.zoom,
			mapTypeId: google.maps.MapTypeId.HYBRID
		});
		
		if(this.useStreetView){
			/* Initialize street-view map and link it to desired dom element */
			this.panorama = new  google.maps.StreetViewPanorama(canvas, {
				position: new google.maps.LatLng(44.496, 11.338),
				pov: {
					heading: 0,
					pitch: 0,
					zoom: 1
				}
			});

			/* Link street-view to current map */
			this.map.setStreetView(this.panorama);
		}

		if (!this.useMetres) this.movementStep = 1;
		
		//~ google.maps.event.addListener(panorama, 'pano_changed', function() {
			//~ console.log('pano changed');
			//map.setZoom(8);
			//map.setCenter(marker.getPosition());
		//~ });

		
	},
	
	calculateRoute: function (origin, destination, waypoints, callback) {
		var request = {
			origin : origin,
			destination : destination,
			travelMode : google.maps.DirectionsTravelMode.DRIVING,
			waypoints : waypoints
		};
		
		oldThis = this;
		
		this.directionsService.route(request, function (response, status) {
			/* If a route is successfully retrived */
			if (status == google.maps.DirectionsStatus.OK) {
				
				/* Retrive first possible route */
				var legs = response.routes[0].legs;

				oldThis.polyline.setPath(new Array());
				
				/* Add points in retrived route to polyline */
				for (var i in legs){
					var steps = legs[i].steps;
					for (var j in steps){
						var points = steps[j].path;
						for (var k in points){
							oldThis.polyline.getPath().push(points[k]);
						}
					}
				}

				if(!oldThis.useStreetView) oldThis.polyline.setMap(oldThis.map);

				/* Retrive total distance of the path */
				if (oldThis.useMetres)
					oldThis.totalDistance = oldThis.pathLength(oldThis.polyline.getPath());
				else
					oldThis.totalDistance = oldThis.polyline.getPath().length;

				oldThis.coveredDistance = 0;

				/* Get starting point of the path */
				var initialPoint = oldThis.polyline.getPath().getAt(0);
				
				/* Center map on starting point of the path */
				oldThis.map.panTo(initialPoint);
				
				/* Draw circles on the map on the starting point */
				for(i=0; i < oldThis.numCircles; i++){
					if(!oldThis.useStreetView) oldThis.circles[i].setMap(oldThis.map);
					oldThis.circles[i].setCenter(initialPoint);
				}

				if(callback != null && typeof(callback) != undefined) callback(true);
			}else{
				if(callback != null && typeof(callback) != undefined) callback(false);
			}
		});
	}
};
