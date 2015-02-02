/*
 * A bunch of generic reusable functions for AVOS functionality
 *
 * Copyright (c) 2015 Cisco Systems 
 *   Alex Holden <ajonasho@cisco.com>
 *
 */

function randBetween(low, high) {
	return Math.floor(Math.random() * high) + low;
}

function cleanArrayItems(array, key) {
	if (!key) {key = "id"}
	var object = {}
	for (var i in array) {
		object[array[i][key]] = array[i];
	}
	return object;
}

/**
 * Returns a new random resource ID
 * @return {[type]} [description]
 */
function inventResourceID() {
	function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

/**
 * Master function to pull data from the server
 * @param  {Function} callback [What to do to the data when it is returned]
 * @param  {[String]}   param    [The query to send to the server]
 */
function getOpenStackData(callback, param) {
	// console.log("we did it!")
	 $.ajax({
		url: window.location + "?" + param + "=true",
		dataType: "json",
		type: "GET",
		success: function(data, textStatus) {
			callback(data);
		},
	})
}
