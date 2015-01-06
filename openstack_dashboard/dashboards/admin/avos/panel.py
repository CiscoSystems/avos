# The main panel

from django.utils.translation import ugettext_lazy as _

import horizon

from openstack_dashboard.dashboards.admin import dashboard


class Avos(horizon.Panel):
    name = _("Avos")
    slug = 'avos'
    permissions = ()


dashboard.Admin.register(Avos)
