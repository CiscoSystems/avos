/*
 * A bunch of generic reusable functions for AVOS functionality
 *
 * Copyright (c) 2014 Cisco Systems 
 *   Alex Holden <a@lexholden.com> <ajonasho@cisco.com>
 *
 */

var words = "Lorem ipsum dolor sit amet consectetur adipisicing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum"
var word = words.split(' ');
var offsetx = 18;
var offsety = 18;

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

/**
 *	Prints the data set for whatever calls it
 */
function printthis() {
	console.log(this);
}

/**
 *	Console.log cannot be used as a callback, so we use this function instead.
 *
 *	@param str		String to print
 */
function print(str) {
	console.log(JSON.parse(str));
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

function addDummyImages() {

	for (var i in imageList) {
		var image_id = inventResourceID();
		clusterdata["images"][image_id] = getStructure(image_id, imageList[i]);
	}

	function getStructure(id, name) {
		return {"status":"ACTIVE","updated":"2014-05-02T21:39:06Z","name":name,"links":[{"href":"http://us-texas-1.cisco.com:8774/v2/72cdf4b772444f55bdbf7b050021f628/images/4ceaf1e6-69bb-49ad-8f15-a30f3dc4004b","rel":"self"},{"href":"http://us-texas-1.cisco.com:8774/72cdf4b772444f55bdbf7b050021f628/images/4ceaf1e6-69bb-49ad-8f15-a30f3dc4004b","rel":"bookmark"},{"href":"http://10.202.4.8:9292/72cdf4b772444f55bdbf7b050021f628/images/4ceaf1e6-69bb-49ad-8f15-a30f3dc4004b","type":"application/vnd.openstack.image","rel":"alternate"}],"created":"2014-05-02T21:25:48Z","minDisk":0,"progress":100,"minRam":0,"metadata":{},"id":id,"OS-EXT-IMG-SIZE:size":1033895936}
	}
}

/**
 * Create a network of components randomly for testing
 * @param  {[int]} size [The approximate size of the cluster to create (in VMs)]
 */
function createRandomCluster(size) {

	var pubnetwork_id = inventResourceID();
	var pubnetwork_name = "publicnetwork-" + pubnetwork_id;
	clusterdata["neutronnetwork"][pubnetwork_id] = {"admin_state_up": true, "id": pubnetwork_id, "name": pubnetwork_name, "router:external": true, "shared": false, "status": "ACTIVE", "subnets": ["12345"], "tenant_id": "72cdf4b772444f55bdbf7b050021f628" };
	addNetworkToDash(pubnetwork_id);

	var image_ids = Object.keys(clusterdata["images"])
	var first = true;
	// Create a public network
	while (size > 0) {


		var network_id = inventResourceID();
		//console.log(network_id)
		var network_name = "network-" + network_id;
		clusterdata["neutronnetwork"][network_id] = {"admin_state_up": true, "id": network_id, "name": network_name, "router:external": false, "shared": false, "status": "ACTIVE", "subnets": ["12345"], "tenant_id": "72cdf4b772444f55bdbf7b050021f628" };
		addNetworkToDash(network_id);

		if (Math.random() > 0.5 || first == true) {
			router_id = inventResourceID();
			var router_name = "router-" + router_id;
			clusterdata["routers"][router_id] = {"status":"ACTIVE","external_gateway_info":{"network_id": pubnetwork_id,"enable_snat":true},"name": router_name,"admin_state_up":true,"tenant_id":"72cdf4b772444f55bdbf7b050021f628","routes":[],"id": router_id}
			var pubport_id = inventResourceID();
			clusterdata["ports"][pubport_id] = {"status":"ACTIVE","name":"","allowed_address_pairs":[],"admin_state_up":true,"network_id":pubnetwork_id,"tenant_id":"72cdf4b772444f55bdbf7b050021f628","extra_dhcp_opts":[],"device_owner":"network:router_interface","mac_address":"fa:16:3e:e1:e2:37","fixed_ips":[{"subnet_id":"a43db26b-925f-4ff9-a3be-9ce1a95ef191","ip_address":"192.168.20.1"}],"id":pubport_id,"security_groups":["2d615edb-266e-40ac-b7ea-e5436915b25c"],"device_id": router_id};
			addRouterToDash(router_id)
			first = false;
		}

		port_id = inventResourceID();
		clusterdata["ports"]["port_id"] = {"status":"ACTIVE","name":"","allowed_address_pairs":[],"admin_state_up":true,"network_id":network_id,"tenant_id":"72cdf4b772444f55bdbf7b050021f628","extra_dhcp_opts":[],"device_owner":"network:router_interface","mac_address":"fa:16:3e:e1:e2:37","fixed_ips":[{"subnet_id":"a43db26b-925f-4ff9-a3be-9ce1a95ef191","ip_address":"192.168.20.1"}],"id":port_id,"security_groups":["2d615edb-266e-40ac-b7ea-e5436915b25c"],"device_id": router_id};

		addLinkToForceGraph(router_id, network_id);


		var image = image_ids[Math.floor(Math.random() * image_ids.length)];
		for (var i = Math.random() * 12 + 3; i > 0; i --) {
			var instance_id = inventResourceID();
			var instance_name = "inst" + generateRandomString();
			clusterdata["servers"][instance_id] = {"OS-EXT-STS:task_state":null,"addresses":{},"links":[{"href":"http://us-texas-1.cisco.com:8774/v2/72cdf4b772444f55bdbf7b050021f628/servers/1e3c47f1-7275-4af4-b362-e527171f6b84","rel":"self"},{"href":"http://us-texas-1.cisco.com:8774/72cdf4b772444f55bdbf7b050021f628/servers/1e3c47f1-7275-4af4-b362-e527171f6b84","rel":"bookmark"}],"image":{"id":image,"links":[{"href":"http://us-texas-1.cisco.com:8774/72cdf4b772444f55bdbf7b050021f628/images/4ceaf1e6-69bb-49ad-8f15-a30f3dc4004b","rel":"bookmark"}]},"OS-EXT-STS:vm_state":"active","OS-SRV-USG:launched_at":"2014-05-16T18:57:07.000000","flavor":{"id":1,"links":[{"href":"http://us-texas-1.cisco.com:8774/72cdf4b772444f55bdbf7b050021f628/flavors/b4839a95-fed5-4198-bfd1-0d4105044e69","rel":"bookmark"}]},"id":instance_id,"security_groups":[{"name":"default"},{"name":"elasticsearch"}],"user_id":"d7776f89e40942bb9ec675cb9e26e52f","OS-DCF:diskConfig":"MANUAL","accessIPv4":"","accessIPv6":"","progress":0,"OS-EXT-STS:power_state":1,"OS-EXT-AZ:availability_zone":"alln01-1-csx","config_drive":"","status":"ACTIVE","updated":"2014-05-16T18:57:07Z","hostId":"a68025b956ba8e07af877f6c49443d304d2ee959aaafa7e3d55fb2d3","OS-SRV-USG:terminated_at":null,"key_name":"throwaway","name": instance_name,"created":"2014-05-16T18:56:59Z","tenant_id":"72cdf4b772444f55bdbf7b050021f628","os-extended-volumes:volumes_attached":[{"id":"83b95885-8798-4ee1-9e6c-d3291a889428"}],"metadata":{}}
			clusterdata["servers"][instance_id]["addresses"][network_name] = [{"OS-EXT-IPS-MAC:mac_addr":"fa:16:3e:68:d6:35","version":4,"addr":"192.168.20.19","OS-EXT-IPS:type":"fixed"}];
			addServerToDash(instance_id)
			size --;
			if (Math.random() > 0.3) {
				for (var j = Math.random() * 5; j > 1; j--) {
					var volume_id = inventResourceID();
					var volume_name = "vol-" + volume_id;
					clusterdata["volumes"][volume_id] = {"status":"in-use","name":volume_name,"display_name": volume_name,"attachments":[{"device":"vda","server_id":instance_id,"volume_id":volume_id,"host_name":null,"id": volume_id}],"availability_zone":"nova","bootable":"true","created_at":"2014-05-16T18:47:04.000000","display_description":null,"volume_type":"None","snapshot_id":null,"source_volid":null,"size":50,"id": volume_id,"metadata":{"readonly":"False","attached_mode":"rw"}}
					addVolumeToDash(volume_id);
				}
			}
			
		}
	}
}

/**
 * Simple function to create a random cluster, for testing
 * @param  {[int]} size [The number of instances to create (roughly)]
 */
function developerMode(size) {
	//plot_heatmap = false;
	addDummyImages();
	createRandomCluster(size);
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
 *	showOptions
 *
 *	Pass a layout-options object, and the pane/key you want to display
 */
function showOptions (Layout, key, debugOpts) {
	var data = Layout.options;
	$.each(key.split("."), function() {
		data = data[this]; // recurse through multiple key-levels
	});
	debugData( data, 'options.'+key, debugOpts );
}

var waitForFinalEvent = (function () {
  var timers = {};
  return function (callback, ms, uniqueId) {
	if (!uniqueId) {
	  uniqueId = "Don't call this twice without a uniqueId";
	}
	if (timers[uniqueId]) {
	  clearTimeout (timers[uniqueId]);
	}
	timers[uniqueId] = setTimeout(callback, ms);
  };
})();

/**
 *	toggle whether the split panes resize live. Enabled except for debugging.
 *
 */
function toggleLiveResizing () {
	$.each( $.layout.config.borderPanes, function (i, pane) {
		var o = myLayout.options[ pane ];
		o.livePaneResizing = !o.livePaneResizing;
	});
}
	
function toggleStateManagement ( skipAlert, mode ) {
	if (!$.layout.plugins.stateManagement) return;

	var options	= myLayout.options.stateManagement,
		enabled	= options.enabled; // current setting
	if ($.type( mode ) === "boolean") {
		if (enabled === mode) return; // already correct
		enabled	= options.enabled = mode
	}
	else
		enabled	= options.enabled = !enabled; // toggle option

	if (!enabled) { // if disabling state management...
		myLayout.deleteCookie(); // ...clear cookie so will NOT be found on next refresh
		if (!skipAlert)
			alert( 'This layout will reload as the options specify \nwhen the page is refreshed.' );
	}
	else if (!skipAlert)
		alert( 'This layout will save & restore its last state \nwhen the page is refreshed.' );
}

function loadPaneLayout() {
	// @TODO: Perhaps these could be better styled to have obvious "Pin Open" Buttons where needed

	// this layout could be created with NO OPTIONS - but showing some here just as a sample...
	myLayout = $('.ui-layout-container').layout({

		//	reference only - these options are NOT required because 'true' is the default
		closable:							true,	// pane can open & close
		resizable:							true,	// when open, pane can be resized 
		slidable:							true,	// when closed, pane can 'slide' open over other panes - closes on mouse-out
		livePaneResizing:					true,
		north__showOverflowOnHover: 		false, 		

		// some resizing/toggling settings
		north__togglerLength_closed: '20%',	// toggle-button is full-width of resizer-bar
		north__spacing_closed:		5,		// big resizer-bar when open (zero height)
		north__spacing_open:		5,
		south__resizable:			false,	// OVERRIDE the pane-default of 'resizable=true'
		south__spacing_open:		0,		// no resizer-bar when open (zero height)
		south__spacing_closed:		20,		// big resizer-bar when open (zero height)
		east__initClosed:			true,
		west__initClosed:			true,
		south__initHidden:			true,
		north__initClosed:			true,

		//	some pane-size settings
		north__minSize:				30,
		north__size: 				102, 
		west__minSize:				100,
		west__size: 				300, 
		east__size:					300,
		east__minSize:				300,
		east__maxSize:				.5, // 50% of layout width
		center__minWidth:			100,

		//	some pane animation settings
		west__animatePaneSizing:	true,
		west__fxSpeed_size:			"fast",	// 'fast' animation when resizing west-pane
		west__fxSpeed_open:			1000,	// 1-second animation when opening west-pane
		//west__fxSettings_open:		{ easing: "easeOutBounce" }, // 'bounce' effect when opening
		west__fxName_close:			"none",	// NO animation when closing west-pane

		//	enable showOverflow on west-pane so CSS popups will overlap north pane
		west__showOverflowOnHover:	false,
		west__onclose: closeSearch, 

		//	enable state management
		stateManagement__enabled:	true, // automatic cookie load & save enabled by default
		showDebugMessages:			true // log and/or display messages from debugging & testing code
	});

	// if there is no state-cookie, then DISABLE state management initially
	var cookieExists = !$.isEmptyObject( myLayout.readCookie() );
	if (!cookieExists) { toggleStateManagement( true, false );}
	// 'Reset State' button requires updated functionality in rc29.15+
	if ($.layout.revision && $.layout.revision >= 0.032915) { $('#btnReset').show(); }

	$('pane-east').css('display', 'block');
}

/**
 *	showState
 *
 *	Pass a layout-options object, and the pane/key you want to display
 */
function showState (Layout, key, debugOpts) {
	var data = Layout.state;
	$.each(key.split("."), function() {
		data = data[this]; // recurse through multiple key-levels
	});
	debugData( data, 'state.'+key, debugOpts );
}

// set EVERY 'state' here so will undo ALL layout changes
// used by the 'Reset State' button: myLayout.loadState( stateResetSettings )
var stateResetSettings = {
	north__size:		"auto",
	north__initClosed:	false,
	north__initHidden:	false,
	south__size:		"auto",
	south__initClosed:	false,
	south__initHidden:	false,
	west__size:			200,
	west__initClosed:	false,
	west__initHidden:	false,
	east__size:			300,
	east__initClosed:	false,
	east__initHidden:	true
};

/**
 * Master function to pull data from the server
 * @param  {Function} callback [What to do to the data when it is returned]
 * @param  {[String]}   param    [The query to send to the server]
 */
function getOpenStackData(callback, param) {
	 $.ajax({
		url: window.location + "?" + param + "=true",
		dataType: "json",
		type: "GET",
		success: function(data, textStatus) {
			callback(data);
		},
	})
}

var myLayout;

/**
 *	Loads the help screen content to the modal box
 */
function loadSettings() {
	$("#myModalLabel").html("AVOS Settings");
	$("#myModalBody").html("Here are some settings to customize your experience");
}

/**
 *	Loads the help screen content to the modal box
 *
 */
function loadHelp() {
	$("#myModalLabel").html("Help (?)");

	var content = "";

	content += "Welcome to AVOS (Advanced Visualisation on OpenStack) <br/> There's a lot of functionality here, so here's some help to get you started!<hr />"
	content += "<svg width='800' height='300'>"

		content += "<rect width='275' height='130' style='fill:rgb(245,245,245)'></rect>"
		content += "<circle r='25' stroke-width='0' stroke='transparent' transform='translate(50, 50)' style='fill: rgb(165, 42, 42);'></circle>";
		content += "<path d='" + nodePaths['network'] + "' class='nodeicon' transform='translate(26,25), scale(1.5)' style='fill: rgb(255, 255, 255);'></path>";
		content += "<text x='150' y='55' style='font-size: 28'>Network</text>"
		content += "<text x='28' y='95' style='fill: rgb(165, 42, 42)'>Private</text>"
		content += "<text x='80' y='95' style='fill: rgb(8, 112, 0)'>Public</text>"

		content += "<circle r='30' stroke-width='0' stroke='transparent' transform='translate(100, 47)' style='fill: rgb(8, 112, 0);'></circle>";
		content += "<path d='" + nodePaths['publicnetwork'] + "' class='nodeicon' transform='translate(76,23), scale(1.5)' style='fill: rgb(255, 255, 255);'></path>"

		content += "<rect width='275' height='130'  x='280' style='fill:rgb(245,245,245)'></rect>"
		content += "<circle r='25' stroke-width='0' stroke='transparent' transform='translate(330, 50)' style='fill: rgb(128, 0, 128);'></circle>";
		content += "<path d='" + nodePaths['router'] + "' class='nodeicon' transform='translate(315,35), scale(1)' style='fill: rgb(255, 255, 255);'></path>"
		content += "<text x='380' y='55' style='font-size: 28'>Router</text>"

		content += "<rect width='275' height='140' y='140' style='fill:rgb(245,245,245)'></rect>"
		content += "<circle r='25' stroke-width='2' stroke='#d9534f' transform='translate(40, 240)' style='fill: rgb(102, 119, 136);'></circle>";
		content += "<path d='" + nodePaths['ubuntu'] + "' class='nodeicon' transform='translate(17,217), scale(1.45)' style='fill: rgb(255, 255, 255);'></path>"

		content += "<circle r='25' stroke-width='2' stroke='#5cb85c' transform='translate(40, 180)' style='fill: rgb(102, 119, 136);'></circle>";
		content += "<path d='" + nodePaths['linux'] + "' class='nodeicon' transform='translate(17,157), scale(1.5)' style='fill: rgb(255, 255, 255);'></path>";
		content += "<text x='80' y='175' style='font-size: 24'>Virtual Machine</text>"
		content += "<text x='100' y='210' style='fill: #5cb85c;'>ACTIVE</text>"
		content += "<text x='170' y='210' style='fill: #d9534f;'>SHUTOFF</text>"
		content += "<text x='100' y='250' style='fill: #428bca;'>BUILD</text>"
		content += "<text x='170' y='250' style='fill: #f0ad4e;'>WARNING</text>"

		content += "<rect width='275' height='140' y='140' x='280' style='fill:rgb(245,245,245)'></rect>";
		content += "<text x='380' y='175' style='font-size: 24'>Volume</text>"
		content += "<circle r='22' stroke-width='0' stroke='transparent' transform='translate(330, 220)' style='fill: rgb(255, 160, 58);'></circle>";
		content += "<path d='" + nodePaths['volume'] + "' class='nodeicon' transform='translate(313,209), scale(1)' style='fill: rgb(255, 255, 255);'></path>"

	content += "</svg>";

	content += "<hr /> Double click on any node to see details relating to it.";

	$("#myModalBody").html(content);
}

	// $scope.getNodeIndexByName = function(name) {
	// 	console.log("we did this!");
	// 	return $scope.clusterdata.nodes.filter(function(node) { return node['name'] == name})[0]['index'];
	// }
	// 
	// 	/**
	//  *	Adds a connection between two nodes in the force layout
	//  *
	//  *	@param node1	The first node to connect, identified by Name
	//  *	@param node2 	The second node to connect, identified by Name
	//  */
	// $scope.addLinkToForceGraph = function(node1, node2) {
	// 	// First we need to find the index of each node
	// 	// var item = $scope.clusterdata.nodes.filter($scope.paramComp('name', node1))
	// 	// console.log(item)
	// 	console.log(node1);
	// 	console.log(node2)
	// 	var n1 = $scope.getNodeIndexByName(node1);
	// 	var n2 = $scope.getNodeIndexByName(node2);
	// 	$scope.clusterdata.edges.push({source: n1, target: n2});

	// 	$scope.updateForceGraph();
	// }
	// 
		/**
	 *	Make sure we don't zoom/pan, and save the current zoom/pan settings
	 */
	// $scope.disableRedraw = function() {
	// 	// event.preventDefault();
	// 	// console.log("disabling");
	// 	// node_clicked = true;
	// 	// scale_save = zoom.scale();
	// 	// translate_save = zoom.translate();
	// }

	// *
	//  *	Re enable zoom/pan and reset settings to what they were before we clicked
	 
	// $scope.enableRedraw = function() {
	// 	// console.log("enabling")
	// 	// node_clicked = false;
	// 	// zoom.scale(scale_save);
	// 	// zoom.translate(translate_save);
	// 	// console.log("set redraw false")
	// }

/* OLD AND UNUSED */

function loadListPane() {
	$('#entity-table').dataTable( {
		"bPaginate": false,
		"bLengthChange": false,
		"bFilter": true,
		"bSort": true,
		"bInfo": false,
		"bAutoWidth": false
	} );

	// $('#entity-table').dataTable().fnSetColumnVis( 0, false );

	// $("#entity-table_filter").attr("class", "fake-search");
	// $("#entity-table_filter input").attr("class", "form-control");
}

	// $scope.paramComp = function(element, param) {
	// 	return element.id == param;
	// }

// function filter() {
// 	var string = $('#fake-search-box').val();
// 	// $('#entity-table').dataTable().fnFilter(string);
// }

	// /**
	//  * Adds an existing volume to the Dashboard
	//  * @param {[string]} key [The volume_id of the volume]
	//  */
	// $scope.addVolumeToDash = function(key, type, typeName) {
	// 	clusterdata["lookup"][key] = "volumes";
	// 	clusterdata[type][key]['type'] = type;
	// 	clusterdata[type][key]['path'] = nodePaths['volume'];
	// 	$scope.clusterdata.push(clusterdata[type][key]);
	// 	$scope.addNodeToForceGraph(key, "vol", 12)

	// 	// The parameter name seems to have changed between OpenStack versions so let's sanity check first.
	// 	var name = clusterdata["volumes"][key]["name"]
	// 	if (name === undefined) {
	// 		name = clusterdata["volumes"][key]["display_name"];
	// 	}

	// 	addToListPane(key, "vol", name)

	// 	for (var j in clusterdata["volumes"][key]["attachments"]) {
	// 		var serv = clusterdata['volumes'][key]["attachments"][j]["server_id"];
	// 		// console.log("Linking vol: " + key + " with instance " + clusterdata['volumes'][key]["attachments"][j]["server_id"])
	// 		$scope.addLinkToForceGraph(key, serv);
	// 		clusterdata['servers'][serv]['volumes'].push(key)
	// 	}
	// 	$("#circle" + key).dblclick(function(){
	// 		loadVolRightPaneInfo(this.id.substring(6))
	// 	});
	// }

	// /**
	//  * Adds an existing server to the Dashboard
	//  * @param {[string]} key [The instance_id of the server]
	//  */
	// $scope.addServerToDash = function(key, type, typeName) {
	// 	clusterdata["lookup"][key] = type;
	// 	clusterdata["servers"][key]['volumes'] = []
	// 	if ($scope.entityTypes[type] === undefined) { $scope.entityTypes[type] = {'name': typeName, 'status': true} };
	// 	clusterdata[type][key]['type'] = type;
	// 	clusterdata[type][key]['path'] = nodePaths['linux'];
	// 	$scope.clusterdata.push(clusterdata[type][key]);
	// 	$scope.addNodeToForceGraph(key, "serv", 18);
	// 	//addToListPane(key, "serv", clusterdata["servers"][key]["name"]);
	// 	$("#" + key).click(function(){loadInstRightPaneInfoRef(this.id); /*$("#" + key).data("opentips")[0].hide()*/});
	// 	$("#circle" + key).dblclick(function(){loadInstRightPaneInfoRef(this.id.substring(6)); /*$("#" + key).data("opentips")[0].hide()*/});
	// 	//$("#" + key).dblclick(function(){alert("You just double clicked on " + clusterdata["servers"][key]["name"] );});
	// 	$("#" + key).bind("contextmenu", function(){alert("You just opened a context menu and clicked on " + clusterdata["servers"][key]["name"] );})
	// 	//$("#" + Object.keys(servers)[i]).mouseenter(function(){loadTooltipInfo(Object.keys(servers)[i]);})
	// 	//$("#" + Object.keys(servers)[i]).mouseleave(function(){$("#" + Object.keys(servers)[i]).data("opentips")[0].hide();})
	// 	for (var j in clusterdata["servers"][key]["addresses"]) {
	// 		// TODO: We shouldn't need to check this every time, perhaps edit server data at start to set network by ID not name?
	// 		var net = getNetworkByName(j);
	// 		$scope.addLinkToForceGraph(key, net);
	// 	}
	// 	clusterdata["servers"][key]["statistics"] = {};
	// 	clusterdata["servers"][key]["statistics"]["cpu_util"] = {}
	// 	clusterdata["servers"][key]["statistics"]["network.flow.bytes"] = {}
	// }

	// /**
	//  * Adds an existing router to the Dashboard
	//  * @param {[string]} key [The ID of the Router]
	//  */
	// $scope.addRouterToDash = function(key, type, typeName) {
	// 	clusterdata["lookup"][key] = type;
	// 	if ($scope.entityTypes[type] === undefined) { $scope.entityTypes[type] = {'name': typeName, 'status': true} };
	// 	clusterdata[type][key]['type'] = type;
	// 	clusterdata[type][key]['path'] = nodePaths['router'];
	// 	$scope.clusterdata.push(clusterdata[type][key]);
	// 	//addToListPane(key, "rou", clusterdata["routers"][key]["name"]);
	// 	$scope.addNodeToForceGraph(key, "rou", 25);
	// 	var port_keys = Object.keys(clusterdata["ports"]);

	// 	for (var j in port_keys) {
	// 		var porkey = port_keys[j]
			
	// 		// TODO: Can the below be simplified, seems a waste to scan through each port just to find correct networks
	// 		// Same is happening in right pane load for routers
	// 		if (clusterdata["ports"][porkey]["device_id"] == key) {
	// 			var portnet = clusterdata["ports"][porkey]["network_id"];
	// 			// console.log("adding a link between rou: " + key + " and net " + portnet + ".")
	// 			$scope.addLinkToForceGraph(key, portnet);
	// 		}
	// 	}
	// 	$("#circle" + key).dblclick(function() {
	// 		loadRouRightPaneInfo(this.id.substring(6))
	// 	});
	// }

	// /**
	//  * Adds an existing network to the Dashboard
	//  * @param {[string]} key [The Network ID]
	//  */
	// $scope.addNodeToDash = function(node, type, typeName, refresh) {
	// 	// console.log('Processing the ' + type + ': ' + node.name);
	// 	if ($scope.entityTypes[type] === undefined) { $scope.entityTypes[type] = {'name': typeName, 'status': true} };
	// 	$scope.clusterdata.lookup[node.id] = node;

	// 	node.type = type;
	// 	node.class = node['router:external'] ? 'publicnetworks' : type;
	// 	node.nodeSize = nodeSize[node.class] || 16;
	// 	node.color = getNodeColor(node.class);
	// 	node.pathName = $scope.getNodePath(node.class, node);
	// 	node.path = nodePaths[node.pathName]
	// 	node.pathOffset = $scope.getIconOffset(node.class, node);
	// 	node.pathScale = getIconScale(node.type, node)
	// 	node.metrics = {}

	// 	// switch(type) {
	// 	// 	case 'networks':
	// 	// 		console.log("It's a network!");
	// 	// 	case 'servers':
	// 	// 		console.log("It's a server");
	// 	// }
	// 	// console.log(node);
	// 	$scope.clusterdata.nodes.push(node);

	// 	// clusterdata[type][key]['type'] = type;
	// 	// clusterdata[type][key]['class'] = clusterdata[type][key]["router:external"] ? 'publicnetworks' : type;
	// 	// clusterdata[type][key]['size'] = nodeSize[clusterdata[type][key]['class']] ? nodeSize[clusterdata[type][key]['class']] : 16;
	// 	// clusterdata[type][key]['path'] = getNodeShape(clusterdata[type][key]['class'], key);
	// 	// console.log(clusterdata[type][key])
		
	// 	// console.log($scope.clusterdata)
	// 	if (refresh) {$scope.updateForceGraph();}

	// 	// if (type == 'routers') {
	// 		// console.log("it's a router, we do more stuff!");
	// 		// var port_keys = Object.keys(clusterdata["ports"]);

	// 		// for (var j in port_keys) {
	// 		// 	var porkey = port_keys[j]
	// 		// 	console.log(clusterdata["ports"][porkey])
				
	// 		// 	// TODO: Can the below be simplified, seems a waste to scan through each port just to find correct networks
	// 		// 	// Same is happening in right pane load for routers
	// 		// 	if (clusterdata["ports"][porkey]["device_id"] == key) {
	// 		// 		var portnet = clusterdata["ports"][porkey]["network_id"];
	// 		// 		// console.log("adding a link between rou: " + key + " and net " + portnet + ".")
	// 		// 		//$scope.addLinkToForceGraph(key, portnet);
	// 		// 	}
	// 		// }
	// 	// } else if (type == 'servers') {
	// 	// 	console.log('its a server, we do more stuff!')
	// 	// 	clusterdata["servers"][key]['volumes'] = []
	// 	// 	clusterdata["servers"][key]["statistics"] = {};
	// 	// 	clusterdata["servers"][key]["statistics"]["cpu_util"] = {}
	// 	// 	clusterdata["servers"][key]["statistics"]["network.flow.bytes"] = {}
	// 	// } else if (type == 'volumes') {
	// 	// 	console.log("It's a volume, we do this.")
	// 	// 	for (var j in clusterdata["volumes"][key]["attachments"]) {
	// 	// 		var serv = clusterdata['volumes'][key]["attachments"][j]["server_id"];
	// 	// 		// $scope.addLinkToForceGraph(key, serv);
	// 	// 	}
	// 	// }

	// 	// forceGraphData.nodes.push({name: key, type: type, size: clusterdata[type][key]['size'], path: clusterdata[type][key]['path'], class: clusterdata[type][key]['class']});
	// 	// console.log('we did it!')

	// 	//if ($scope.clusterdata["neutronnetwork"][key]["router:external"] == true) { $scope.addNodeToForceGraph(key, "netpub", 30); }
	// 	//else {	$scope.addNodeToForceGraph(key, "net", 25); }

	// 	// $("#circle" + key).dblclick(function(){	loadNetRightPaneInfo(this.id.substring(6)) });
	// }

/**
 * Returns the ID of the network with the give name.
 *
 * @param name 	The unique name of the node. Must be unique
 */
function getNetworkByName(name) {
	for (var i in clusterdata["networks"]) {
		if (clusterdata["networks"][i]["name"] == name) {
			return i;
		}
	}
	return undefined;
}

/**
 * Returns the ID of the security group with the give name.
 *
 * @param name 	The unique name of the node. Must be unique
 */
function getSecurityGroupByName(name) {
	for (var i in clusterdata["security_groups"]) {
		if (clusterdata["security_groups"][i]["name"] == name) {
			return i;
		}
	}
	return undefined;
}

/**
 *	Add an item to the list pane
 *
 *	@param 	id		Element id
 *	@param 	name 	Name of the element
 */
function addToListPane(id, type ,name) {
  // $('#entity-table').dataTable().fnAddData( [id, type ,name] );
}

function getImportValue(source, target) {
	for (var i = 0; i < source.length; i++) {
		if (source[i]["name"] == target ) {
			return source[i]["value"];
		}
	}
	return 0;
}

// Return a list of imports for the given array of nodes.
function packageImports(nodes) {
  var map = {},
	  imports = [];

  // Compute a map from name to node.
  nodes.forEach(function(d) {
	map[d.name] = d;
  });
  //console.log(map)

  // For each import, construct a link from the source to target node.
  nodes.forEach(function(d) {
	if (d.imports) d.imports.forEach(function(i) {
		//console.log(d.name);
		//console.log(i)
		//console.log(d.name)
		//console.log("connection: " + map[d.name]["name"] + " to " + map[i.name]["name"] + " with a rate of " + i.value);
		imports.push({source: map[d.name], target: map[i.name], value: i.value});
	});
  });

  //console.log(imports);
  return imports;
}

function getColorFromLinkValue(value) {
	
	if (value == 0) {
		console.log("Value is 0, setting link to transparent!")
		return "transparent";
	}
	else {
		var percent = value / current_max * 100;
		console.log("Value is " + formatSizeUnits(value) + " (" + percent + "%) ");
		//var midval = current_max / 2;
		var r, g, b;
		b = Math.round(0);

		if (percent > 50) {
			r = 255;
			g = Math.round(255 * ((100 - percent) / 100));
		}
		else {
			g = 255;
			r = Math.round(255 * ((100 - percent) / 100));
		}

		var result = "rgb(" + r + ", " + g + "," + b + ")"
		return result
	}
}

/**
 *	Loads the help screen content to the modal box
 *
 *	@param 	element 	jQuery element ID to place the plot in
 *	@param 	data 		OpenStack ID to plot data for. Defaults to whole cloud if not passed.
 */
function loadNewNetworkPlot(element, data) {
	$(element).html("");
	//$(element).prepend("<div id='flows-label'></div>")

	var diameter = 900,
		radius = diameter / 2,
		innerRadius = radius - 250;

	var cluster = d3.layout.cluster()
		.size([360, innerRadius])
		.sort(null)
		.value(function(d) { return d.size; });

	var bundle = d3.layout.bundle();

	var line = d3.svg.line.radial()
		.interpolate("bundle")
		.tension(.85)
		.radius(function(d) { return d.y; })
		.angle(function(d) { return d.x / 180 * Math.PI; });

	var svg = d3.select(element).append("svg")
		.attr("width", diameter)
		.attr("height", diameter)
	  .append("g")
		.attr("transform", "translate(" + radius + "," + radius + ")");

	var link = svg.append("g").selectAll(".link"),
		node = svg.append("g").selectAll(".node");

	var classes = getRandomNetworkPlotData();

	var nodes = cluster.nodes(packageHierarchy(classes)),
	  links = packageImports(nodes);

	link = link.data(bundle(links))
		.enter().append("path")
			.each(function(d) { d.source = d[0], d.target = d[d.length - 1], d.value = getImportValue(d.source["imports"], d.target["name"]) })
			.style("stroke", function(d) { console.log("Connection between " + d.source.name + " & " + d.target.name); return getColorFromLinkValue(d.value);})
			.attr("class", "link")
			.attr("d", line);

	node = node.data(nodes.filter(function(n) { return n.parent; }))
	.enter().append("text")
		.attr("id", function(d) {return d.name})
		.attr("class", "node")
		.attr("dx", function(d) { if (!d.children) {return d.x < 180 ? 8 : -8;} else {return d.x < 180 ? 260 : -260;} })
		.attr("dy", ".31em")
		.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")" + (d.x < 180 ? "" : "rotate(180)"); })
		.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
		.text(function(d) { if (d.key.length > 20) {return d.key.substring(0,19) + "..."} else {return d.key;} })
		.on("mouseover", mouseovered)
		.on("mouseout", mouseouted);

	function mouseovered(d) {
		node.each(function(n) { n.target = n.source = false; });

		link
			.classed("link--target", function(l) {   if (l.target === d) {return l.source.source = true;} })
			.classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
			.filter(function(l) { return l.target === d || l.source === d; })
				.each(function() { this.parentNode.appendChild(this); });

		node
			.classed("node--target", function(n) { return n.target; })
			.classed("node--source", function(n) { return n.source; })
			.filter(function(b){return b.key == d.key})
				.text(function(d) {return d.key})
	}

	function mouseouted(d) {
		//$("#flows-label").html(" ")
		link
			.classed("link--target", false)
			.classed("link--source", false);

		node
			.classed("node--target", function(d) { return false})
			.classed("node--source", false)
			.filter(function(b){return b.key == d.key})
				.text(function(d) { if (d.key.length > 20) {return d.key.substring(0,19) + "..."} else {return d.key;} });
	}

	d3.select(self.frameElement).style("height", diameter + "px");
}

