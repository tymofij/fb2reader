#
# If you wish to perform make update, replace the following PROFILE_DIRECTORY
# by whatever is appropriate on your machine.
#

FIREFOX_PROFILE="/home/tim/.mozilla/firefox/dev"
SEAMONKEY_PROFILE="/home/tim/.mozilla/seamonkey/dev"
INSTALL_DIRECTORY="/extensions/fb2reader@clear.com.ua"

XPI_FILE="fb2reader.xpi"
VERSION="0.28.1"

update_fx: versionize_rdf $(DESTINATIONS)
	mkdir -p $(FIREFOX_PROFILE)$(INSTALL_DIRECTORY)
	rm -Rf $(FIREFOX_PROFILE)$(INSTALL_DIRECTORY)/*
	cp -R src/* $(FIREFOX_PROFILE)$(INSTALL_DIRECTORY)
	rm -f $(FIREFOX_PROFILE)/compreg.dat
	rm -f $(FIREFOX_PROFILE)/xpti.dat
	rm -f $(FIREFOX_PROFILE)/extensions.*

update_sm: versionize_rdf $(DESTINATIONS)
	mkdir -p $(SEAMONKEY_PROFILE)$(INSTALL_DIRECTORY)
	rm -Rf $(SEAMONKEY_PROFILE)$(INSTALL_DIRECTORY)/*
	cp -R src/* $(SEAMONKEY_PROFILE)$(INSTALL_DIRECTORY)
	rm -f $(SEAMONKEY_PROFILE)/compreg.dat
	rm -f $(SEAMONKEY_PROFILE)/xpti.dat
	rm -f $(SEAMONKEY_PROFILE)/extensions.*

run: update_fx
	firefox -P dev -no-remote

sea: update_sm
	~/bin/seamonkey/seamonkey -P dev -no-remote

versionize_rdf:
	sed -e "s/<em:version>.*<\/em:version>/<em:version>$(VERSION)<\/em:version>/" \
	    src/install.rdf > tmp
	cat tmp > src/install.rdf
	rm tmp

xpi: versionize_rdf
	@if test -e $(XPI_FILE) ; then \
		rm $(XPI_FILE) ;\
	fi
	cd src && zip -r9 ../$(XPI_FILE) *
