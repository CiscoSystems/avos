/*
 * Main AVOS Script
 *
 * Copyright (c) 2014 Cisco Systems 
 *   Alex Holden <a@lexholden.com> <ajonasho@cisco.com>
 *
 */

// var hz = angular.module('hz');

// hz.controller("buttonCtrl", function($scope){
// 	$scope.leftbuttons = [
// 		{'id':'labels', 'title': 'Labels', 'function': function() {alert("hello")}, 'icon': 'font'},
// 		{'id':'heat', 'title': 'Toggle Heatmap', 'function': "Hello", 'icon': 'fire'},
// 		{'id':'list', 'title': 'Toggle List', 'function': "Hello", 'icon': 'list'},
// 		{'id':'graph', 'title': 'Toggle Graph', 'function': "Hello", 'icon': 'stats'},
// 		{'id':'hdd', 'title': 'Toggle Volumes', 'function': "Hello", 'icon': 'hdd'},
// 		{'id':'ntwk', 'title': 'Toggle Networks', 'function': "Hello", 'icon': 'globe'},
// 		{'id':'alert', 'title': 'Toggle Alerts', 'function': "Hello", 'icon': 'bell'},
// 		{'id':'edit', 'title': 'Edit Mode', 'function': "Hello", 'icon': 'edit'}
// 	];

// });

var myLayout;

// Debugging Vars

var clusterdata = undefined;
var node_clicked = false;
var scale_save = null;
var translate_save = null;
var plot_heatmap = true;

var get_cpu_util = true
var net_flow_live = false

$(document).ready(function() {

	loadPaneLayout();
	loadNewForceGraph();
	setButtonStates();
	//loadTopGraph();
	loadListPane();
	getOpenStackData(loadInitialServers, "avosstartup");

	document.body.onmousedown = function() { mouseDown = 1;	}
	document.body.onmouseup = function() { mouseDown = 0; }

	if (d3.event) {
		// prevent browser's default behavior
		d3.event.preventDefault();
	}

	$(window).resize(function () {
		waitForFinalEvent(function(){
			var w = $('#pane-center').width();
			var h = $('#pane-center').height();
			svg.attr("width", w).attr("height", h);
			$("#pane-center canvas").attr("width", w).attr("height", h);
		}, 500);
	});

});

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

/**
 *	Loads an internal array of instances (servers) and other OpenStack data
 *
 *	@param data		Array of servers to load
 */
function loadInitialServers(data) {
	clusterdata = data;
	
	clusterdata["lookup"] = {}
	clusterdata["flavors"] = cleanArrayItems(clusterdata["flavors"]);
	clusterdata["servers"] = cleanArrayItems(clusterdata["servers"]);
	clusterdata["images"] = cleanArrayItems(clusterdata["images"]);
	clusterdata["neutronnetwork"] = cleanArrayItems(clusterdata["neutronnetwork"]);
	clusterdata["ports"] = cleanArrayItems(clusterdata["ports"]);
	clusterdata["routers"] = cleanArrayItems(clusterdata["routers"]);
	clusterdata["volumes"] = cleanArrayItems(clusterdata["volumes"]);
	clusterdata["meters"] = cleanArrayItems(clusterdata["meters"], "name");

	/*----------  Networks  ----------*/

	var network_keys = Object.keys(clusterdata["neutronnetwork"])

	for (var i in network_keys) {
		var netkey = network_keys[i];
		addNetworkToDash(netkey);
	}

	/*----------  Routers  ----------*/

	var router_keys = Object.keys(clusterdata["routers"]);
	
	for (var i in router_keys) {
		var roukey = router_keys[i];
		addRouterToDash(roukey);
	}

	/*----------  VMs (Servers)  ----------*/

	var server_keys = Object.keys(clusterdata["servers"])

	for (var i in server_keys) {
		var key = server_keys[i];
		addServerToDash(key);
	}

	/*----------  Volumes  ----------*/

	var volume_keys = Object.keys(clusterdata["volumes"])

	for (var i in volume_keys) {
		var volkey = volume_keys[i];
		addVolumeToDash(volkey);
	}

	/*----------  Flavors  ----------*/

	var flavor_keys = Object.keys(clusterdata["flavors"])

	for (var i in flavor_keys) {
		clusterdata["lookup"][flavor_keys[i]] = "flavors"
	}

	/*----------  Floating_IPs  ----------*/

	var ip_keys = Object.keys(clusterdata["floating_ips"]) 

	for (var i in ip_keys) {
		clusterdata["lookup"][ip_keys[i]] = "floating_ips";
	}

	/*----------  Images  ----------*/

	var image_keys = Object.keys(clusterdata["images"]) 

	for (var i in image_keys) {
		clusterdata["lookup"][image_keys[i]] = "images";
	}

	/*----------  Networks  ----------*/

	// var nova_network_keys = Object.keys(clusterdata["networks"]) 

	// for (var i in nova_network_keys) {
	// 	clusterdata["lookup"][nova_network_keys[i]] = "networks";
	// }

	/*----------  Ports  ----------*/

	var port_keys = Object.keys(clusterdata["ports"]) 

	for (var i in port_keys) {
		clusterdata["lookup"][port_keys[i]] = "ports";
	}

	/*----------  Security Groups  ----------*/

	// var security_keys = Object.keys(clusterdata["security_groups"]) 

	// for (var i in security_keys) {
	// 	clusterdata["lookup"][security_keys[i]] = "security_groups";
	// }

	/*----------  SubNets  ----------*/

	// var subnet_keys = Object.keys(clusterdata["subnets"]) 

	// for (var i in subnet_keys) {
	// 	clusterdata["lookup"][subnet_keys[i]] = "subnets";
	// }

	// console.log("We should have just loaded everything.")

	addEventListeners();
	createHeatmap();

	console.log(clusterdata);
}