// Lazily construct the package hierarchy from class names.
function packageHierarchy(classes) {
  var map = {};

  function find(name, data) {
	var node = map[name], i;
	if (!node) {
	  node = map[name] = data || {name: name, children: []};
	  if (name.length) {
		node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
		node.parent.children.push(node);
		node.key = name.substring(i + 1);
	  }
	}
	return node;
  }

  classes.forEach(function(d) {
	find(d.name, d);
  });

  return map[""];
}

function getColourTemp(maxVal, minVal, actual) {
	var midVal = (maxVal - minVal)/2;
	var intR;
	var intG;
	var intB = Math.round(0);

	if (actual >= midVal){
		 intR = 255;
		 intG = Math.round(255 * ((maxVal - actual) / (maxVal - midVal)));
	}
	else{
		intG = 255;
		intR = Math.round(255 * ((actual - minVal) / (midVal - minVal)));
	}

	return to_rgb(intR, intG, intB);
}

/**
 * Returns a string containing the HTML for the heading in the east pane.
 *
 * @param title	The title of the element being shown in the right pane
 */
function rightPaneTitle(title) {
	return "<h3 id='right-instance-title'>" + title + "</h3>";
}

/**
 * Returns a string containing the HTML to create the status label in the east pane.
 *
 * @param status	The status of the element being shown in the right pane
 */
