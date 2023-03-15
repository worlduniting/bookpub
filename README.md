# Bookshop

Bookhsop is a markdown-based book publishing framework for small firms, allowing a manuscript to be written entirely in markdown and converted into standard publishing formats (PDF (Ebook), PDF (Print), Epub, Mobi, HTML).

## Features:

* Composing the source of a manuscript in markdown.
  * With the ability to extend the markdown language with custom formatting (GFM, Custom Comments, etc.)Able to be extended with additional

## Developer Notes

* bookshop is CommonJS by default, but runs its main libraries as ES Modules by adding .mjs as needed.
  * As a general rule, we've attempted to use ES Modules whenever possible.
  * This is done to ensure compatibility with legacy modules, like browser-sync, which is used when writing your manuscript with live previews in the browser.
