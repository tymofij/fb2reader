#
# If you wish to perform make update, replace the following PROFILE_DIRECTORY
# by whatever is appropriate on your machine.
#

PROFILE_DIRECTORY="/home/tim/.mozilla/firefox/dev"
INSTALL_DIRECTORY="$(PROFILE_DIRECTORY)/extensions/fb2reader@clear.com.ua"

XPI_FILE="fb2reader.xpi"
VERSION="0.14"

update: versionize_rdf $(DESTINATIONS)
	rm -Rf $(INSTALL_DIRECTORY)/*
	cp -R src/* $(INSTALL_DIRECTORY)
	rm -f $(PROFILE_DIRECTORY)/compreg.dat
	rm -f $(PROFILE_DIRECTORY)/xpti.dat
	rm -f $(PROFILE_DIRECTORY)/extensions.*

run: update
	~/bin/firefox/firefox -P dev -no-remote

36: update
	~/bin/firefox-3.6/firefox -P dev -no-remote

versionize_rdf:
	sed -e "s/&VERSION/$(VERSION)/" \
	    src/install.rdf > tmp
	cat tmp > src/install.rdf
	rm tmp

xpi: versionize_rdf
	@if test -e $(XPI_FILE) ; then \
		rm $(XPI_FILE) ;\
	fi	
	cd src && zip -r9 ../$(XPI_FILE) *

prep: xpi
	sed -e "s/VERSION/$(VERSION)/" \
	    -e "s/SHA1SUM/`sha1sum $(XPI_FILE) | awk '{print $$1}'`/" \
	    updates/update.rdf > updates.rdf

release: 
	# make prep and sign updates.rdf with mccoy 
	sed -e "s/VERSION/$(VERSION)/" \
	    -e "s/DATE/`date +%F`/" updates/changes.xhtml > changes.xhtml
	scp fb2reader.xpi update.rdf changes.xhtml tim@clear.com.ua:~/public_html.firefox/xpi/
	rm changes.xhtml updates.rdf