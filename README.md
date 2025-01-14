FictionBook (.fb2) e-book reader addon for Firefox

**<a href="https://addons.mozilla.org/firefox/addon/fb2-reader/">Install from Mozilla Addons</a>**, also see screenshots and reviews there.

---

The reader supports links, images, footnotes, TOC, tables, zipped books (only online, local books have to be unzipped)

Firefox Integration
-------------------

* Bookmarks
* Searching with Ctrl+F
* Font size and typeface
* Print and Print preview
* Styling with Stylus

FAQ
---

### Reading local .fb2 files in Linux

Requires setting FB2 mimetype to text/xml. See [issue#8](https://github.com/tymofij/fb2reader/issues/8) for details.

### How do I set text font?

Go to Firefox _Preferences_ and in <a href="https://support.mozilla.org/en-US/kb/change-fonts-and-colors-websites-use">Fonts and Colors</a> section pick _Default font_.

### How do I download an .fb2 file?

Right-click on a file link and pick _Save As…_

### How can I completely change the book style?

Install [Stylus](https://addons.mozilla.org/firefox/addon/styl-us/) addon and then add your styles, see the [Example](https://github.com/tymofij/fb2reader/raw/refs/heads/main/userstyles/example.user.css).

Known Issues
-------------

* _View Source_ does not work.
* _File - Save Page_  barely works.

Legacy XPI
----------
See branch [`legacy-xpi`](https://github.com/tymofij/fb2reader/tree/legacy-xpi)