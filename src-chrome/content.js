window.onload = function () {
  let fbTree = document.getElementsByTagName("FictionBook")[0]
  document.body.innerHTML = "";
  document.body.append(fbTree)

  let title = "Untitled Fb2"
  let title_tags = fbTree.getElementsByTagName("book-title")
  if (title_tags.length != 0) {
    title = title_tags[0].textContent;
    console.log("FB title found: " + title);
  }

  let txt_html_doc = `
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:fb="http://www.gribuser.ru/xml/fictionbook/2.0">
  <head>
    <title>${title}</title>
    <link rel="icon" sizes="16x16" href="${chrome.runtime.getURL('icons/icon-16.png')}" type="image/png" />
    <link rel="stylesheet" href="${chrome.runtime.getURL('css/fb2.css')}" />
    <link rel="stylesheet" href="${chrome.runtime.getURL('css/html.css')}" />
    <link rel="stylesheet" href="${chrome.runtime.getURL('css/print.css')}" media="print" />
  </head>
  <body>
    <div id="contents"><div>§</div></div>
  </body>
  </html>`

  let parser = new DOMParser();
  let bookTree = document.documentElement
  let bookHTML = parser.parseFromString(txt_html_doc, 'application/xml');
  bookTree.appendChild(bookHTML.documentElement)
  fb2.init(document)
};
