#
# If you wish to perform make update, replace the following PROFILE_DIRECTORY
# by whatever is appropriate on your machine.
#

PROFILE_DIRECTORY="/home/tim/.mozilla/firefox/dev"
INSTALL_DIRECTORY="$(PROFILE_DIRECTORY)/extensions/fb2reader@clear.com.ua"

XPI_FILE="fb2reader.xpi"
VERSION="0.6"

update: $(DESTINATIONS)
	rm -Rf $(INSTALL_DIRECTORY)/*
	cp -R src/* $(INSTALL_DIRECTORY)
	rm -f $(PROFILE_DIRECTORY)/compreg.dat
	rm -f $(PROFILE_DIRECTORY)/xpti.dat
	rm -f $(PROFILE_DIRECTORY)/extensions.*

xpi:
	@if test -e $(XPI_FILE) ; then \
		rm $(XPI_FILE) ;\
	fi	
	cd src && zip -r9 ../$(XPI_FILE) * 
	
release:
	# make xpi
	# sha1sum fb2reader.xpi
	# put that sum into updates.rdf
	# put  version into updates.rdf
	# sign updates.rdf with mccoy
	scp fb2reader.xpi update.rdf updates/fb2reader-$(VERSION).xhtml tim@clear.com.ua:~/public_html.firefox/xpi/
