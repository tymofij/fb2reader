
var txt_html_doc = `
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:fb="http://www.gribuser.ru/xml/fictionbook/2.0">
<head>
<title>Untitled Fb2</title>
<link rel="shortcut icon" href="data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAIgA
igCFCaWp1QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9kLEA4pEfpEE9oAAAAZdEVYdENv
bW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAABgElEQVQ4y52TwWpUQRBFT4X3FzHZiZswgcfw
MAs/QWJAcBb+QGB2xvcDiUECSj5iFi7cCYEEBQVBCEEwZDNIdJHPsO6Ui9fdM8/JJtaqqe57+97q
2zYYNsEd6/Li3PK6Ahg9fQwBYWAB2D+IfIXBu/cfelsVgOQE1h20jDAsEjb1LGxJzQqA+wy5s7P9
hPHuGPmM8e4Yl6OZIxdy4fIlgqIAYHX1Hm+P35RNSZ2CWHbVI3BXH5Q8z/vZW9xuQXLavRaAly/a
oqjdaxk9GyEJyTk5+8Llxbl9fz5n6mYgcXC4D8DBq30klfX62jqSOP30tYAfrEEmqQBmciJN2KXi
1xPRx8/femCATLKSveYJSyrAbOXRw5rBsIl6gk1vOoLpDdQTrHsFVzHl8i5MqZ+VbDWbAFFPOiX1
pBNaLUpdBC3280yaeqOQ9HPg84C4C0sSjl4fcf3ruhDZLc9og2ETmxv3U1iMIDDrH7eIEukfVz+X
P5P+OAl156oArqa/+d/6C/Us5j/weUpOAAAAAElFTkSuQmCC" type="image/png" />
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

function listener(details) {
  var received_data = new Uint8Array()

  let filter = browser.webRequest.filterResponseData(details.requestId);
  let decoder = new TextDecoder('utf-8');
  let encoder = new TextEncoder();
  var parser = new DOMParser();
  var serializer = new XMLSerializer();

  filter.ondata = event => {
    var new_data = new Uint8Array(event.data)
    received_data = mergeTypedArrays(received_data, new_data)
  }

  filter.onstop = event => {
    var bookTree = parser.parseFromString(decoder.decode(received_data), 'application/xml');
    var bookHTML = parser.parseFromString(txt_html_doc, 'application/xml');

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
    filter.close();
  }
  return {};
}
browser.webRequest.onBeforeRequest.addListener(
  listener,
  {urls: ["*://*/*.fb2"], types: ["main_frame"]},
  ["blocking"]
);

function headers_listener(details) {
  removeHeader(details.responseHeaders, "Content-Disposition");
  setHeader(details.responseHeaders, "Content-Type", "text/xml; charset=utf-8");
    return {
        responseHeaders: details.responseHeaders
    };
}

browser.webRequest.onHeadersReceived.addListener(
  headers_listener,
  {urls: ["*://*/*.fb2"], types: ["main_frame"]},
  ["blocking", "responseHeaders"]
)

// ================================================================

function setHeader(headers, name, value) {
  for (var header of headers) {
    if (header.name.toLowerCase() == name.toLowerCase()) {
      header.value = value;
      return;
    }
  }
  headers.push({name: name, value: value });
}

function removeHeader(headers, name) {
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].name.toLowerCase() == name.toLowerCase()) {
      headers.splice(i, 1);
        return;
    }
  }
}

function mergeTypedArrays(a, b) {
  var c = new Uint8Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
}