var paneStates = {'ACTIVE': 'success', 'IN-USE': 'success', 'AVAILABLE': 'info', 'SHUTOFF': 'danger', 'BUILD': 'default'}
function rightPaneStatus(status) {
	return paneStates[status] ? "<h4><span class='label label-" + paneStates[status] + "'>" + status + "</span></h4>" : "<h4><span class='label label-warning'>" + status + "</span></h4>";
}

/**
 * Returns a string containing the HTML for a field in the east pane.
 *
 * @param field	The description for the value being shown
 * @param value The value being added to the east pane
 */
function rightPaneField(field, value) {
	return "<p><b> " + field + ": </b>" + value + "</p>";
}

/**
 * Returns a string containing the HTML for a field in the east pane.
 *
 * @param field	The description for the value being shown
 * @param value The value being added to the east pane
 * @param link	The action to be performed when the value is clicked on
 */
function rightPaneFieldWithLink(field, value, link) {
	return "<p><b>" + field + ": </b><a href=\"" + link + "\" >" + value + "</a></p>";
}

/**
 * Returns a string containing the HTML for a field in the east pane.
 *
 * @param field				The description for the value being shown
 * @param value 			The value being added to the east pane
 * @param tooltipContent	The HTML of the content to be displayed in the tooltip when the value is hovered over
 */
