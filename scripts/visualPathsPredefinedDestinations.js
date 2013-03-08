var visualPaths_predefinedDestinations = [
	{ 
		from: "Bologna",
		to: "Imola",
		waypoints: [
			{location: new google.maps.LatLng(44.532, 11.200), stopover: false},
			{location: new google.maps.LatLng(44.500, 11.000), stopover: false}
		]
	},{
		from: new google.maps.LatLng(60.3913, 5.3256),
		to: new google.maps.LatLng(60.3894, 5.3308),
		waypoints: [
			{location: new google.maps.LatLng(60.3585, 5.3232), stopover: false}/*,	
			{location: new google.maps.LatLng(60.38793, 5.3284), stopover: false},
			{location: new google.maps.LatLng(60.3884, 5.3292), stopover: false}*/
 		]
	}
];

/*
	returns the predefined destination {from: ..., to: ..., waypoints: ..., }
	if the from and to doesn't match it returns null
*/
function visualPaths_getPredefinedDestination(destForm, destTo) {
	if (/^dest[0-9]+$/ig.test(destForm) && /^dest[0-9]+$/ig.test(destTo)) {
		if (parseInt(/[0-9]+/.exec(destForm)) == parseInt(/[0-9]+/.exec(destTo))) {
			var specifiedId = parseInt(/[0-9]+/.exec(destForm));
			if (specifiedId < visualPaths_predefinedDestinations.length) 
				return(visualPaths_predefinedDestinations[specifiedId]);
		}
	}
	return null;
}