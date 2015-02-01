import logging
import datetime
import iso8601
import json

from django.conf import settings
from django.http import HttpResponse
from django.utils.translation import ugettext_lazy as _
from django.core.urlresolvers import reverse
from django.core.urlresolvers import reverse_lazy
from django.http import HttpResponse  # noqa
from django.views.generic import TemplateView  # noqa
from django.views.generic import View  # noqa

from horizon import views
from horizon import exceptions
from openstack_dashboard import api

LOG = logging.getLogger("AVOS:::")

_ISO8601_TIME_FORMAT = '%Y-%m-%dT%H:%M:%S'

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

class IndexView(views.APIView):
    # A very simple class-based view...
    template_name = 'admin/avos/index.html'

    @property
    def is_router_enabled(self):
        network_config = getattr(settings, 'OPENSTACK_NEUTRON_NETWORK', {})
        return network_config.get('enable_router', True)

    def add_resource_url(self, view, resources):
        tenant_id = self.request.user.tenant_id
        for resource in resources:
            if (resource.get('tenant_id')
                    and tenant_id != resource.get('tenant_id')):
                continue
            resource['url'] = reverse(view, None, [str(resource['id'])])

    def _check_router_external_port(self, ports, router_id, network_id):
        for port in ports:
            if (port['network_id'] == network_id
                    and port['device_id'] == router_id):
                return True
        return False

    def _get_networks(self, request):
        # Get neutron data
        # if we didn't specify tenant_id, all networks shown as admin user.
        # so it is need to specify the networks. However there is no need to
        # specify tenant_id for subnet. The subnet which belongs to the public
        # network is needed to draw subnet information on public network.
        try:
            neutron_networks = api.neutron.network_list(request)
        except Exception:
            neutron_networks = []
        LOG.warning(neutron_networks)
        networks = [{'name': network.name,
                     'id': network.id,
                     'status': network.status,
                     'subnets': [{'cidr': subnet.cidr} for subnet in network.subnets],
                     'router:external': network['router:external']}
                    for network in neutron_networks]
        self.add_resource_url('horizon:project:networks:detail', networks)

        # Add public networks to the networks list
        if self.is_router_enabled:
            try:
                neutron_public_networks = api.neutron.network_list(request, **{'router:external': True})
            except Exception:
                neutron_public_networks = []
            my_network_ids = [net['id'] for net in networks]
            for publicnet in neutron_public_networks:
                if publicnet.id in my_network_ids:
                    continue
                try:
                    subnets = [{'cidr': subnet.cidr} for subnet in publicnet.subnets]
                except Exception:
                    subnets = []
                networks.append({
                    'name': publicnet.name,
                    'id': publicnet.id,
                    'status': publicnet.status,
                    'subnets': subnets,
                    'router:external': publicnet['router:external']})

        return sorted(networks, key=lambda x: x.get('router:external'), reverse=True)

    def _get_routers(self, request):
        if not self.is_router_enabled:
            return []
        try:
            neutron_routers = api.neutron.router_list(request)
        except Exception:
            neutron_routers = []
        LOG.warning(neutron_routers)
        routers = [{'id': router.id,
                    'name': router.name,
                    'status': router.status,
                    'external_gateway_info': router.external_gateway_info}
                   for router in neutron_routers]
        self.add_resource_url('horizon:project:routers:detail', routers)
        return routers

    def _get_servers(self, request):
        # Get nova data
        try:
            servers, more = api.nova.server_list(request, all_tenants=True)
        except Exception:
            LOG.warning("We have no servers, something went wrong!")
            servers = []
        console_type = getattr(settings, 'CONSOLE_TYPE', 'AUTO')
        if console_type == 'SPICE':
            console = 'spice'
        else:
            console = 'vnc'
        LOG.warning(servers)
        data = [{
                'addresses': server.addresses,
                'console': console,
                'created': server.created,
                'flavor': server.flavor,
                'id': server.id,
                'image': server.image,
                'key_name': server.key_name,
                'name': server.name,
                'status': server.status,
                'physical_host': getattr(server, 'OS-EXT-SRV-ATTR:host'),
                # 'os-extended-volumes:volumes_attached': getattr(server, 'os-extended-volumes:volumes_attached'),
                'task': getattr(server, 'OS-EXT-STS:task_state')
            } for server in servers]
        self.add_resource_url('horizon:project:instances:detail', data)
        return data

    def _get_volumes(self, request):
        try:
            volumes = api.cinder.volume_list(request, search_opts={'all_tenants':1})
        except Exception:
            volumes = []
        LOG.warning(volumes)
        data = [{
                'id': volume.id,
                'name': volume.name,
                'created': volume.created_at,
                'attachments': volume.attachments,
                'size': volume.size,
                'physical_host': getattr(volume, 'os-vol-host-attr:host'),
                'status': volume.status
        } for volume in volumes]
        return data

    def _get_flavors(self, request):
        try:
            flavors = api.nova.flavor_list(request)
        except Exception:
            LOG.warning("Something went wrong getting flavors")
        LOG.warning(flavors)
        data = [{
                'name': flavor.name,
                'id': flavor.id,
                'ram': flavor.ram,
                'vcpus': flavor.vcpus,
                'disk': flavor.disk
            } for flavor in flavors]
        return data

    def _get_floating_ips(self, request):
        try:
            floating_ips = api.nova.FloatingIpManager.list(self)
        except Exception:
            LOG.warning("We have no floating ips")
            floating_ips = []
        LOG.warning(floating_ips)
        data = {}
        return data

    def _get_images(self, request):
        try:
            (images, self._more, self._prev) = api.glance.image_list_detailed(self.request)
        except Exception:
            images = []
            exceptions.handle(self.request, _("Unable to retrieve images."))
        data = [{
                'name': image.name,
                'id': image.id
        } for image in images]
        return data

    def _get_ports(self, request):
        try:
            neutron_ports = api.neutron.port_list(request)
        except Exception:
            neutron_ports = []

        ports = [{'id': port.id,
                  'network_id': port.network_id,
                  'device_id': port.device_id,
                  'fixed_ips': port.fixed_ips,
                  'device_owner': port.device_owner,
                  'status': port.status}
                 for port in neutron_ports]
        self.add_resource_url('horizon:project:networks:ports:detail',
                              ports)
        return ports

    def _get_keypairs(self, request):
        try:
            keypairs = api.nova.keypair_list(request)
        except Exception:
            keypairs = []
        LOG.warning(keypairs)
        data = [{
                'name': keypair.name,
                'fingerprint': keypair.fingerprint
        } for keypair in keypairs]
        return data

    def _get_security_groups(self, request):
        try:
            secgroups = api.nova.SecurityGroupManager.list(request) # @TODO Doesn't Work, commented for now
        except Exception:
            secgroups = []
        LOG.warning(secgroups)
        data = [{
            'id': secgroup.id
        } for secgroup in secgroups]
        return data


    def _prepare_gateway_ports(self, routers, ports):
        # user can't see port on external network. so we are
        # adding fake port based on router information
        for router in routers:
            external_gateway_info = router.get('external_gateway_info')
            if not external_gateway_info:
                continue
            external_network = external_gateway_info.get(
                'network_id')
            if not external_network:
                continue
            if self._check_router_external_port(ports,
                                                router['id'],
                                                external_network):
                continue
            fake_port = {'id': 'gateway%s' % external_network,
                         'network_id': external_network,
                         'device_id': router['id'],
                         'fixed_ips': []}
            ports.append(fake_port)

    def _get_meters(self, request):
        try:
            meters = api.ceilometer.meter_list(request)
        except Exception:
            meters = []
        LOG.warning(meters)
        data = [{
            'name': meter.name,
            'type': meter.type,
            'unit': meter.unit,
            'id': meter.resource_id
        } for meter in meters]
        return data

    def _get_statistics(self, request, timestamp):
        # t = api.ceilometer.sample_list(request, meter_name="cpu_util")
        # LOG.warning(t)
        try:
            if not timestamp:
                # LOG.warning("we have no ts")
                t = api.ceilometer.sample_list(request, meter_name="cpu_util")
                # LOG.warning(t)
                timestamp = t[0].timestamp
                ts = iso8601.parse_date(timestamp) - datetime.timedelta(0, 5)
                timestamp = isotime(ts)
                # LOG.warning(timestamp)
            stats = api.ceilometer.sample_list(request, "cpu_util", query=[{"field": "timestamp", "op": "ge", "value": timestamp}])
            # u = ceilometer.samples.list(meter_name="cpu_util",  q=[{"field": "timestamp", "op": "ge", "value": timestamp}])
        except Exception:
            stats = []
        # LOG.warning(stats)
        data = [{
            "timestamp": stat.timestamp,
            "counter_name": stat.counter_name,
            "resource_id": stat.resource_id,
            "counter_unit": stat.counter_unit,
            "counter_volume": stat.counter_volume
        } for stat in stats]
        return data

    def get(self, request, *args, **kwargs):
        if self.request.is_ajax() and self.request.GET.get("avosstartup", False):
            LOG.warning("We're getting all cluster data")
            data = {
                    'flavors': self._get_flavors(request),
                    'floating_ips': self._get_floating_ips(request),
                    'images': self._get_images(request),
                    'keypairs': self._get_keypairs(request),
                    'meters': self._get_meters(request),
                    #'networks': self._get_networks(request),
                    'networks': self._get_networks(request),
                    'ports': self._get_ports(request),
                    'routers': self._get_routers(request),
                    # 'security_groups': self._get_security_groups(request),
                    'servers': self._get_servers(request), 
                    #'subnets': self._get_subnets(request), 
                    'volumes': self._get_volumes(request)
                }
            self._prepare_gateway_ports(data['routers'], data['ports'])
            json_string = json.dumps(data, ensure_ascii=False)
            return HttpResponse(json_string, content_type='text/json')
        elif self.request.is_ajax() and self.request.GET.get("statistics", False):
            data = {
                'stats': self._get_statistics(request, False)
            }
            # LOG.warning("We got some stats!")
            json_string = json.dumps(data, ensure_ascii=False)
            return HttpResponse(json_string, content_type='text/json')
        else:
            LOG.warning("We're not asking for AVOS content, so super it.")
            return super(IndexView, self).get(request, *args, **kwargs)
         
    def post(request, *args, **kwargs):
        if request.is_ajax() :
            LOG.warning("We're making a POST")
    	return "hi"
        global OS_ENDPOINT
        global OS_USERNAME
        global OS_PASSWORD
        global OS_TENANT
        OS_ENDPOINT = "http://192.168.57.20:5000/v2.0"
        OS_USERNAME = "admin"
        OS_PASSWORD = "stack"
        OS_TENANT = "admin"
        param = "get startup data" 
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
