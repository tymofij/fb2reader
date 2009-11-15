# A Makefile for OpenBerg
# Authors : David Teller and Ben Mesman

#
# If you wish to perform make update, replace the following PROFILE_DIRECTORY
# by whatever is appropriate on your machine.
#

PROFILE_DIRECTORY="/home/tim/.mozilla/firefox/dev"
INSTALL_DIRECTORY="$(PROFILE_DIRECTORY)/extensions/fb2reader@clear.com.ua"

#
# Everything else should work without any tinkering
#

SOURCES=$(shell find src/ -type f ! -path '*CVS*' ! -name "*~" ! -name ".\#*")
DESTINATIONS=$(patsubst %.idl, %.xpt, $(patsubst src/%, build/%, $(SOURCES)))

# except IDL_PATH, check if the path exists and contains .idl files
IDL_PATH   = /usr/share/idl/xulrunner-1.9.1.5/stable/:/usr/share/idl/xulrunner-1.9.1.5/unstable/
IDLS       = $(firstword $(wildcard $(subst :, ,$(IDL_PATH))))
XPIDL_OPTS = -w -v -I $(IDLS) -m typelib
XPIDL_PATH = /home/tim/bin:usr/lib/firefox:/usr/lib/xulrunner/sdk/bin
XPIDL      = $(firstword $(wildcard $(addsuffix /xpidl,$(subst :, ,$(XPIDL_PATH)))))



all: clean xpi

clean:
	rm -Rf build fb2_reader.xpi
	rm -f `find src -name "*~" -o -name "*.xpt"`

build/%: src/%
	install -D $< $@

build/%.xpt : src/%.idl
	$(XPIDL) $(XPIDL_OPTS) -e $@ $< 

distribution: clean
	tar zcvf ../fb2_reader.tgz . --exclude "*CVS*" --exclude "*~" --exclude ".\#" --exclude ".hg"

xpi: $(DESTINATIONS)
	rm -Rf `find build -path '*CVS*' -o -name "*~"`
#	pwd
#	cd build
#	echo "======================"
#	pwd
#	zip ./openberg_lector.xpi -r *
#	cd ..
#	echo "----------------------"
	
update: all
	rm -Rf $(INSTALL_DIRECTORY)/*
	#unzip -uo openberg_lector.xpi -d $(INSTALL_DIRECTORY)
	cp -R build/* $(INSTALL_DIRECTORY)
	rm -f $(PROFILE_DIRECTORY)/compreg.dat
	rm -f $(PROFILE_DIRECTORY)/xpti.dat
	rm -f $(PROFILE_DIRECTORY)/extensions.*

.PHONY: clean distribution
