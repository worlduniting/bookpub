# Example Book Project

This is an example Bookpub project to show you how things work. Feel free to explore and customize!

---

## Folder Structure

```
example-book/
├── README.md                # This file: overview and instructions
├── book.config.yml          # Core configuration (metadata, pipelines, etc.)
├── stages/                  # Custom or override stages can go here
├── manuscript/
│   ├── index.md.ejs         # Main manuscript, combining EJS + Markdown
│   └── themes/
│       ├── css/
│       │   ├── styles.pdf.scss
│       │   └── styles.epub.scss
│       ├── images/          # Images used by your manuscript or theme
│       ├── fonts/           # Custom fonts for styling
│       └── svgs/            # SVG graphics or icons
└── ...
```

### `book.config.yml`
- Holds metadata about your book (e.g. `title`, `author`) and optional **pipelines** for different build outputs.
- You can **add** or **override** build pipelines to customize the stages (e.g., `pdf` pipeline vs. `epub` pipeline).

### `manuscript/`
- Contains your **actual book content**.
- The main entry point is `index.md.ejs`, which is a mix of EJS templating plus Markdown. You can reference `<%= meta.title %>` and other data from `book.config.yml`.

### `manuscript/themes/`
- Houses **themes** and assets for building the final book (CSS, JS, images, fonts, etc.).
- The `.scss` files are compiled into `.css` during the **theme** stage.
  - `styles.pdf.scss` → styles used for PDF builds.
  - `styles.epub.scss` → styles used for EPUB builds.

### `stages/` (optional in example)
- If you want to **override** or **extend** Bookpub’s built-in stages (ejs, markdown, theme), you can create matching folders here.
- For instance, `stages/ejs/index.js` would override the core EJS stage.
- If you create a custom stage (e.g. `stages/compressImages/index.js`), you can add it to your pipeline in `book.config.yml`.

---

## How to Use

1. **Install Dependencies**
   ```bash
   npm install
   ```
   (This ensures `bookpub` and any other dependencies are installed.)

2. **Build the Book**
   - Build a PDF:
     ```bash
     bookpub build pdf
     ```  
     The output will appear in `build/pdf/`.
   - Build an EPUB:
     ```bash
     bookpub build epub
     ```  
     The output will appear in `build/epub/`.

3. **Explore & Customize**
   - Open `book.config.yml` to edit book metadata or tweak pipeline stages.
   - Edit `index.md.ejs` to write your book’s content, using the power of EJS + Markdown.
   - Adjust your SCSS in `manuscript/themes/css/` to change the look and feel.

---

## EJS + Markdown Quick Example

Inside `index.md.ejs` you might see:

```md
# <%= meta.title %>

Author: <%= meta.author %>

This is my **Markdown** text!

- It's a bulleted list
- With EJS placeholders: <%= meta.isbn %>
```

During the **EJS stage**, `<%= meta.title %>` and other placeholders will be filled in from `book.config.yml`. The resulting Markdown is then processed by the **Markdown stage** (e.g. Pandoc) to create HTML, which is finally styled and turned into PDF/EPUB.

---

## Gotchas / Tips

- Make sure [Pandoc](https://pandoc.org/) is installed on your system if you’re using the default Markdown-to-HTML pipeline.
- If you need custom transformations, add new stages or override existing ones in the `stages/` folder and list them in `book.config.yml`.
- You can define **multiple build pipelines** for different outputs (e.g., `pdf-lg` for large print), each with its own set of stages.

---

**Happy writing and publishing!** If you get stuck or want more features, check out the Bookpub docs or open an issue on GitHub.