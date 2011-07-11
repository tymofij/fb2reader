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

const FB2_REGEX = /\.fb2(\.zip)?(#.*)?$/g

// Content-Disposition: attachment; filename="foo.fb2"
// see http://greenbytes.de/tech/tc2231/#inlwithasciifilename
const ATTACHMENT_REGEX = /\.fb2(\.zip)?($|[ \'\"])/g

const NS_ERROR_NOT_AVAILABLE = Components.results.NS_ERROR_NOT_AVAILABLE;

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
    charset: null,
    title: null,

    /*
    * This component works as such:
    * 1. asyncConvertData captures the listener
    * 2. onStartRequest fires, initializes stuff, modifies the listener to match our output type
    * 3. onDataAvailable transcodes the data into a UTF-8 string
    * 4. onStopRequest gets the collected data and converts it, spits it to the listener
    */
    // nsIContentSniffer::getMIMETypeFromContent
    getMIMETypeFromContent: function(request, data) {
        // sets mime type for .fb2 and fb.* files

        var prefs = Cc["@mozilla.org/preferences-service;1"]
                        .getService(Ci.nsIPrefBranch);

        if (!prefs.getBoolPref("extensions.fb2reader.enabled"))
            return null

        try {
            isFb2 = false
            var uri = request.QueryInterface(Ci.nsIChannel).URI.spec;
            if(uri.match(FB2_REGEX)) {
                dumpln("URI match on "+uri);
                isFb2 = true;
            }
            if(request instanceof Ci.nsIHttpChannel) {
                var httpChannel = request.QueryInterface(Ci.nsIHttpChannel);
                var type = httpChannel.getResponseHeader("Content-Type");
                try {
                    var disposition = httpChannel.getResponseHeader("Content-Disposition");
                    if(disposition.match(ATTACHMENT_REGEX) && !type.match(/application\/fb2/g)) {
                        dumpln("type/disposition match on "+uri);
                        httpChannel.setResponseHeader("Content-Disposition", "", false);
                        isFb2 = true;
                    }
                } catch(e) {} // no disposition header
            }
            if (isFb2) {
                return "application/fb2"
            }
        } catch(e) {
            dumpln("Could not look for a mime type for "+request.name);
            dumpln(e);
            throw e;
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

        try { // the big one, which will handle both Zip and XML Failures

            // is it a ZIP ?
            if (this.data.slice(0,2) == 'PK'){
                try {
                    // temporary file for IZipReader to work on
                    var file = Cc["@mozilla.org/file/directory_service;1"].
                            getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile);
                    file.append("fictionbook.zip");
                    file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0666);
                    // a stream for pushing content into the file
                    var stream = Cc["@mozilla.org/network/safe-file-output-stream;1"]
                                    .createInstance(Ci.nsIFileOutputStream);
                    stream.init(file, 0x04 | 0x08 | 0x20, 0600, 0); // write, create, truncate
                    stream.write(this.data, this.data.length);
                    if (stream instanceof Ci.nsISafeOutputStream) {
                        stream.finish();
                    } else {
                        stream.close();
                    }
                    // reading of this file
                    var zReader = Cc["@mozilla.org/libjar/zip-reader;1"]
                                    .createInstance(Ci.nsIZipReader);
                    zReader.open(file)
                    // grabbing first fb2 inside
                    // fails for non-latin filenames
                    // https://bugzilla.mozilla.org/show_bug.cgi?id=296795
                    var fb2_inside = zReader.findEntries("*.fb2").getNext()
                    var fb2_stream = zReader.getInputStream(fb2_inside)

                    // now getting the content of the book
                    var s2 = Cc["@mozilla.org/scriptableinputstream;1"]
                                    .createInstance(Ci.nsIScriptableInputStream);
                    s2.init(fb2_stream);
                    this.data = s2.read(s2.available());

                    zReader.close()
                    file.remove(false /* non-recursive */)
                } catch (e) {
                    dumpln(e)
                    throw "error_zip"
                }
            }

            try {
                // Try to detect the XML encoding if declared in the file
                if (this.data.match (/<?xml\s+version\s*=\s*["']1.0['"]\s+encoding\s*=\s*["'](.*?)["']/)) {
                     this.charset = RegExp.$1;
                }
                dumpln("charset detected: "+this.charset)

                // ok, lets make unicode out of binary
                var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                                    .createInstance(Ci.nsIScriptableUnicodeConverter);
                converter.charset = this.charset;
                this.data = converter.ConvertToUnicode(this.data);

                // let's parse incoming data to get DOM tree
                var parser = Cc["@mozilla.org/xmlextras/domparser;1"]
                                    .createInstance(Ci.nsIDOMParser);
                var bookTree = parser.parseFromString(this.data, "text/xml")

                // if the parsing process failed, DOMParser currently does not throw an exception,
                // but instead returns an error document (see bug 45566)
                // let's check it did parse
                if (bookTree.getElementsByTagName("FictionBook").length == 0) {
                    throw "error_xml"
                }

                // we will find kind HTML parent to adopt this kid
                var XHR = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
                XHR.open ("GET", "chrome://fb2reader/content/view_book.xhtml", false); // synchronous load
                XHR.overrideMimeType("text/xml");
                XHR.send(null);
                bookHTML = XHR.responseXML

                // lets find out and set book title for the history
                title_tags = bookTree.getElementsByTagName("book-title")
                if (title_tags.length != 0) {
                    this.title = title_tags[0].textContent;
                    bookHTML.getElementsByTagName('title')[0].textContent = this.title;
                    dumpln("title found: " + this.title)
                }

                // sweet moment of reunion
                FbInHTML = bookHTML.adoptNode(bookTree.getElementsByTagName('FictionBook')[0])
                bookHTML.getElementsByTagName('body')[0].appendChild(FbInHTML)

            } catch (e) {
                dumpln(e)
                throw "error_xml"
            }

        // General error handling block
        } catch(e) {
            dumpln("===========")
            dumpln(e)
            var XHR = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
            XHR.open ("GET", "chrome://fb2reader/content/"+e+".xhtml", false); // synchronous load
            XHR.overrideMimeType("text/xml");
            XHR.send(null);
            bookHTML = XHR.responseXML
            dumpln("-----------")

        // lets output the XML, be it error or the book
        } finally {

            // this is where we will put data
            var storage = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
            storage.init(4, 0xffffffff, null);  // chunk size is 4
            // create the stream to put data into storage
            var out_stream = storage.getOutputStream(0);

            // serialize the tree and put it into the stream
            var serializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Ci.nsIDOMSerializer);

            // passing serialization to stream
            output = serializer.serializeToStream(bookHTML, out_stream, 'UTF-8');
            // create the stream from which original channel listener will get what we gave it
            var in_stream = storage.newInputStream(0);

            // Pass the data to the main content listener
            this.listener.onDataAvailable(this.channel, context, in_stream, 0, storage.length);
            this.listener.onStopRequest(request, context, statusCode);
        }
    },
};


if (XPCOMUtils.generateNSGetFactory) // Firefox 4
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([FB_Reader]);
else // others
    var NSGetModule = XPCOMUtils.generateNSGetModule([FB_Reader]);
