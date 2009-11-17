window.addEventListener("load", function() { fb2Handler.init(); }, false);

const FB2_NS   = 'http://www.gribuser.ru/xml/fictionbook/2.0'
const XLink_NS = 'http://www.w3.org/1999/xlink';
const xHTML_NS = 'http://www.w3.org/1999/xhtml';
const XUL_NS   = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';


// utility DOM management functions
var util = {
    // see https://developer.mozilla.org/en/Xml/id
    // and http://bit.ly/24gZUo for a reason why it is needed
    getElements : function (doc, query, resultType) {
        if (resultType == null) {
            resultType = XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE
        }            
        return doc.evaluate("//fb2:"+query,doc.documentElement, // could use: namespace-uri()='"+FB2_NS+"' and ..
                    function(){return FB2_NS},
                    resultType, null
                    );
    },

    getSingleElement : function (doc, query) {
        return util.getElements(doc, query, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue
    },

    getHrefVal : function(elem){
    return elem.getAttributeNS(XLink_NS, 'href').slice(1)  
    },
}

// actual handler
var fb2Handler = {
    init: function() {
        var appcontent = document.getElementById("appcontent");   // browser
        if(appcontent)
            appcontent.addEventListener("DOMContentLoaded", fb2Handler.onPageLoad, true);
    },

    onPageLoad: function(event) {
        // that is the document that triggered event
        var doc = event.originalTarget; 
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
            var images = util.getElements(doc, "image")
            for ( var i=0 ; i < images.snapshotLength; i++ ) {
                var img = images.snapshotItem(i)
                // we get corresponding binary node
                var bin = util.getSingleElement(doc, "binary[@id='"+util.getHrefVal(img)+"']");
                // create xhtml image and set src to its base64 data
                var ximg = doc.createElementNS(xHTML_NS, 'img');
                ximg.src='data:'+bin.getAttribute('content-type')+';base64,'+bin.textContent;
                img.parentNode.insertBefore(ximg, img);
            }
            
            // move all notes inside the links
            var notelinks = util.getElements(doc, "a[@type='note']")
            for ( var i=0 ; i < notelinks.snapshotLength ; i++ ) {
                var note = notelinks.snapshotItem(i)
                var text = util.getSingleElement(doc, "section[@id='"+util.getHrefVal(note)+"']");            
                note.appendChild(text)
            }
        }
    }
}

