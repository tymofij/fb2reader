dist:
	mkdir -p dist

build:
	mkdir -p build

firefox: dist
	cd src && zip -r9 ../dist/firefox.zip *

chrome: build dist
	cd build && rm -rf
	cp -r src/css build
	cp -r src/icons build
	cp src/tools.js build
	cp src-chrome/content.js build
	cp src-chrome/manifest.json build
	cp -r src-chrome/_locales build
	cd build && zip -r9 ../dist/chrome.zip *