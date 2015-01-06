#from __future__ import print_function
import web
#from collections import deque
#import os.path
#import time
import datetime
import iso8601
import json
from novaclient import client as novaclient
from ceilometerclient import client as ceilometerclient
from glanceclient import client as glanceclient
from cinderclient import client as cinderclient
from neutronclient.neutron import client as neutronclient

OS_ENDPOINT = ""
OS_USERNAME = ""
OS_PASSWORD = ""
OS_TENANT = ""

urls = ('/', 'index')
render = web.template.render('')
app = web.application(urls, globals())
_ISO8601_TIME_FORMAT = '%Y-%m-%dT%H:%M:%S'

def get_startup_data():
    print(OS_ENDPOINT)
    nova = novaclient.Client("1.1", username=OS_USERNAME, api_key=OS_PASSWORD, auth_url=OS_ENDPOINT, project_id=OS_TENANT)
    cinder = cinderclient.Client("2", username=OS_USERNAME, api_key=OS_PASSWORD, auth_url=OS_ENDPOINT, project_id=OS_TENANT)
    neutron = neutronclient.Client("2.0", username=OS_USERNAME, password=OS_PASSWORD, auth_url=OS_ENDPOINT, tenant_name=OS_TENANT)
    servers = nova.servers.list(detailed=True)
    flavors = nova.flavors.list()
    images = nova.images.list()
    networks = nova.networks.list()
    floating_ips = nova.floating_ips.list()
    keypairs = nova.keypairs.list()
    security_groups = nova.security_groups.list()
    volumes = cinder.volumes.list()
    routers = neutron.list_routers()
    subnets = neutron.list_subnets()
    ports = neutron.list_ports()
    neutronnetwork = neutron.list_networks()

    packet = {}
    packet["servers"] = {}
    packet["flavors"] = {}
    packet["images"] = {}
    packet["networks"] = {}
    packet["floating_ips"] = {}
    packet["keypairs"] = {}
    packet["security_groups"] = {}
    packet["volumes"] = {}
    packet["routers"] = {}
    packet["subnets"] = {}
    for i in servers:
        packet["servers"][i.id] = i._info
    for i in flavors:
        packet["flavors"][i.id] = i._info
    for i in images:
        packet["images"][i.id] = i._info
    for i in networks:
        packet["networks"][i.id] = i._info
    for i in floating_ips:
        packet["floating_ips"][i.id] = i._info
    for i in keypairs:
        packet["keypairs"][i.id] = i._info
    for i in security_groups:
        packet["security_groups"][i.id] = i._info
    for i in volumes:
        packet["volumes"][i.id] = i._info
    # TODO: Can these be passed directly as JSON? Don't think so, but look into.
    packet["routers"] = json.dumps(routers)
    packet["subnets"] = json.dumps(subnets)
    packet["ports"] = json.dumps(ports)
    packet["neutronnetwork"] = json.dumps(neutronnetwork)

    return json.dumps(packet)


def get_server_list():
    print(OS_ENDPOINT)
    nova = novaclient.Client("1.1", username=OS_USERNAME, api_key=OS_PASSWORD, auth_url=OS_ENDPOINT, project_id=OS_TENANT)
    servers = nova.servers.list(detailed=True)
    #server = {"name": servers[0].name}
    packet = {}
    #print(servers[0])
    for i in servers:
        packet[i.id] = i._info
    #print(packet)
    return json.dumps(packet)

def get_cpu_util_list():
    nova = novaclient.Client("1.1", username=OS_USERNAME, api_key=OS_PASSWORD, auth_url=OS_ENDPOINT, project_id=OS_TENANT)
    servers = nova.servers.list(detailed=True)
    ceilometer = ceilometerclient.get_client("2", os_auth_url=OS_ENDPOINT, os_username=OS_USERNAME, os_password=OS_PASSWORD, os_tenant_name=OS_TENANT )
    packet = {}
    for i in servers:
        u = ceilometer.samples.list(meter_name="cpu_util", q=[{"field":"resource_id","value":i.id}], limit=1)
        if not u:
            packet[i.id] = 0
        else:
            packet[i.id] = u[0].counter_volume
            #print u[0].timestamp
    #print packet
    return json.dumps(packet)

