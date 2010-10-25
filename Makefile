#
# If you wish to perform make update, replace the following PROFILE_DIRECTORY
# by whatever is appropriate on your machine.
#

PROFILE_DIRECTORY="/home/tim/.mozilla/firefox/dev"
INSTALL_DIRECTORY="$(PROFILE_DIRECTORY)/extensions/fb2reader@clear.com.ua"

XPI_FILE="fb2reader.xpi"
VERSION="0.12"

update: $(DESTINATIONS)
	rm -Rf $(INSTALL_DIRECTORY)/*
	cp -R src/* $(INSTALL_DIRECTORY)
	rm -f $(PROFILE_DIRECTORY)/compreg.dat
	rm -f $(PROFILE_DIRECTORY)/xpti.dat
	rm -f $(PROFILE_DIRECTORY)/extensions.*

run: update
	~/bin/firefox/firefox -P dev -no-remote

36: update
	~/bin/firefox-3.6/firefox -P dev -no-remote

xpi:
	@if test -e $(XPI_FILE) ; then \
		rm $(XPI_FILE) ;\
	fi	
	cd src && zip -r9 ../$(XPI_FILE) *

prep: xpi
	sed -e "s/<em:version>.*<\/em:version>/<em:version>$(VERSION)<\/em:version>/" \
	    -e "s/amp;v=[0-9\.]\+/amp;v=$(VERSION)/" \
	    src/install.rdf > tmp
	cat tmp > src/install.rdf
	rm tmp
	sed -e "s/<em:version>.*<\/em:version>/<em:version>$(VERSION)<\/em:version>/" \
	    -e "s/-[0-9\.]\+.xhtml/-$(VERSION).xhtml/" \
	    -e "s/<em:updateHash>.*<\/em:updateHash>/<em:updateHash>sha1:`sha1sum $(XPI_FILE) | awk '{print $$1}'`<\/em:updateHash>/" \
	    updates/update.rdf > tmp
	cat tmp > updates/update.rdf
	rm tmp
	cp updates/update.rdf .

release: 
	# make prep and sign updates.rdf with mccoy 
	scp fb2reader.xpi update.rdf updates/fb2reader-$(VERSION).xhtml tim@clear.com.ua:~/public_html.firefox/xpi/
