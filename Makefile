dist:
	mkdir -p dist

firefox: dist
	cd src && zip -r9 ../dist/firefox.zip *