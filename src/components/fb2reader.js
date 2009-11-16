/**
 * FB2Reader Firefox Extension: http://clear.com.ua/projects/fb2reader
 * Copyright (C) 2009 Tymofiy Babych (tim.babych@gmail.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
**/

const Ci = Components.interfaces;
const Cc = Components.classes;

function dumpln(s){
  dump("FB2 "+s+"\n");
}

const FB2_NS = "http://www.gribuser.ru/xml/fictionbook/2.0"

/* workhorse */
var FictionBook = {

}

/* FB2 reader component */
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

const FB_READER_CONVERSION = "?from=application/fb2&to=*/*";
const FB_READER_CONTRACT_ID = "@mozilla.org/streamconv;1" + FB_READER_CONVERSION;
const FB_READER_COMPONENT_ID = Components.ID("{99889a2c-d14c-11de-a670-d332511dc9a9}");

function FB_Reader(){
    this.wrappedJSObject = this;
};

FB_Reader.prototype = {
    classDescription: "FictionBook Reader XPCOM Component",
    classID: FB_READER_COMPONENT_ID,
    contractID: FB_READER_CONTRACT_ID,

    _xpcom_categories: [{
        category: "@mozilla.org/streamconv;1",
        entry: FB_READER_CONVERSION,
        value: "FB2 to HTML stream converter"
        },
    {
        category: "net-content-sniffers"
    }],

    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsIStreamConverter,
        Ci.nsIStreamListener,
        Ci.nsIRequestObserver,
        Ci.nsIContentSniffer
    ]),

    data: null,
    listener: null,
    channel: null,


    /*
    * This component works as such:
    * 1. asyncConvertData captures the listener
    * 2. onStartRequest fires, initializes stuff, modifies the listener to match our output type
    * 3. onDataAvailable transcodes the data into a UTF-8 string
    * 4. onStopRequest gets the collected data and converts it, spits it to the listener
    */


    // nsIContentSniffer::getMIMETypeFromContent
    getMIMETypeFromContent: function(request, data) {
       // sets mime type for .fb2 files  
       if(request instanceof Ci.nsIHttpChannel) {
           try {
               var uri = request.QueryInterface(Ci.nsIChannel).URI.spec;
               if(uri.match(/.*[^=]\.fb2$/g)) {
                   dumpln("URI match on "+uri);
                   return "application/fb2";
               } else {
                   var type = httpChannel.getResponseHeader("Content-Type");
                   var disposition = httpChannel.getResponseHeader("Content-Disposition");

                   if(disposition.match(/.*\.fb2/g) && !type.match(/application\/fb2/g)) {
                       dumpln("type/disposition match on "+uri);
                       return "application/fb2";
                   }
               }
           }
           catch(e) {
           }
       }
    },

  
    // nsIStreamConverter::convert
    // does nothing, just to comply with interface
    convert: function(fromStream, fromType, toType, ctxt) {
      return fromStream;
    },

    // nsIStreamConverter::asyncConvertData
    // Store the listener passed to us    
    asyncConvertData: function(fromType, toType, listener, ctxt) {
        this.listener = listener;
    },

    // nsIRequestObserver::onStartRequest
    onStartRequest: function(request, context) {
        // nullifies this.data
        this.data = "";

        /* sets charset if it is available. for documents loaded from the filesystem, this is not set. */
        this.charset = request.QueryInterface(Ci.nsIChannel).contentCharset || 'UTF-8';

        this.channel = request;
        this.channel.contentType = "text/xml";
        // All our data will be coerced to UTF-8
        this.channel.contentCharset = "UTF-8";

        // do not care about Content-Disposition: Attachment        
        if(this.channel instanceof Ci.nsIHttpChannel) {
            var chan = request.QueryInterface(Ci.nsIChannel);
            var httpChannel = chan.QueryInterface(Ci.nsIHttpChannel);
            httpChannel.setResponseHeader("Content-Disposition", "", false);
        }

        this.listener.onStartRequest(this.channel, context);
    },

    // nsIStreamListener::onDataAvailable
    onDataAvailable: function (request, context, inputStream, offset, count) {
		var binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);

		binaryInputStream.setInputStream(inputStream);
        this.data += binaryInputStream.readBytes(count);        
        
    },
 
    // Fired when all the data was successfully read
    // nsIRequestObserver::onStopRequest
    onStopRequest: function(request, context, statusCode) {

        this.charset = 'UTF-8'; // default one

        // Try to detect the XML encoding if declared in the file
        if (this.data.match (/<?xml\s+version\s*=\s*["']1.0['"]\s+encoding\s*=\s*["'](.*?)["']/)) {
             this.charset = RegExp.$1;
        }
        dumpln("charset detected: "+this.charset)
        
        // ok, lets make unicode out of binary
        var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
        converter.charset = this.charset;
        this.data = converter.ConvertToUnicode(this.data);

        // let's parse incoming data to get DOM tree
        var parser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);
        var bookTree = parser.parseFromString(this.data, "text/xml")

        dumpln("loaded tree, id="+bookTree.getElementsByTagName("id")[0].textContent);

        var pi = bookTree.createProcessingInstruction('xml-stylesheet', 'href="http://try/fb2.css" type="text/css"');
        bookTree.insertBefore(pi, bookTree.documentElement);

        // this is where we will put data
        var storage = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
        storage.init(4, 0xffffffff, null);  // chunk size is 4
        var out_stream = storage.getOutputStream(0);

        // serialize the tree and put it into the stream
        var serializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Ci.nsIDOMSerializer);
        
        // passing serialization to stream       
        output = serializer.serializeToStream(bookTree, out_stream, 'UTF-8');
        var in_stream = storage.newInputStream(0);
           
        // Pass the data to the main content listener
        this.listener.onDataAvailable(this.channel, context, in_stream, 0, storage.length);
        this.listener.onStopRequest(request, context, statusCode);
    },


};

/* register component */
var components = [FB_Reader];

function NSGetModule(compMgr, fileSpec){
   function postRegister() {
      var catMgr = XPCOMUtils.categoryManager;
      catMgr.addCategoryEntry('ext-to-type-mapping', 'fb2', 'application/fb2', true, true);
   }

   function preUnregister() {
      var catMgr = XPCOMUtils.categoryManager;
      catMgr.addCategoryEntry('ext-to-type-mapping', 'fb2', true);
   }

   return XPCOMUtils.generateModule(components, postRegister, preUnregister);
}
