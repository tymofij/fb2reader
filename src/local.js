let txt_html_doc = `
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:fb="http://www.gribuser.ru/xml/fictionbook/2.0">
<head>
<title>Untitled Fb2</title>
<link rel="icon" sizes="16x16" href="${browser.runtime.getURL('icons/icon-16.png')}" type="image/png" />
<link rel="icon" sizes="32x32" href="${browser.runtime.getURL('icons/icon-16-2x.png')}" type="image/png" />
<link rel="stylesheet" href="${browser.runtime.getURL('css/fb2.css')}" />
<link rel="stylesheet" href="${browser.runtime.getURL('css/html.css')}" />
<link rel="stylesheet" href="${browser.runtime.getURL('css/print.css')}" media="print" />
</head>
<body>
<div id="contents"><div>§</div></div>
</body>
</html>`

let parser = new DOMParser();
let bookTree = document.documentElement
let bookHTML = parser.parseFromString(txt_html_doc, 'application/xml');

let title_tags = bookTree.getElementsByTagName("book-title")
if (title_tags.length != 0) {
    let title = title_tags[0].textContent;
    bookHTML.getElementsByTagName('title')[0].textContent = title;
    console.log("FB title found: " + title);
}
bookTree.appendChild(bookHTML.documentElement)
fb2.init(document)
