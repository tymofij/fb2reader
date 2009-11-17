window.addEventListener("load", function() { fb2Handler.init(); }, false);

var fb2Handler = {
  init: function() {
    var appcontent = document.getElementById("appcontent");   // browser
    if(appcontent)
      appcontent.addEventListener("DOMContentLoaded", fb2Handler.onPageLoad, true);
  },

  // see https://developer.mozilla.org/en/Xml/id for a reason, why it is needed
  getBin : function (fbdoc, id) {
    var bins = fbdoc.getElementsByTagName('binary');
    for (i in bins){
        if (bins[i].getAttribute('id') == id) {
            return bins[i];
        }
    }
  },

  onPageLoad: function(event) {
    var doc = event.originalTarget; // doc is document that triggered "onload" event
    // execute for FictionBook only
    if(doc.location.href.search(".fb2") > -1) {
        var browser = gBrowser.getBrowserForDocument(doc);
        var tabIndex = gBrowser.browsers.indexOf(browser);
        tab = gBrowser.tabContainer.childNodes[tabIndex]

        // change favicon on the tab
        var img = document.getAnonymousElementByAttribute(tab, "class", "tab-icon-image");
        img.src="chrome://fb2reader/skin/icon-16.png";
        // assign title to the tab
        var lbl = document.getAnonymousElementByAttribute(tab, "class", "tab-text");
        lbl.value = doc.getElementsByTagName("book-title")[0].textContent
        
        const XLink_NS = 'http://www.w3.org/1999/xlink';
        const xHTML_NS = 'http://www.w3.org/1999/xhtml';
        const XUL_NS   = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

        // for each fb2 image we will create xHTML one
        images = doc.getElementsByTagName("image");
        for (i in images){
            var img = images[i]
            // we get corresponding binary node
            var bin = fb2Handler.getBin(doc, img.getAttributeNS(XLink_NS, 'href').slice(1));
            // create xhtml image and set src to its base64 data
            var ximg = doc.createElementNS(xHTML_NS, 'img');
            ximg.src='data:'+bin.getAttribute('content-type')+';base64,'+bin.textContent;
            img.parentNode.insertBefore(ximg, img);
        } 
        
    }
  }
}

