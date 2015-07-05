zip -9 -r sl.xpi chrome defaults install.rdf chrome.manifest
wget --post-file=sl.xpi http://localhost:8888/
