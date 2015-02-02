/*
 * A bunch of generic reusable functions for AVOS functionality
 *
 * Copyright (c) 2014 Cisco Systems 
 *   Alex Holden <a@lexholden.com> <ajonasho@cisco.com>
 *
 */

function randBetween(low, high) {
	return Math.floor(Math.random() * high) + low;
}

function generateRandomWord() {
	return word[Math.floor(Math.random() * word.length)];
}

function formatSizeUnits(bytes){
	bytes = bytes / 8
  if      (bytes>=1073741824) {bytes=(bytes/1073741824).toFixed(2)+' GB';}
  else if (bytes>=1048576)    {bytes=(bytes/1048576).toFixed(2)+' MB';}
  else if (bytes>=1024)       {bytes=(bytes/1024).toFixed(2)+' KB';}
  else if (bytes>1)           {bytes=bytes+' bytes';}
  else if (bytes==1)          {bytes=bytes+' byte';}
  else                        {bytes='0 byte';}
  return bytes;
}

/**
 * Converts a date into a sting of the length of time from the current date in the form of "xd yh zm"
 * where x is the number of days, y is the number of hours, and z is the number of minutes.
 *
 * @param  	createdOn	 The date to be used in calculation.
 */
function calculateUptime(createdOn) {
	uptimeMili = (new Date().getTime()) - (new Date(createdOn).getTime());
	uptimeDays = Math.floor(uptimeMili / 60000 / 60 / 24)
	uptimeHours = Math.floor(uptimeMili/60000/60)-uptimeDays*24;
	uptimeMins = Math.floor(uptimeMili/60000)-(((uptimeDays*24)+uptimeHours)*60);
	if (uptimeDays == 0) {
		if (uptimeHours == 0) {
			uptimeString = uptimeMins + "m";
		}
		else {
			uptimeString = uptimeHours + "h " + uptimeMins + "m";
		}
	}
	else {
		uptimeString = uptimeDays + "d " + uptimeHours + "h " + uptimeMins + "m";
	}	
	return uptimeString;
}

function generateRandomString() {
	var length = randbetween(3, 9);
	var string = "";

	for (var i = 0; i < length; i++) {
		string = string + "-" + generateRandomWord() ;
	}

	return string;
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
 *	One function to clean up unecessary data and return it in a format where the key is ID
 *
 *	@param data		A string formatted JSON with an odd key, and an ID somewhere within.
 *	@return 		a cleaned up JSON Object
 */
function cleanJsonByID(data) {
	// @TODO is this ever used?
	var t = JSON.parse(data);
	var title = Object.keys(t);
	t = t[title];

	var x = {}
	for (i = 0; i < t.length; i++) {
		x[t[i]["id"]] = t[i];
	}
	return x;
}

/**
 * Returns a new random resource ID
 * @return {[type]} [description]
 */
function inventResourceID() {
	function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function normalRandom(mean, variance) {
  if (mean == undefined)
    mean = 0.0;
  if (variance == undefined)
    variance = 1.0;
  var V1, V2, S;
  do {
    var U1 = Math.random();
    var U2 = Math.random();
    V1 = 2 * U1 - 1;
    V2 = 2 * U2 - 1;
    S = V1 * V1 + V2 * V2;
  } while (S > 1);

  X = Math.sqrt(-2 * Math.log(S) / S) * V1;
//Y = Math.sqrt(-2 * Math.log(S) / S) * V2;
  X = mean + Math.sqrt(variance) * X;
//Y = mean + Math.sqrt(variance) * Y ;
  return X;
}

function getRandomColor() {
  return '#'+Math.floor(Math.random()*16777215).toString(16);
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