function rightPaneFieldWithTooltip(field, value, tooltipContent) {
	return "<p><b>" + field + ": </b><a href=\"#\" data-toggle=\"tooltip\" title=\"" + tooltipContent + "\">" + value + "</a></p>";
}

/**
 * Creates the graphs to be shown in the right pane when an instance is selected
 */
function updateRightPaneInstanceGraphs() {
	gData = [ { x: 0, y: 23}, { x: 1, y: 15 }, { x: 2, y: 79 }, { x: 3, y: 23}, { x: 4, y: 96 }, { x: 5, y: 79 }, { x: 6, y: 88}, { x: 7, y: 93 }, { x: 8, y: 69 }, { x: 9, y: 80}, { x: 10, y: 30 }, { x: 11, y: 4 }, { x: 12, y: 5}, { x: 13, y: 4 }, { x: 14, y: 4 }];
	createGraph(gData, '#CPUGraphRight');

	gData = [ { x: 0, y: 23}, { x: 1, y: 15 }, { x: 2, y: 79 }, { x: 3, y: 50}, { x: 4, y: 51 }, { x: 5, y: 79 }, { x: 6, y: 80}, { x: 7, y: 85 }, { x: 8, y: 78 }, { x: 9, y: 93}, { x: 10, y: 80 }, { x: 11, y: 79 }, { x: 12, y: 23}, { x: 13, y: 15 }, { x: 14, y: 79 }];
	createGraph(gData, '#NetworkGraphRight');

	gData = [ { x: 0, y: 23}, { x: 1, y: 24 }, { x: 2, y: 15 }, { x: 3, y: 20}, { x: 4, y: 22 }, { x: 5, y: 24 }, { x: 6, y: 25}, { x: 7, y: 25 }, { x: 8, y: 26 }, { x: 9, y: 29}, { x: 10, y: 30 }, { x: 11, y: 32 }, { x: 12, y: 32}, { x: 13, y: 32 }, { x: 14, y: 32 }];
	createGraph(gData, '#DiskGraphRight');
}

