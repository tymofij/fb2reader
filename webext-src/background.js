'use strict';

let txt_html_doc = `
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:fb="http://www.gribuser.ru/xml/fictionbook/2.0">
<head>
<title>Untitled Fb2</title>
<link rel="icon" sizes="16x16" href="${browser.extension.getURL('icons/icon-16.png')}" type="image/png" />
<link rel="icon" sizes="32x32" href="${browser.extension.getURL('icons/icon-16-2x.png')}" type="image/png" />
<style>
  @import url(${browser.extension.getURL('css/fb2.css')});
  @import url(${browser.extension.getURL('css/html.css')});
  @import url(${browser.extension.getURL('css/print.css')}) print;
</style>
<script src="${browser.extension.getURL('overlay.js')}"></script>
</head>
<body>
<div id="contents"><div>§</div></div>
</body>
</html>`
const FB2_REGEX = /\.fb2(\.zip)?(#.*)?$/i

browser.webRequest.onHeadersReceived.addListener(
  details => {
    if (details.statusCode != 200 || !details.url.match(FB2_REGEX))  {
      // do not attach body listeners to redirects and non-book urls
      return {}
    }
    removeHeader(details.responseHeaders, "Content-Disposition");
    setHeader(details.responseHeaders, "Content-Type", "text/xml; charset=utf-8");

    let decoder = new TextDecoder();
    let encoder = new TextEncoder();
    let parser = new DOMParser();
    let serializer = new XMLSerializer();

    let filter = browser.webRequest.filterResponseData(details.requestId);
    let received_data = new Uint8Array()

    filter.ondata = event => {
      console.log('ondata')
      let new_data = new Uint8Array(event.data)
      received_data = mergeTypedArrays(received_data, new_data)
    }

    filter.onstop = event => {
      console.log('onstop')
      if (received_data[0] == 80 && received_data[1] == 75){  // PK header
        console.log('PK header')
        let fb_zip = new JSZip(received_data);
        for (let filename in fb_zip.files){
            if (filename.endsWith('.fb2')) {
              received_data = fb_zip.files[filename].asUint8Array()
              break;
            }
        }
      }
      // Try to detect the XML encoding if declared in the file
      let header = decoder.decode(received_data.slice(0,100))
      let charset = 'utf-8'
      if (header.match(/<?xml\s+version\s*=\s*["']1\.0['"]\s+encoding\s*=\s*["'](.*?)["']/i)) {
        charset = RegExp.$1;
        console.log("FB charset detected: " + charset)
      }

      decoder = new TextDecoder(charset);
      let received_text = decoder.decode(received_data)

      let bookTree = parser.parseFromString(received_text, 'application/xml');
      let bookHTML = parser.parseFromString(txt_html_doc, 'application/xml');

      let title_tags = bookTree.getElementsByTagName("book-title")
      if (title_tags.length != 0) {
        let title = title_tags[0].textContent;
        bookHTML.getElementsByTagName('title')[0].textContent = title;
        console.log("FB title found: " + title);
      }

      let FbInHTML = bookHTML.adoptNode(bookTree.documentElement);
      bookHTML.getElementsByTagName('body')[0].appendChild(FbInHTML);
      let merged_book_data = serializer.serializeToString(bookHTML);

      filter.write(encoder.encode(merged_book_data));
      filter.disconnect();
    }
    return {responseHeaders: details.responseHeaders };
  },
  {urls: [
    "*://*/*.fb2*",
    "*://*/*.FB2*",
    "*://*/*.Fb2*",
    "*://*/*.fB2*"
  ], types: ["main_frame"]},
  ["blocking", "responseHeaders"]
)

// ================================================================

function setHeader(headers, name, value) {
  for (let header of headers) {
    if (header.name.toLowerCase() == name.toLowerCase()) {
      header.value = value;
      return;
    }
  }
  headers.push({name: name, value: value });
}

function removeHeader(headers, name) {
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].name.toLowerCase() == name.toLowerCase()) {
      headers.splice(i, 1);
      return;
    }
  }
}

function mergeTypedArrays(a, b) {
  let c = new Uint8Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
}

