zip -9 -r sl.xpi chrome defaults install.rdf chrome.manifest -x "*.DS_Store"
wget --post-file=sl.xpi http://localhost:8888/