/**
 *	Load's data on a particular instance in the right pane
 *
 *	@element		The string name of the element, excluding #
 */
function loadInstRightPaneInfoRef(element) {
	myLayout.slideOpen('east');

	var server = clusterdata["servers"][element];
	var content = "";

	// Add the name in a heading
	content += rightPaneTitle(server['name']);
	//content += "<hr />";

	content += rightPaneStatus(server['status']);

	content += rightPaneField("ID", server['id']);

	content += rightPaneField("Created", server['created']);

	// TODO: Update more frequently (Currently only updates on a new east pane load.)
	content += rightPaneField("Uptime", calculateUptime(server['created']));
	
	content += rightPaneField("Last powered on", calculateUptime(server['updated']));

	content += rightPaneField("Physical Host", server['OS-EXT-SRV-ATTR:hypervisor_hostname']);

	//content += "<hr />";

	var flavor = server["flavor"]["id"];
	var flavorTooltipContent = "Disk: " + clusterdata["flavors"][flavor]["disk"] + "GB<br/>";
	flavorTooltipContent += "RAM: " + clusterdata["flavors"][flavor]["ram"] + "MB<br/>";
	flavorTooltipContent += "VCPUs: " + clusterdata["flavors"][flavor]["vcpus"] + " VCPUs";

	content += rightPaneFieldWithTooltip("Flavor", clusterdata["flavors"][flavor]["name"],flavorTooltipContent);

	var image = server["image"]["id"]

	if (clusterdata["images"][image]) {	content += rightPaneField("Image", clusterdata["images"][image]["name"]);	} 
	else {		content += rightPaneField("Image", "Not found, probably deleted");
	}

	content += rightPaneField("Key Name", server["key_name"]);

	// Put these in a tool tip for hover over flavor
	// down to here

	//content += "<hr />";
	//content += "<button type=\"button\" class=\"btn btn-default\" data-toggle=\"tooltip\" data-placement=\"right\" title=\"Tooltip on right\">Tooltip on right</button>";

	//Networks
	if (server["addresses"].length != 0) {
		content += "<table class='table table-hover'><thead><tr><th>Network Name</th></tr></thead>"
		for(var networkx in server["addresses"]) {
			getNetworkByName(networkx);
			//console.log(clusterdata[][getNetworkByName(networkx)])
			content += "<tr><td><a href='javascript:loadNetRightPaneInfo(\"" + getNetworkByName(networkx) + "\")'>" + networkx + "</a></td></tr>";
		}
		content += "</tbody></table>"
	}

	//Volumes
	var volumes = server['volumes']//server["os-extended-volumes:volumes_attached"];
	var realVolumes = existingVolumes(volumes);
	if (realVolumes.length == 0) {
		content += rightPaneField("Volumes", "None");
	}
	else {
		content += "<table class='table table-hover'><thead><tr><th>Volume Name</th><th>Size (GB)</th></tr></thead>"
		for (var i = 0; i < realVolumes.length; i++) {
			// console.log()
			volid = realVolumes[i];
			content += "<tr><td><a href='javascript:loadVolRightPaneInfo(\"" + volid + "\")'>" + clusterdata["volumes"][volid]["name"] + "</a></td><td>" +  clusterdata["volumes"][volid]["size"] + "</td></tr>";
		}
		content += "</tbody></table>"
	}

	//Security groups
	// var securitygroups = server["security_groups"];
	// if (securitygroups.length == 0) {
	// 	content += rightPaneField("Security Groups", "None");
	// }
	// else {
	// 	content += "<table class='table table-hover'><thead><tr><th>Security Group Name</th></tr>"//<th>Type</th></tr></thead>"
	// 	for (var i = 0; i < securitygroups.length; i++) {
	// 		secid = securitygroups[i]["name"];
	// 		content += "<tr><td>" + secid + "</td></tr>";
	// 	}
	// 	content += "</tbody></table>"
	// }

	content += rightPaneField("CPU Util", " 70%");
	content += "<div id=\"CPUGraphRight\"></div>";

	content += rightPaneField("Network Traffic Rate", " 5mb/s");
	content += "<div id=\"NetworkGraphRight\"></div>";

	content += rightPaneField("Disk Read/Write", "14GB/32GB");
	content += "<div id=\"DiskGraphRight\"></div>";

	$("#entity-details").html(content);

	updateRightPaneInstanceGraphs();

	$('#right-instance-title').fitText(0.8, {minFontSize: '20px', maxFontSize: '80px'});

	$('[data-toggle="tooltip"]').tooltip({
		'placement': 'bottom',
		'html': true
	});

}

