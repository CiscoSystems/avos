# vim: tabstop=4 shiftwidth=4 softtabstop=4

from django.utils.translation import ugettext_lazy as _

import horizon

from openstack_dashboard.dashboards.admin import dashboard


class Avos(horizon.Panel):
    name = _("Avos")
    slug = 'avos'
    permissions = ('openstack.roles.admin',)


dashboard.Admin.register(Avos)
