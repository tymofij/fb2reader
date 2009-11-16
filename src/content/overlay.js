window.addEventListener("load", function() { fb2Handler.init(); }, false);

var fb2Handler = {
  init: function() {
    var appcontent = document.getElementById("appcontent");   // browser
    if(appcontent)
      appcontent.addEventListener("DOMContentLoaded", fb2Handler.onPageLoad, true);
  },

  onPageLoad: function(event) {
    var doc = event.originalTarget; // doc is document that triggered "onload" event
    // execute for FictionBook only
    if(doc.location.href.search(".fb2") > -1) {
        var browser = gBrowser.getBrowserForDocument(doc);
        var tabIndex = gBrowser.browsers.indexOf(browser);
        tab = gBrowser.tabContainer.childNodes[tabIndex]

        img = document.getAnonymousElementByAttribute(tab, "class", "tab-icon-image");
        img.src="chrome://fb2reader/skin/icon-16.png"
        lbl = document.getAnonymousElementByAttribute(tab, "class", "tab-text");
        // assign title to the tab
        lbl.value = doc.getElementsByTagName("book-title")[0].textContent
       }
    }
}

