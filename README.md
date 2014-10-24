             _  ____   ____   ___     ______   
            / \|_  _| |_  _|.'   `. .' ____ \  
           / _ \ \ \   / / /  .-.  \| (___ \_| 
          / ___ \ \ \ / /  | |   | | _.____`.  
        _/ /   \ \_\ ' /   \  `-'  /| \____) | 
       |____| |____|\_/     `.___.'  \______.' 
       Analytics & Visualisation on OpenStack

Cisco's Project AVOS attempts to provide a feature rich and intuitive analytics dashboard for OpenStack clouds giving developers and operators quick insight into your clouds configuration, state, performance and faults. 

AVOS is stateless*,  and uses the OpenStack APIs and processes the data client side in Javascript, keeping the load of your control node

Install Instructions
-----------
Please bear with us while the repo is migrated and the instructions are updated, the current documentation is slightly out of date, but works with some elbow grease. Is also in the process of being migrated into a horizon component.

First, install the following on the computer you want to run AVOS on (not necessarily the same as your OS cluster). on ubuntu, run (on mac, use pip instead):

    sudo apt-get install python-webpy python-ceilometerclient python-novaclient python-glanceclient python-neutronclient python-cinderclient
    
Note: on a Mac, you'll have to download web.py seperately: http://webpy.org/static/web.py-0.37.tar.gz Then extract, and run:

    sudo python setup.py install

You also need to make a few modifications to a standard (official manual guided) OpenStack install to allow the API's to be accessible. These should be made to your control node.

in /etc/keystone/keystone.conf change the following:

       1.     Uncomment admin_token and set a password
       2.     Uncomment bind_host and set to 0.0.0.0
       3.     Uncomment public_port and set to 5000
       4.     Uncomment admin_port and set to 35357

Then run:

    sudo service keystone restart
    sudo service nova-api restart
    sudo service nova-compute restart
              
Now you need to change the OS parameters to the username, password, auth url and tenant of your cluster, currently hardcoded in:

    static/js/credentials.js 

Then simply run:

    python app.py

and you're good to go. Access AVOS through port 8080 (default) in browser.

Current Limitations: 
-----------

The Network plot requires modifications to ceilometer not yet released. This Feature will not work, but the rest of AVOS will.

We've been using Ceilometer intervals of 5 seconds, by default Ceilometer stores data every 10 minutes. Don't expect your heatmaps to update often unless you change this in your publisher .yaml files.

Questions
-----------

Any questions/bugs/feature requests? Get in touch:

Alex Holden (ajonasho@cisco.com, a@lexholden.com)



