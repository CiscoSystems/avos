       ___                        _  _ 
      /___\ _ __ __      __  ___ | || |
     //  //| '__|\ \ /\ / / / _ \| || |
    / \_// | |    \ V  V / |  __/| || |
    \___/  |_|     \_/\_/   \___||_||_|
    Analytics Visualisation on OpenStack

Cisco's Project Orwell attempts to provide a feature rich and intuitive alternative dashboard to OpenStack that can give you a quick insight into the status of your cloud. Polling data through the OpenStack APIs and calculating everything client side using Javascript, Orwell keeps the load off your control node.

Install Instructions
-----------

on ubuntu, run:

    sudo apt-get install python-webpy python-ceilometerclient python-novaclient

You also need to make a few modifications to a standard OpenStack install to allow the API's to be accessible.

in /etc/keystone/keystone.conf change the following:

1.     Uncomment admin_token and set a password
2.     Uncomment bind_host and set to 0.0.0.0
3.     Uncomment public_port and set to 5000
4.     Uncomment admin_port and set to 35357

Then run:

	sudo service keystone restart
	sudo service nova-api restart
	sudo service nova-compute restart
              
Now you need to change the OS parameters, currently hardcoded in static/js/main.js to the username, password, auth url and tenant of your cluster.

Then simply run:

       python app.py

and you're good to go. Access Orwell through port 8080 (default) in browser.

Current Limitations: 
-----------

Cannot read from an openstack cluster in a different IP block - i.e. app.py must be run on your control node or on a host machine that contains your control node in a vm (e.g. if using devstack). This is probably due to the individual components listen IP needing changing. Will be fixed in a future release.