def get_new_cpu_util_list(timestamp):
    ceilometer = ceilometerclient.get_client("2", os_auth_url=OS_ENDPOINT, os_username=OS_USERNAME, os_password=OS_PASSWORD, os_tenant_name=OS_TENANT )
    packet = {}
    if not timestamp:
        t = ceilometer.samples.list(meter_name="cpu_util", limit=1)
        #print t
        timestamp = t[0].timestamp
        ts = iso8601.parse_date(timestamp) - datetime.timedelta(0, 5)
        timestamp = isotime(ts)
        #nowoff = datetime.datetime.now() - datetime.timedelta(3, 10)
        #timestamp = nowoff.isoformat()
        #print timestamp
        #timestamp = str(nowoff.year) + "-" + str(nowoff.month) + "-" + str(nowoff.day - 2) + "T" + str(nowoff.hour) + ":" + str(nowoff.minute) + ":" + str(nowoff.second) + "Z"
    #print timestamp
    u = ceilometer.samples.list(meter_name="cpu_util",  q=[{"field": "timestamp", "op": "ge", "value": timestamp}])
    #print u
    #u = ceilometer.samples.list(meter_name="network.flow.bytes",  limit=1000)
    for i in u:
        #packet[]
        #print i
        if not i.resource_id in packet:
            packet[i.resource_id] = {}
            packet[i.resource_id][i.timestamp] = i.counter_volume
    return json.dumps(packet)

def get_latest_feature_list():
    nova = novaclient.Client("1.1", username=OS_USERNAME, api_key=OS_PASSWORD, auth_url=OS_ENDPOINT, project_id=OS_TENANT)
    servers = nova.servers.list(detailed=True)
    ceilometer = ceilometerclient.get_client("2", os_auth_url=OS_ENDPOINT, os_username=OS_USERNAME, os_password=OS_PASSWORD, os_tenant_name=OS_TENANT )
    packet = {}
    meters = ["cpu_util", "disk.write.requests.rate"]
    for i in servers:
        packet[i.id] = {}
        for j in meters:
            packet[i.id][j] = {}
            u = ceilometer.samples.list(meter_name=j, q=[{"field":"resource_id","value":i.id}], limit=1)
            #print u
            if not u:
                #print u
                packet[i.id][j]["value"] = 0
                packet[i.id][j]["timestamp"] = 0
            else:
                packet[i.id][j]["value"] = u[0].counter_volume
                packet[i.id][j]["timestamp"] = u[0].timestamp
    return json.dumps(packet)

def get_latest_network_flow(timestamp):
    ceilometer = ceilometerclient.get_client("2", os_auth_url=OS_ENDPOINT, os_username=OS_USERNAME, os_password=OS_PASSWORD, os_tenant_name=OS_TENANT )
    packet = {}
    if not timestamp:
        t = ceilometer.samples.list(meter_name="network.flow.bytes", limit=1)
        #print t
        timestamp = t[0].timestamp
        ts = iso8601.parse_date(timestamp) - datetime.timedelta(0, 5)
        timestamp = isotime(ts)
        #nowoff = datetime.datetime.now() - datetime.timedelta(3, 10)
        #timestamp = nowoff.isoformat()
        #print timestamp
        #timestamp = str(nowoff.year) + "-" + str(nowoff.month) + "-" + str(nowoff.day - 2) + "T" + str(nowoff.hour) + ":" + str(nowoff.minute) + ":" + str(nowoff.second) + "Z"
	#print timestamp
    u = ceilometer.samples.list(meter_name="network.flow.bytes",  q=[{"field": "timestamp", "op": "ge", "value": timestamp}])
    #u = ceilometer.samples.list(meter_name="network.flow.bytes",  limit=1000)
    for i in u:
        #packet[]
        #print i
        if not i.resource_metadata["instance_id"] in packet:
            packet[i.resource_metadata["instance_id"]] = {}
        packet[i.resource_metadata["instance_id"]][i.timestamp] = json.dumps(i.resource_metadata)
    return json.dumps(packet)

def isotime(at=None, subsecond=False):
    """Stringify time in ISO 8601 format."""
    if not at:
        at = utcnow()
    st = at.strftime(_ISO8601_TIME_FORMAT
                     if not subsecond
                     else _ISO8601_TIME_FORMAT_SUBSECOND)
    tz = at.tzinfo.tzname(None) if at.tzinfo else 'UTC'
    st += ('Z' if tz == 'UTC' else tz)
    return st

def get_image_list():
    glance = glanceclient.Client()

 
class index:

    def GET(self):
        return render.index()
         
    def POST(self):
        global OS_ENDPOINT
        global OS_USERNAME
        global OS_PASSWORD
        global OS_TENANT
        OS_ENDPOINT = web.input().OS_endpoint
        OS_USERNAME = web.input().OS_username
        OS_PASSWORD = web.input().OS_password
        OS_TENANT = web.input().OS_tenant
        param = web.input().params
        print("Operation: " + param)
        if param == "get_latest_feature_list":
            data = get_latest_feature_list()
        elif param == "get servers":
            data = get_server_list()
        elif param == "get cpu_util":
            #TODO: we probably want to be able to get these on a per instance basis, or as a group. For now, just a group
            data = get_cpu_util_list()
        elif param == "get cpu":
            data = get_new_cpu_util_list([])
        elif param == "get startup data":
            data = get_startup_data()
        elif param == "get network flow":
            data = get_latest_network_flow([])
        else:
            data = "Hmmm. Your parameter appears wrong. Try again..."
        return data

 
if __name__ == '__main__':
    app.run()