/**
 *	Load's data on a particular volume in the right pane
 *
 *	@param	id		The string id of the element
 */
function loadVolRightPaneInfo(id) {
	myLayout.slideOpen('east');
	var content = JSON.stringify(clusterdata["volumes"][id]);
	//console.log(content)

	var volume = clusterdata["volumes"][id];
	var content = "";

	// Add the name in a heading
	content += rightPaneTitle(volume['name']);

	content += rightPaneStatus(volume["status"].toUpperCase());

	content += rightPaneField("ID", volume["id"]);

	content += rightPaneField("Created", volume["created_at"]);

	content += rightPaneField("Size", volume["size"] + "GB");

	content += rightPaneField("Physical Host", volume["os-vol-host-attr:host"]);

	if (volume["attachments"].length == 0) {
		content += rightPaneField("Attachment", "None");
	}
	else {
		content += rightPaneFieldWithLink("Attachment", clusterdata["servers"][volume["attachments"][0]["server_id"]]["name"], "javascript:loadInstRightPaneInfoRef('" + volume["attachments"][0]["server_id"] + "');");
	}

	content += rightPaneField("Bootable", volume["bootable"]);

	if (volume["description"] == "") {
		content += rightPaneField("Description", "None")
	}
	else {
		content += rightPaneField("Description", volume["description"]);
	}

	content += rightPaneField("Volume Type", volume["volume_type"]);


	//content += JSON.stringify(clusterdata["volumes"][id]);
	$("#entity-details").html(content);
}

