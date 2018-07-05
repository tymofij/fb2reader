let parser = new DOMParser();

let book_text = document.body.getElementsByTagName('pre')[0].textContent
let bookTree = parser.parseFromString(book_text, 'application/xml').documentElement;
document.body.innerHTML = '<div id="contents"><div>§</div></div>'
let FbInHTML = document.adoptNode(bookTree);
document.body.appendChild(FbInHTML);

let title_tags = bookTree.getElementsByTagName("book-title")
if (title_tags.length != 0) {
    let title = title_tags[0].textContent;
    document.title = title;
    console.log("FB title found: " + title);
}

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

document.head.appendChild(htmlToElement(`
    <link rel="icon" sizes="16x16" href="${chrome.runtime.getURL('icons/icon-16.png')}" type="image/png" />
`))
document.head.appendChild(htmlToElement(`
    <link rel="icon" sizes="32x32" href="${chrome.runtime.getURL('icons/icon-16-2x.png')}" type="image/png" />
`))
document.head.appendChild(htmlToElement(`
    <style>@import url(${chrome.runtime.getURL('css/print.css')}) print;</style>
`))


fb2.init(document)