/**
 * Adds an existing network to the Dashboard
 * @param {[string]} key [The Network ID]
 */
function addNetworkToDash(key) {
	clusterdata["lookup"][key] = "neutronnetwork";
	addToListPane(key, "net", clusterdata["neutronnetwork"][key]["name"]);

	if (clusterdata["neutronnetwork"][key]["router:external"] == true) { addNodeToForceGraph(key, "netpub", 30); }
	else {	addNodeToForceGraph(key, "net", 25); }

	$("#circle" + key).dblclick(function(){	loadNetRightPaneInfo(this.id.substring(6)) });
}

/**
 * Adds an existing router to the Dashboard
 * @param {[string]} key [The ID of the Router]
 */
function addRouterToDash(key) {
	clusterdata["lookup"][key] = "routers";
	addToListPane(key, "rou", clusterdata["routers"][key]["name"]);
	addNodeToForceGraph(key, "rou", 25);
	//console.log("No issues so far")
	var port_keys = Object.keys(clusterdata["ports"]);

	for (var j in port_keys) {
		var porkey = port_keys[j]
		
		// TODO: Can the below be simplified, seems a waste to scan through each port just to find correct networks
		// Same is happening in right pane load for routers
		if (clusterdata["ports"][porkey]["device_id"] == key) {
			var portnet = clusterdata["ports"][porkey]["network_id"];
			// console.log("adding a link between rou: " + key + " and net " + portnet + ".")
			addLinkToForceGraph(key, portnet);
		}
	}
	$("#circle" + key).dblclick(function() {
		loadRouRightPaneInfo(this.id.substring(6))
	});
}

/**
 * Adds an existing server to the Dashboard
 * @param {[string]} key [The instance_id of the server]
 */
function addServerToDash(key) {
	clusterdata["lookup"][key] = "servers";
	addNodeToForceGraph(key, "serv", 18);
	addToListPane(key, "serv", clusterdata["servers"][key]["name"]);
	$("#" + key).click(function(){loadInstRightPaneInfoRef(this.id); /*$("#" + key).data("opentips")[0].hide()*/});
	$("#circle" + key).dblclick(function(){loadInstRightPaneInfoRef(this.id.substring(6)); /*$("#" + key).data("opentips")[0].hide()*/});
	//$("#" + key).dblclick(function(){alert("You just double clicked on " + clusterdata["servers"][key]["name"] );});
	$("#" + key).bind("contextmenu", function(){alert("You just opened a context menu and clicked on " + clusterdata["servers"][key]["name"] );})
	//$("#" + Object.keys(servers)[i]).mouseenter(function(){loadTooltipInfo(Object.keys(servers)[i]);})
	//$("#" + Object.keys(servers)[i]).mouseleave(function(){$("#" + Object.keys(servers)[i]).data("opentips")[0].hide();})
	for (var j in clusterdata["servers"][key]["addresses"]) {
		// TODO: We shouldn't need to check this every time, perhaps edit server data at start to set network by ID not name?
		var net = getNetworkByName(j);
		addLinkToForceGraph(key, net);
	}
	clusterdata["servers"][key]["statistics"] = {};
	clusterdata["servers"][key]["statistics"]["cpu_util"] = {}
	clusterdata["servers"][key]["statistics"]["network.flow.bytes"] = {}
}