/**
 *	Load's data on a particular network in the right pane
 *
 *	@param	id		The string id of the element
 */
function loadNetRightPaneInfo(id) {
	openSearch();
	var network = clusterdata["neutronnetwork"][id];
	var content = "";

	// Add the name in a heading
	content += rightPaneTitle(network['name']);

	content += rightPaneStatus(network["status"]);

	content += rightPaneField("ID", network["id"]);

	// Routers connected to network
	var devicesOnNetwork = [];
	for (var portx in clusterdata["ports"]) {
		if (clusterdata["ports"][portx]["network_id"] == id) {
			devicesOnNetwork.push(clusterdata["ports"][portx]["device_id"]);
		}
	}

	content += "<table class='table table-hover'><thead><tr><th>Router Name</th></tr>"//<th>Type</th></tr></thead>"
	for (var i = 0; i < devicesOnNetwork.length; i++) {
		if (clusterdata["routers"][devicesOnNetwork[i]] != undefined) {
			content += "<tr><td><a href='javascript:loadRouRightPaneInfo(\"" + devicesOnNetwork[i] + "\")'>" + clusterdata["routers"][devicesOnNetwork[i]]["name"] + "</a></td></tr>";
		}
	}
	content += "</tbody></table>"

	// Instances on network
	var instancesOnNetwork = []
	for (var instancex in clusterdata["servers"]) {
		for (var networkx in clusterdata["servers"][instancex]["addresses"]){
			if (getNetworkByName(networkx) == id) {
				instancesOnNetwork.push(instancex);
			}
		}
	}
	if (instancesOnNetwork.length == 0) {
		content += rightPaneField("Instances", "None");
	}
	else {
		content += "<table class='table table-hover'><thead><tr><th>Instance Name</th><th>IP</th></tr>"//<th>Type</th></tr></thead>"
		for (var i = 0; i < instancesOnNetwork.length; i++) {
			var instanceID = instancesOnNetwork[i];
			content += "<tr><td><a href='javascript:loadInstRightPaneInfoRef(\"" + instanceID + "\")'>" + clusterdata["servers"][instanceID]["name"] + "</a></td><td>" + clusterdata["servers"][instanceID]["addresses"][network['name']][0]["addr"] + "</td></tr>";
		}
		content += "</tbody></table>"
	}

	content += "<br/>";
	//content += JSON.stringify(clusterdata["neutronnetwork"][id]);
	//console.log(content)
	$("#entity-details").html(content);
}

/**
 *	Load's data on a particular router in the right pane
 *
 *	@param	id		The id of the element
 */
function loadRouRightPaneInfo(id) {
	myLayout.slideOpen('east');
	var router = clusterdata["routers"][id];
	var content = "";

	// Add the name in a heading
	content += rightPaneTitle(router['name']);

	content += rightPaneStatus(router["status"]);

	content += rightPaneField("ID", router["id"]);

	// Is null the value when there is no external gateway?
	// Can it have multiple external gateways? How is this shown in the JSON?
	if (router["external_gateway_info"]["network_id"] != null) {
		content += rightPaneFieldWithLink("External Gateway", router["external_gateway_info"]["network_id"],"javascript:loadNetRightPaneInfo('" + router["external_gateway_info"]["network_id"] + "');");
	}
	else {
		content += rightPaneField("External Gateway ID", "None")
	}

	// Networks connected to router
	var networksOnRouter = [];
	for (var portx in clusterdata["ports"]) {
		if (clusterdata["ports"][portx]["device_id"] == id) {
			networksOnRouter.push(clusterdata["ports"][portx]["network_id"]);
		}
	}
	content += "<table class='table table-hover'><thead><tr><th>Network Name</th></tr>"//<th>Type</th></tr></thead>"
	for (var i = 0; i < networksOnRouter.length; i++) {
		if (clusterdata["neutronnetwork"][networksOnRouter[i]] != undefined) {
			content += "<tr><td><a href='javascript:loadNetRightPaneInfo(\"" + networksOnRouter[i] + "\")'>" + clusterdata["neutronnetwork"][networksOnRouter[i]]["name"] + "</a></td></tr>";
		}
	}
	content += "</tbody></table>"

	//content += JSON.stringify(clusterdata["routers"][id]);
	//console.log(content)
	$("#entity-details").html(content);
}

function getRandomNetworkPlotData() {
  return turnServerListIntoConnections(generateRealServersForNetworkPlot());
}


function generateServersForNetworkPlot(number) {
  var temp = [];
  servers = number;
  var server = 0;

  while (servers > 0) {
	server++;
	var vm = 0
	for (i = 0; i < Math.random() * 20; i++) {
	  vm ++;
	  temp.push("BD2-" + server + ".server" + vm)
	  servers --;
	}
  }

  return temp;
}

function generateRealServersForNetworkPlot() {
	var temp = [];

	for (var i in clusterdata["servers"]) {
		//console.log(i);
		var node = {"name": clusterdata["servers"][i]["OS-EXT-SRV-ATTR:hypervisor_hostname"] + "." + clusterdata["servers"][i]["name"], "instance_id": i}
		//console.log(node);
		var name = clusterdata["servers"][i]["name"]
		// if (name.length > 20) {
		// 	name = name.substring(0,19)+"..."
		// 	console.log("Whoa, this server has a long name!")
		// }

		//temp.push(clusterdata["servers"][i]["OS-EXT-SRV-ATTR:hypervisor_hostname"] + "." + name)
		temp.push(node);
		//console.log(clusterdata["servers"][i]["OS-EXT-SRV-ATTR:hypervisor_hostname"] + "." + clusterdata["servers"][i]["name"]);
	}

	return temp;
}

function turnServerListIntoRandomConnections(list) {
  var data = [];

  for (var i = 0; i < list.length; i++) {
	var node = {"name": "servers." + list[i]["name"], "imports": []}
	data.push(node)
  }
  //console.log(data)
  //console.log(data.length)
  for (var j = 0; j < data.length; j++) {
	//console.log("j = " + j)
	for (var k = 0; k < data.length; k++) {
	  if (Math.random() >= 0.95){
		data[j]["imports"].push(data[k]["name"])
		console.log(data[k]);
	  }
	}
  }
  return data;
  // console.log(data);
}

var current_max = 0;

