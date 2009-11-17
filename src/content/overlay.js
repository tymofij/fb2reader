window.addEventListener("load", function() { fb2Handler.init(); }, false);

const FB2_NS   = 'http://www.gribuser.ru/xml/fictionbook/2.0'
const XLink_NS = 'http://www.w3.org/1999/xlink';
const xHTML_NS = 'http://www.w3.org/1999/xhtml';
const XUL_NS   = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

var fb2Handler = {
  init: function() {
    var appcontent = document.getElementById("appcontent");   // browser
    if(appcontent)
      appcontent.addEventListener("DOMContentLoaded", fb2Handler.onPageLoad, true);
  },

  // see https://developer.mozilla.org/en/Xml/id
  // and http://bit.ly/24gZUo for a reason, why it is needed
  getElementById : function (doc, id) {
        return doc.evaluate("//fb2:*[@id='"+id+"']", // namespace-uri()='"+FB2_NS+"' and
            doc.documentElement,
            function() {return FB2_NS }, 
            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
  },

  // hides XPath query  
  getElements : function (doc, query) {
        return doc.evaluate("//fb2:"+query,doc.documentElement,
                    function(){return FB2_NS},
                    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
                    );
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

        // for each fb2 image we will create xHTML one        
        var images = fb2Handler.getElements(doc, "image")
        for ( var i=0 ; i < images.snapshotLength; i++ ) {
            var img = images.snapshotItem(i)
            // we get corresponding binary node
            var bin = fb2Handler.getElementById(doc, img.getAttributeNS(XLink_NS, 'href').slice(1));
            // create xhtml image and set src to its base64 data
            var ximg = doc.createElementNS(xHTML_NS, 'img');
            ximg.src='data:'+bin.getAttribute('content-type')+';base64,'+bin.textContent;
            img.parentNode.insertBefore(ximg, img);
        }
        
        // move all notes inside the links
        var notelinks = fb2Handler.getElements(doc, "a[@type='note']")
        for ( var i=0 ; i < notelinks.snapshotLength ; i++ ) {
            var note = notelinks.snapshotItem(i)
            var text = fb2Handler.getElementById(doc, note.getAttributeNS(XLink_NS, 'href').slice(1));            
            note.appendChild(text)
        }

    }
  }
}