/**
 * Adds an existing volume to the Dashboard
 * @param {[string]} key [The volume_id of the volume]
 */
function addVolumeToDash(key) {
	clusterdata["lookup"][key] = "volumes";
	addNodeToForceGraph(key, "vol", 12)

	// The parameter name seems to have changed between OpenStack versions so let's sanity check first.
	var name = clusterdata["volumes"][key]["name"]
	if (name === undefined) {
		name = clusterdata["volumes"][key]["display_name"];
	}

	addToListPane(key, "vol", name)

	for (var j in clusterdata["volumes"][key]["attachments"]) {
		// console.log("Linking vol: " + key + " with instance " + clusterdata['volumes'][key]["attachments"][j]["server_id"])
		addLinkToForceGraph(key, clusterdata['volumes'][key]["attachments"][j]["server_id"]);
	}
	$("#circle" + key).dblclick(function(){
		loadVolRightPaneInfo(this.id.substring(6))
	});
}

function getEntityType(key) {
	return clusterdata["lookup"][key];
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

/**
 *	Loads a new force graph in the center pane.
 */
function loadNewForceGraph() {

	var w = $('#pane-center').width();
	var h = $('#pane-center').height();

	forceGraphData = {	nodes: [/*{ name: "globalendpoint", type: "endpoint", size: 26 }*/], edges: [ /*{ source: 0, target: 1 }*/ ] };

	force = d3.layout.force()
						 .nodes(forceGraphData.nodes)
						 .links(forceGraphData.edges)
						 .size([w, h])
						 .linkDistance(function(d){return getNodeLinkSize(d.source.type)})
						 //.linkStrength(.5)
						 .gravity(0.12)//(function(d) { return getNodeGravity(d.type) })
						 //.friction(.5)
						 .charge(function(d) { return getNodeCharge(d.type) });

	svg = d3.select("#pane-center").append("svg").attr("width", w).attr("height", h)
						.call(zoom = d3.behavior.zoom().scaleExtent([0.2, 5])
							.on("zoom", redraw))
							.on("dblclick.zoom", null)
							.on("contextmenu.zoom", null);

	innervis = svg.append("svg:g").append("svg:g");

	innervis.append("g").attr("class", "links");
	innervis.append("g").attr("class", "nodes");

	edges = svg.select(".links").selectAll("line");
	nodes = svg.select(".nodes").selectAll("circle");	

	//Every time the simulation "ticks", this will be called
	force.on("tick", function() {
		edges.attr("x1", function(d) { return d.source.x; })
			 .attr("y1", function(d) { return d.source.y; })
			 .attr("x2", function(d) { return d.target.x; })
			 .attr("y2", function(d) { return d.target.y; });

		// @TODO: Below is a very silly way to do this, couldn't think of another for now.
		nodes.attr("transform", function(d) { return "translate(" + (d.x - getIconOffset(d.type, "x", d.name)) + "," + (d.y - getIconOffset(d.type, "y", d.name)) + "), scale(" + getIconScale(d.type, d.name) + ")"; })
				.attr("child", function(d) { $("#circle" + d.name).attr("transform", "translate(" + d.x + "," + d.y + ")"); return "updated"; })
				.attr("text", function(d) { $("#label-" + d.name).attr("transform", "translate(" + d.x + "," + (d.y + getNodeTextOffsetY(d.type)) + ")"); return "updated"; });

	});
}

/**
 *	Updates the force Simulation. Call every time we make a change to restart the simulation
 */
function updateForceGraph() {
	edges = edges.data(forceGraphData.edges, function(d) { return d.source.index + "-" + d.target.index; });
	edges.enter().append("line").style("stroke", "#ccc").style("stroke-width", 3);
	edges.exit().remove();

	nodes = nodes.data(forceGraphData.nodes, function(d) {  return d.name;})

	nodes.enter().append("circle").attr("id", function(d) { return "circle" + d.name })
		.attr("r", function(d) { return d.size })
		.style("opacity", function(d) {return getNodeOpacity(d.name)})
		.style("fill", function(d, i) {	return d3.rgb(getNodeColor(d.type)); })
		.attr("stroke-width", function(d){if (d.type == "serv"){return 2} else {return 0}})
		.attr("stroke", function(d){if (d.type == "serv") {return getServerStateColor(d.name)} else {return "transparent"} })
		.call(force.drag).on("mousedown", disableRedraw).on("mouseup", enableRedraw).transition()
	  .duration(750)
	  .ease("elastic");

	nodes.enter().append('text').text(function(d) { return clusterdata[clusterdata["lookup"][d.name]][d.name]["name"] }).attr("id", function(d) { return "label-" + d.name }).attr('class', 'label hidden').attr('text-anchor', 'middle');

	nodes.enter().append("path").attr("d", function(d) {return getNodeShape(d.type, d.name)}).attr("id", function(d) { return d.name })
	.style("fill", function(d, i) {	return d3.rgb("#FFF"); }).attr("class" ,"nodeicon")
	//.attr("transform", function(d) { console.log(d); return "translate(" + (d.x - getIconOffset(d.type, "x", d.name)) + "," + (d.y - getIconOffset(d.type, "y", d.name)) + "), scale(" + getIconScale(d.type, d.name) + ")"; })
		.on("mousedown", disableRedraw).on("mouseup", enableRedraw);

	nodes.exit().remove();
	force.start();
}

/**
 *	Make sure we don't zoom/pan, and save the current zoom/pan settings
 */
function disableRedraw() {
	event.preventDefault();
	//console.log("disabling");
	node_clicked = true;
	scale_save = zoom.scale();
	translate_save = zoom.translate();
}

/**
 *	Re enable zoom/pan and reset settings to what they were before we clicked
 */
function enableRedraw() {
	//console.log("enabling")
	node_clicked = false;
	zoom.scale(scale_save);
	zoom.translate(translate_save);
	// console.log("set redraw false")
}

/**
 *	Redraw the scale and translation of an svg element
 */
function redraw(entity) {
	//console.log(node_clicked)
	if (node_clicked == false) {
		innervis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
		var scale = d3.event.scale;
		offsetx = 18 * scale;
		offsety = 18 * scale;
	}
}

/**
 *	Reset the viewport back to its initial zoom/pan
 */
function resetZoom() {
	node_clicked = false;
	zoom.scale(1);
	zoom.translate([0,0]);
	innervis.attr("transform", "translate(" + zoom.translate() + ")" + " scale(" + zoom.scale() + ")");
}

/**
 *	Returns a colour depending on the state of an instance
 *
 *	@param 	name 	the ID of the element. Used to lookup it's status.
 */
function getServerStateColor(name) {
	var state = clusterdata["servers"][name]["status"];
	if (state == "ACTIVE") {return "#5cb85c";}
	else if (state == "ERROR") {return "#f0ad4e"}
	else if (state == "BUILD") {return "#428bca"}
	else {return "#d9534f";}
}

/**
 *  Returns a charge value depending on the type of node
 *
 *  @param	type	The element type (server, volume, net etc)
 */
function getNodeCharge(type) {
	//console.log(type);
	if (type == "serv") {return [-1000]; }
	else if (type == "vol") { return [-400];	}
	else if (type == "net") { return [-4000]; }
	else if (type == "rou") { return [-5000]; }
	else { return [-800]; }
}

/**
 *  Returns a charge value depending on the type of node
 *
 *  @param	type	The element type (server, volume, net etc)
 */
function getNodeGravity(type) {
	return 0.12;

	if (type == "rou") {return [0.12]; }
	else { return [0.12]; }
}

/**
 *	Returns the colour of a node depending on it's type
 *
 *	@param 	type 	The element type (server, volume, net etc)
 */
function getNodeColor(type) {
	//console.log(type);
	if (type == "serv") {return "#678"; }
	else if (type == "vol") { return "#ffa03a";	}
	else if (type == "net") { return "brown"; }
	else if (type == "rou") { return "purple"; }
	else { return "#087000"; }
}

// TODO: Currently unimplemented. On redraw, any node id in this array will be set to full opacity, and others to 50%
var current_selection = []

/**
 *	Returns the opacity of a node. 100% if selection is empty or it is in selection, else 50% 
 *
 *	@param 	name 	the ID of the element. Used to see if it's in the list
 */
function getNodeOpacity(name) {
	//console.log(!current_selection);
	if (current_selection.length === 0) {	return 1;	}
	else {
		if (current_selection.indexOf(name) >= 0) {	return 1;	}
		else {	return 0.5	}
	}
}

/**
 *	Returns the size of a link depending on the type of elements it connects
 *
 *	@param 	type 	The element type (server, volume, net etc)
 */
function getNodeLinkSize(type) {
	// @TODO Add the ability to collapse a network, which sets the link length to very small and makes instances zoom into and partially hide behind it's network
	if (type == "serv") { return 150; }
	else if (type == "vol") { return 25;	}
	else if (type == "net"){ return 200; }
	else if (type == "rou"){ return 200; }
	else { return 550; }
}

function getNodeTextOffsetY(type) {
	if (type == "serv") { return 30; }
	else if (type == "vol") { return 20;	}
	else { return 40; }
}

/**
 *	Returns the SVG path for an element depending on type
 *
 *	@param 	type 	The element type (server, volume, net etc)
 *	@param 	name 	the ID of the element. Used to see if it's in the list. optional (if not a server)
 */
function getNodeShape(type, name) {
	if (type == "serv") { 
		var imagename = getInstanceImage(name).toLowerCase();
		//console.log(imagename)
		if (imagename.indexOf("ubuntu") != -1) { return nodePaths["ubuntu"]; }
		else if (imagename.indexOf("windows") != -1) { return nodePaths["windows"]; }
		else if (imagename.indexOf("linux") != -1 ||  imagename.indexOf("cirros") != -1 || imagename.indexOf("unix") != -1) { return nodePaths["linux"]; }
		else if (imagename.indexOf("redhat") != -1 || imagename.indexOf("rhel") != -1) { return nodePaths["redhat"]; }
		else if (imagename.indexOf("centos") != -1) { return nodePaths["centos"]; }
		else if (imagename.indexOf("fedora") != -1) { return nodePaths["fedora"]; }
		else if (imagename.indexOf("debian") != -1) { return nodePaths["debian"]; }
		else if (imagename.indexOf("suse") != -1) { return nodePaths["suse"]; }
		else if (imagename.indexOf("android") != -1) { return nodePaths["android"]; }
		else if (imagename.indexOf("hadoop") != -1 ||  imagename.indexOf("savanna") != -1 ||  imagename.indexOf("sahara") != -1 ) { return nodePaths["hadoop"]; }
		else if (imagename.indexOf("wordpress") != -1) { return nodePaths["wordpress"]; }
		else if (imagename.indexOf("magento") != -1) { return nodePaths["magento"]; }
		else if (imagename.indexOf("drupal") != -1) { return nodePaths["drupal"]; }
		else { return nodePaths["port"]; }
	}
	else if (type == "vol") { return nodePaths["volume"]; }
	else if (type == "net"){ return  nodePaths["network"]; }
	else if (type == "netpub") {return nodePaths["publicnetwork"]}
	else if (type == "rou"){ return  nodePaths["router"] }
	else { return nodePaths["undefined"] }
}

/**
 *	Returns the image name for a particular instance ID
 *	
 *	@param 	id 	the ID of the element.
 */
function getInstanceImage(id) {
	var imageid = clusterdata["servers"][id]["image"]["id"];
	if (clusterdata["images"][imageid] === undefined) {
		return "undefined"
	}
	return clusterdata["images"][imageid]["name"];
}

function getIconScale(type, name) {
	if (type == "serv") { return 1 }
	else if (type == "vol") { return 0.6;}
	else if (type == "netpub"){ return 1.5; }
	else if (type == "net"){ return 1.36; }
	else if (type == "rou"){ return 1; }
	else { return 1; }
}

function getIconOffset(type, axis, name) {
	if (type == "vol") { if (axis == "x") {return 10;}	else {return 7.5} }
	else if (type == "serv") { 
		var imagename = getInstanceImage(name).toLowerCase();
		//console.log(imagename);
		if (imagename.indexOf("ubuntu") != -1) { if (axis == "x") { return 14.3; } else { return 12.67 } }
		else if (imagename.indexOf("windows") != -1) { if (axis == "x") { return 11.7; } else { return 11 } }
		else if (imagename.indexOf("linux") != -1 ||  imagename.indexOf("cirros") != -1 || imagename.indexOf("unix") != -1) { if (axis == "x") { return 10.8; } else { return 14.33 } }
		else if (imagename.indexOf("redhat") != -1 || imagename.indexOf("rhel") != -1 ) { return 14.748858; } 
		else if (imagename.indexOf("centos") != -1 ) { return 12.50; }
		else if (imagename.indexOf("fedora") != -1 ) { if (axis == "x") { return 10; } else { return 12 } }
		else if (imagename.indexOf("debian") != -1) { if (axis == "x") {return 12;} else {return 13.10} }
		else if (imagename.indexOf("suse") != -1) { if (axis == "x") {return 14;} else {return 12} }
		else if (imagename.indexOf("android") != -1) { if (axis == "x") {return 11;} else {return 13} }
		else if (imagename.indexOf("drupal") != -1 ) { if (axis == "x") {return 11;} else {return 14} }
		else if (imagename.indexOf("hadoop") != -1 ||  imagename.indexOf("savanna") != -1 ||  imagename.indexOf("sahara") != -1 ) { if (axis == "x") { return 13.3; } else { return 10 } }
		else if (imagename.indexOf("magento") != -1) {if (axis == "x") { return 12; } else { return 14 }}
		else if (imagename.indexOf("wordpress") != -1) {return 14.748858}
		else {  return 12; }
	}
	else if (type == "netpub"){ return 23; }
	else if (type == "net"){ if (axis == "x") { return 21.5; } else { return 22; } }
	else if (type == "rou"){ return 15; }
	else { return 1; }
}

/**
 * Returns the ID of the network with the give name.
 *
 * @param name 	The unique name of the node. Must be unique
 */
function getNetworkByName(name) {
	for (var i in clusterdata["neutronnetwork"]) {
		if (clusterdata["neutronnetwork"][i]["name"] == name) {
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
 *	Adds a node to the force layout
 *
 *	@param name		The unique name of the node. Must be unique
 *	@param type 	What the node represents, currently just instance and volume.
 */
function addNodeToForceGraph(name, type, size) {
	if (size === undefined) { size = 16; }

	forceGraphData.nodes.push({name: name, type: type, size: size});
	updateForceGraph();
}

function getNodeIndexByName(name) {
	return forceGraphData.nodes.filter(function(node) {return node['name'] == name})[0]['index'];
}

/**
 *	Adds a connection between two nodes in the force layout
 *
 *	@param node1	The first node to connect, identified by Name
 *	@param node2 	The second node to connect, identified by Name
 */
function addLinkToForceGraph(node1, node2) {
	// First we need to find the index of each node
	var n1 = getNodeIndexByName(node1);
	var n2 = getNodeIndexByName(node2);
	forceGraphData.edges.push({source: n1, target: n2});

	updateForceGraph();
}

/**
 *	Adds a new heatmap
 */
function createHeatmap() {
	var config = {
		"width": window.screen.width,//$('#pane-center').width(),
		"height": window.screen.height,//$('#pane-center').height(),
		"radius": 150,
		"element": document.getElementById("pane-center"),
		"visible": true,
		"opacity": 25,
		"gradient": { 0.0: "rgb(0,0,197)", 0.3: "rgb(0,255,255)", 0.6: "rgb(0,255,0)", 0.8: "yellow", 1: "rgb(255,0,0)" }
	};

	heatmap = h337.create(config);

	getOpenStackData(saveCpuUtil, "statistics");

	setTimeout(function() {updateHeatmapReal();}, 3000)
}


function setButtonStates() {
	$("#btn-toggle-heat").button('toggle');
	$("#btn-toggle-hdd").button('toggle');
	$("#btn-toggle-ntwk").button('toggle');
	$("#btn-toggle-alert").button('toggle');
}

/**
 * Save a list of timestamped CPU util resources into the cluster data packet.
 * @param  {[Object]} data [The Data to save]
 */
function saveCpuUtil(data) {
	var d = cleanArrayItems(data.stats, "resource_id")
	// console.log(d)
	var keys = Object.keys(d)

	for (var i in keys) {
		var key = keys[i]
		var util = d[key];
		clusterdata["servers"][key]["statistics"]["cpu_util"][util.timestamp] = util.counter_volume;
	}
	
	if (get_cpu_util == true) {
		setTimeout(function() {getOpenStackData(saveCpuUtil, "statistics");}, 10000);
	}
}

/**
 * Updates the heatmap. If passed data, uses that, otherwise pulls the latest value clusterdata
 * @param  {[Object]} data [Optional: CPU Data]
 */
function updateHeatmapReal(data) {
	// console.log("let's update the heatmap!");
	heatmap.store.setDataSet({ max: 100, data: []});
	// This condition will never be met now, kept in in case.
	if (data) {
		util = JSON.parse(data);
		for (var i in util) {
			var node = "#circle" + i;
			//console.log(node);
			var node_heat_x = $(node).position()['left'] + offsetx;
			var node_heat_y = $(node).position()['top'] + offsety;
			console.log(util[i]);
			heatmap.store.addDataPoint(node_heat_x, node_heat_y, util[i]/*getElementHeat(Object.keys(servers)[i])*/);
		}
	}
	else {
		for (var i in clusterdata["servers"]) {
			if (clusterdata["servers"][i]["statistics"]["cpu_util"] && clusterdata["servers"][i]["status"] != "SHUTOFF") {
				// console.log("We have stats etc for this instance!")
				var node = "#circle" + i;
				//var latestdate = Object.keys(clusterdata["servers"][i]["statistics"]["cpu_util"]).sort().pop()
				var latestts = Object.keys(clusterdata["servers"][i]["statistics"]["cpu_util"]);
				var value = clusterdata["servers"][i]["statistics"]["cpu_util"][latestts[latestts.length - 1]];
				if (value === undefined) {
					// console.log("val = no")
					value = 0;
					value -= (10 * Math.random()) * (Math.log(Math.random()));
				} //else {console.log("We have a real CPU util for this instance: " + value)}
				//console.log(value);
				var node_heat_x = $(node).position()['left'] + offsetx;
				var node_heat_y = $(node).position()['top'] + offsety;
				// var rand = normalRandom(20, 500);
				// if (rand < 0) {rand = 0}
				// console.log(rand)
				heatmap.store.addDataPoint(node_heat_x, node_heat_y, value); //+ rand);
			}
		}
		//console.log(heatmap.store.exportDataSet())
		if (plot_heatmap == true) {
			setTimeout(updateHeatmapReal, 1000);
		}
		else {
			heatmap.store.setDataSet({ max: 100, data: []});
		}
	}
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
	// TODO: This is full of UX glitches
	myLayout.slideOpen('west');
	$("#fake-search").animate({width: $("#pane-west").width() - 35}, 1000);
}

function closeSearch() {
	$("#fake-search").animate({width: 200}, 1000);
}

function loadListPane() {
	$('#entity-table').dataTable( {
		"bPaginate": false,
		"bLengthChange": false,
		"bFilter": true,
		"bSort": true,
		"bInfo": false,
		"bAutoWidth": false
	} );

	$('#entity-table').dataTable().fnSetColumnVis( 0, false );

	// $("#entity-table_filter").attr("class", "fake-search");
	// $("#entity-table_filter input").attr("class", "form-control");
}


function filter() {
	var string = $('#fake-search-box').val();
	$('#entity-table').dataTable().fnFilter(string);
}

/**
 *	Add an item to the list pane
 *
 *	@param 	id		Element id
 *	@param 	name 	Name of the element
 */
function addToListPane(id, type ,name) {
  $('#entity-table').dataTable().fnAddData( [id, type ,name] );
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

function getImportValue(source, target) {
	for (var i = 0; i < source.length; i++) {
		if (source[i]["name"] == target ) {
			return source[i]["value"];
		}
	}
	return 0;
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

function getRandomNetworkPlotData() {
  return turnServerListIntoConnections(generateRealServersForNetworkPlot());
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
	var volumes = server["os-extended-volumes:volumes_attached"];
	var realVolumes = existingVolumes(volumes);
	if (realVolumes.length == 0) {
		content += rightPaneField("Volumes", "None");
	}
	else {
		content += "<table class='table table-hover'><thead><tr><th>Volume Name</th><th>Size (GB)</th></tr></thead>"
		for (var i = 0; i < realVolumes.length; i++) {
			volid = realVolumes[i]["id"];
			content += "<tr><td><a href='javascript:loadVolRightPaneInfo(\"" + volid + "\")'>" + clusterdata["volumes"][volid]["name"] + "</a></td><td>" +  clusterdata["volumes"][volid]["size"] + "</td></tr>";
		}
		content += "</tbody></table>"
	}

	//Security groups
	var securitygroups = server["security_groups"];
	if (securitygroups.length == 0) {
		content += rightPaneField("Security Groups", "None");
	}
	else {
		content += "<table class='table table-hover'><thead><tr><th>Security Group Name</th></tr>"//<th>Type</th></tr></thead>"
		for (var i = 0; i < securitygroups.length; i++) {
			secid = securitygroups[i]["name"];
			content += "<tr><td>" + secid + "</td></tr>";
		}
		content += "</tbody></table>"
	}

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
 * Checks that each volume in a list of volumes exists.
 * Returns a list of the volumes that do exist.
 *
 * @param volumes	An array of volume IDs to be checked.
 */
function existingVolumes(volumes) {
	var realVolumes = [];
	volumes.forEach(function(entry) {
		if (clusterdata["volumes"][entry] != undefined) {
			realVolumes.push(x);
		}
	});
	return realVolumes;
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
function rightPaneStatus(status) {
	if (status == "ACTIVE") {	return "<h4><span class='label label-success'>" + status + "</span></h4>"; }
	else if (status == "IN-USE") {	return "<h4><span class='label label-success'>" + status + "</span></h4>"; }
	else if (status == "AVAILABLE") {	return "<h4><span class='label label-info'>" + status + "</span></h4>"; }
	else if (status == "SHUTOFF") {return "<h4><span class='label label-danger'>" + status + "</span></h4>";	}
	else if (status == "BUILD") {return "<h4><span class='label label-default'>" + status + "</span></h4>";}
	else { return "<h4><span class='label label-warning'>" + status + "</span></h4>";	}
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
	myLayout.slideOpen('east');
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
		if (clusterdata["networks"][networksOnRouter[i]] != undefined) {
			content += "<tr><td><a href='javascript:loadNetRightPaneInfo(\"" + networksOnRouter[i] + "\")'>" + clusterdata["networks"][networksOnRouter[i]]["label"] + "</a></td></tr>";
		}
	}
	content += "</tbody></table>"

	//content += JSON.stringify(clusterdata["routers"][id]);
	//console.log(content)
	$("#entity-details").html(content);
}

/**
 *	Console.log cannot be used as a callback, so we use this function instead.
 *
 *	@param str		String to print
 */
function print(str) {
	console.log(JSON.parse(str));
}

/**
 *	Prints the data set for whatever calls it
 */
function printthis() {
	console.log(this);
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
		west__size: 				400, 
		east__size:					450,
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
	if (!cookieExists) toggleStateManagement( true, false );

	// 'Reset State' button requires updated functionality in rc29.15+
	if ($.layout.revision && $.layout.revision >= 0.032915)
		$('#btnReset').show();
}

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

var labelVisible = false;

function toggleLabels() {
	if (labelVisible == true) {
		$('.label').attr('class', 'label hidden');
		labelVisible = false;
	} else {
		$('.label').attr('class', 'label');
		labelVisible = true;
	}
}

function toggleHeatmap() {
	if (plot_heatmap == false) {
		plot_heatmap = true;
		updateHeatmapReal();
	} else {
		plot_heatmap = false;
		updateHeatmapReal();
	}
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

function addDummyImages() {

	var list = ["ubuntu", "redhat", "suse", "linux", "wordpress", "windows", "centos", "fedora", "debian", "hadoop", "magento", "drupal", "android", "noideawhatthisimageis"]

	for (var i in list) {
		var image_id = inventResourceID();
		clusterdata["images"][image_id] = getStructure(image_id, list[i]);
	}

	function getStructure(id, name) {
		return {"status":"ACTIVE","updated":"2014-05-02T21:39:06Z","name":name,"links":[{"href":"http://us-texas-1.cisco.com:8774/v2/72cdf4b772444f55bdbf7b050021f628/images/4ceaf1e6-69bb-49ad-8f15-a30f3dc4004b","rel":"self"},{"href":"http://us-texas-1.cisco.com:8774/72cdf4b772444f55bdbf7b050021f628/images/4ceaf1e6-69bb-49ad-8f15-a30f3dc4004b","rel":"bookmark"},{"href":"http://10.202.4.8:9292/72cdf4b772444f55bdbf7b050021f628/images/4ceaf1e6-69bb-49ad-8f15-a30f3dc4004b","type":"application/vnd.openstack.image","rel":"alternate"}],"created":"2014-05-02T21:25:48Z","minDisk":0,"progress":100,"minRam":0,"metadata":{},"id":id,"OS-EXT-IMG-SIZE:size":1033895936}
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