function turnServerListIntoConnections(list) {
	current_max = 0;
  var data = [];

  for (var i = 0; i < list.length; i++) {
	var node = {"name": "servers." + list[i]["name"], "instance_id" : list[i]["instance_id"], "imports": []}
	//console.log(node);
	data.push(node)
  }
  data.push({"name": "servers.OUTSIDE WORLD", "instance_id" : "OUTSIDE", "imports": []})

  //console.log("Pushed all nodes into data");
  
  for (var j = 0; j < data.length; j++) {
	if (data[j]["name"] != "servers.OUTSIDE WORLD" ) {
		var latestdate = Object.keys(clusterdata["servers"][data[j]["instance_id"]]["statistics"]["network.flow.bytes"]).sort().pop();
		var flow = clusterdata["servers"][data[j]["instance_id"]]["statistics"]["network.flow.bytes"][latestdate];
		if (flow !== undefined) {
			//console.log(flow);
			var x = Object.keys(flow);
			//console.log(x)
			for (var k = 0; k < x.length; k++) {
				if (x[k].indexOf("parameters.") != -1 && x[k].indexOf("dhcp") == -1 ) {
					//d.key.substring(10,19)
					var connection = x[k].substring(11,100);
					var val = flow[x[k]]
					if (val > current_max) {
						current_max = parseInt(val);
					}
					//console.log("Val = " + val);
					//console.log(connection);
					if (connection != "OUTSIDE" && clusterdata["servers"][connection] !== undefined) {
						var con = "servers." + clusterdata["servers"][connection]["OS-EXT-SRV-ATTR:hypervisor_hostname"] + "." + clusterdata["servers"][connection]["name"];
						//console.log(con)
						//data[j]["imports"].push(con);
						data[j]["imports"].push({"name": con, "value": val});
						//console.log(data[j]);
					}
					else if (connection == "OUTSIDE") {
						data[j]["imports"].push({"name": "servers.OUTSIDE WORLD", "value": val});
					}
				}
			}
		}
	}
  }
  //console.log(data);
  return data;
}

function getInstanceImage(id) {
	console.log(id);
	var imageid = clusterdata["servers"][id]["image"]["id"];
	if (clusterdata["images"][imageid] === undefined) {
		return "undefined"
	}
	return clusterdata["images"][imageid]["name"];
}

/**
 * Reloads Event Listeners on the Search Table
 */
function addEventListeners() {

  $('#entity-table tbody tr').click(function() {
	$('#entity-table tbody tr').removeClass('list-selected-item');
	$(this).addClass('list-selected-item');
  });

  $('#entity-table tbody tr').dblclick(function() {
	var aPos = $('#entity-table').dataTable().fnGetPosition(this);
	var aData = $('#entity-table').dataTable().fnGetData(aPos[4]);
	var type = aData[aPos][1];
	if (type == "serv") {  	loadInstRightPaneInfoRef(aData[aPos][0])    }
	else if (type == "rou") {  	loadRouRightPaneInfo(aData[aPos][0])    }
	else if (type == "net") {  	loadNetRightPaneInfo(aData[aPos][0])    }
	else if (type == "vol") {  	loadVolRightPaneInfo(aData[aPos][0])    }
	else { 	console.log("I don't know what entity type you clicked, but I don't know what to do with it...")    }
  });
}

function getEntityType(key) {
	return clusterdata["lookup"][key];
}

function saveNetworkFlows(data) {
	flows = JSON.parse(data)
	//console.log(flows)
	// For each instance ID in flows
	for (var i in Object.keys(flows)) {
		var flowkey = Object.keys(flows)[i]
		//console.log(flowkey)
		//console.log(flows[flowkey])
		for (var j in Object.keys(flows[flowkey])) {
			date = Object.keys(flows[flowkey])[j];
			clusterdata["servers"][flowkey]["statistics"]["network.flow.bytes"][date] = JSON.parse(flows[flowkey][date]);
			//console.log(date)
		}
	}
	loadNewNetworkPlot("#myLargeModalContent")
	if (net_flow_live == true) {
		setTimeout(function() {getOpenStackData(saveNetworkFlows, "get network flow")}, 5000);
	}
	//print(flows);
}

$('#myLargeModal').on('hide.bs.modal', function () {
	console.log("Modal Hidden");
	net_flow_live = false;
});

function openNetworkPlot() {
	loadNewNetworkPlot('#myLargeModalContent');
	getOpenStackData(saveNetworkFlows, "get network flow");
	//$('#myLargeModalContent').html();
	$('#myLargeModal').modal('show');
	net_flow_live = true;
}

function getInstanceForNetwork() {
	var s = []
	for (var i in clusterdata["servers"]) {
		var connections = []
		for (var j in clusterdata["servers"]){
			if (i != j) {
				if (Math.random() >= 0.75) {
					connections.push(j);
				}
			}
		}
		s.push({"name": clusterdata["servers"][i]["OS-EXT-SRV-ATTR:hypervisor_hostname"] + "." + i, "size": 1, "imports": connections, "host": clusterdata["servers"][i]["OS-EXT-SRV-ATTR:hypervisor_hostname"]});
	}  
	//console.log(s)
	return s;
}

/**
 * Checks that each volume in a list of volumes exists.
 * Returns a list of the volumes that do exist.
 *
 * @param volumes	An array of volume IDs to be checked.
 */
function existingVolumes(volumes) {
	var realVolumes = [];
	console.log(volumes);
	volumes.forEach(function(entry) {
		console.log(entry);
		if (clusterdata["volumes"][entry] != undefined) {
			realVolumes.push(entry);
		}
	});
	return realVolumes;
}

/**
 *	Load a graph in the top pane.
 */
function loadTopGraph(){
	var w = $("body").width() - 2
	graph = new Rickshaw.Graph( {
		element: document.querySelector('#graph'),
		series: [
			{ color: 'steelblue', data: [ { x: 0, y: 23}, { x: 1, y: 15 }, { x: 2, y: 79 } ]}, 
			{ color: 'lightblue', data: [ { x: 0, y: 30}, { x: 1, y: 20 }, { x: 2, y: 64 } ]}
		],
		height: 100,
		width: w
	});

	graph.render();
}

/**
 * Opens the sidebar locked to the entity data table
 */
function openSearch() {
	console.log("we should be bla")
	// TODO: This is full of UX glitches
	myLayout.slideOpen('east');
	// $("#fake-search").animate({width: $("#pane-east").width()}, 500);
}

function closeSearch() {
	myLayout.slideClosed('east');
	// $("#fake-search").animate({width: 200}, 1000);
}

/**
 * Creates a graph from the given data and adds it to the location specified
 *
 * @param graphData	The data used to create the graph
 * @param selector	The location that the graph will be added to
 */
function createGraph(graphData, selector) {
		graph = new Rickshaw.Graph( {
		element: document.querySelector(selector),
		series: [
			{ color: 'steelblue', data: graphData}
		],
		height: 50,
	});
	var hoverDetail = new Rickshaw.Graph.HoverDetail( {
		graph: graph,
		xFormatter: function(x) { return x + "seconds" },
		yFormatter: function(y) { return Math.floor(y) + " percent" }
	} );
	graph.render();
}


// hz.directive('svgPathReplace', function($timeout) {
// 	return {
// 		restrict: 'E',
// 		scope: {
// 			attr: "="
// 		},
// 		link: function(scope, element, attr) {
// 			// console.log(lAttr)
// 			var path = makeNode('path', element, attr);
// 			var newElement = path.cloneNode(true);
			
// 			scope.$watch('attr.d', function(newValue, oldValue) {
// 				// console.log("we should change the path!")
// 				console.log(attr.d)
// 				console.log(newValue);
// 				// console.log(oldValue);
// 				// if (newValue) {
// 				// 	lElement.replaceWith(lAttr);
// 				// }
// 			})
// 			$timeout(function() { element.replaceWith(newElement);	});
// 		}
// 	};
// });

// function makeNode(name, element, settings) {
// 	// console.log(element)
// 	var ns = 'http://www.w3.org/2000/svg';
// 	var node = document.createElementNS(ns, name);
// 	for (var attribute in settings) {
// 		var value = settings[attribute];
// 		if (value !== null && value !== null && !attribute.match(/\$/) && (typeof value !== 'string' || value !== '')) {
// 			node.setAttribute(attribute, value);
// 		}
// 	}
// 	return node;
// }