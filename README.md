             _  ____   ____   ___     ______   
            / \|_  _| |_  _|.'   `. .' ____ \  
           / _ \ \ \   / / /  .-.  \| (___ \_| 
          / ___ \ \ \ / /  | |   | | _.____`.  
        _/ /   \ \_\ ' /   \  `-'  /| \____) | 
       |____| |____|\_/     `.___.'  \______.' 
       Analytics & Visualisation on OpenStack

Cisco's Project AVOS attempts to provide a feature rich and intuitive analytics
dashboard for OpenStack clouds giving developers and operators quick insight into
your clouds configuration, state, performance and faults. 

![AVOS Dashboard](/openstack_dashboard/static/screens/screen1.png "AVOS")

Install Instructions
-----------

The current master branch is a fork of stable/juno horizon with AVOS installed.
For now, the standlone version (working outside horizon) has halted development,
though is still available from the branch 'standalone'.

Simply clone AVOS in place of a horizon install, and everything will work.

To access AVOS, log into horizon and see the panel under Admin > System > AVOS.

Current Limitations: 
-----------

This is a beta release, AVOS still has some UX glitches, needs full cross browser
testing and has a whole load of features still to come in future releases.

Installation of AVOS currently requires Ceilometer and Neutron, future releases 
will allow for a smart feature rollback that will work without these.

The Network plot (with VM to VM traffic flows) requires modifications to ceilometer 
not yet released. This feature will not work, and has temporarily been disabled, 
but the rest of AVOS will work.

We've been using Ceilometer intervals of 5 seconds, by default Ceilometer stores 
data every 10 minutes. Don't expect your heatmaps to update often unless you change 
this in your publisher .yaml files.

Questions
-----------

Any questions/bugs/feature requests? File an issue or Get in touch:

Alex Holden (ajonasho@cisco.com, a@lexholden.com)

----------------------------------------------

=============================
Horizon (OpenStack Dashboard)
=============================

Horizon is a Django-based project aimed at providing a complete OpenStack
Dashboard along with an extensible framework for building new dashboards
from reusable components. The ``openstack_dashboard`` module is a reference
implementation of a Django site that uses the ``horizon`` app to provide
web-based interactions with the various OpenStack projects.

* Release management: https://launchpad.net/horizon
* Blueprints and feature specifications: https://blueprints.launchpad.net/horizon
* Issue tracking: https://bugs.launchpad.net/horizon


Using Horizon
=============

See ``doc/source/topics/install.rst`` about how to install Horizon
in your OpenStack setup. It describes the example steps and
has pointers for more detailed settings and configurations.

It is also available at http://docs.openstack.org/developer/horizon/topics/install.html.

Getting Started for Developers
==============================

``doc/source/quickstart.rst`` or
http://docs.openstack.org/developer/horizon/quickstart.html
describes how to setup Horizon development environment and start development.

Building Contributor Documentation
==================================

This documentation is written by contributors, for contributors.

The source is maintained in the ``doc/source`` directory using
`reStructuredText`_ and built by `Sphinx`_

.. _reStructuredText: http://docutils.sourceforge.net/rst.html
.. _Sphinx: http://sphinx-doc.org/

* Building Automatically::

    $ ./run_tests.sh --docs

* Building Manually::

    $ tools/with_venv.sh sphinx-build doc/source doc/build/html

Results are in the ``doc/build/html`` directory
