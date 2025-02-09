<p align="center">
  <img src="assets/bookpub-logo.jpg" align="right"  hspace="60" vspace="80" width="30%" height="30%" alt="BookPub logo header"/>
</p>

# bookpub

A forward-thinking book publishing pipeline; a modular CLI that helps publishers manage one manuscript source, define multiple pipelines for specific formats, to create multiple publishable assets.

Manuscript | Pipeline | Publishable Asset

. written in **Markdown+EJS** into:
* e-formats like PDF, EPUB, HTML
* professionally typeset print-ready PDFs
* **or anything else you can think of**!

BookPub manages a manuscript-to-market toolchain, allowing publishing firms, authors and other stakeholders to manage one markdown-based manuscript source, which can be piped through any conversion stage you can think of.

TERMS:

Manuscript - the source document written in Markdown and EJS
Buildprofessionally designed and typeset (even for print) using HTML, CSS and Javascript Web Standards. Bookpub will build your manuscript into any format (PDF, EPUB, MOBI, HTML). BookPub offers:

- **Customizable Pipelines**: Stage-based conversions (e.g. EJS → Markdown → HTML → PDF)  
- **Local Overrides**: Extend or override core stages by dropping your own stage folder  
- **Flexible Themes**: Separate assets for different builds (SCSS → CSS)  
- **Scaffolding**: Kickstart a new project with `bookpub new my-book`

---

## Table of Contents

- [Features](#features)  
- [Installation](#installation)  
- [Quick Start](#quick-start)  
- [Project Structure](#project-structure)  
- [Using Pipelines](#using-pipelines)  
- [Working With Meta](#working-with-meta)  
- [Overriding or Adding Stages](#overriding-or-adding-stages)  
- [Build Outputs](#build-outputs)  
- [Pandoc Markdown Tutorial](#pandoc_markdown_tutorial)  

---

## Features

- **EJS + Markdown**: Write `.md.ejs` and dynamically insert metadata or logic right inside your markdown.  
- **Stage-Based Pipeline**: Each stage transforms your manuscript in sequence. Core stages:  
  - **ejs** (EJS → Markdown)  
  - **markdown** (Markdown → HTML using Pandoc)  
  - **theme** (SCSS → CSS, copy assets)  
- **Extensible**: Drop in your own stage folders or define new build pipelines.  
- **Config-Driven**: A single `book.config.yml` holds metadata, pipeline stages, and build-specific overrides.  
- **Scaffolding**: Spin up a new project with a single command that includes all the boilerplate.

---

## Installation

```bash
# Option 1: Install globally
npm install -g bookpub

# Option 2: Use npx without installing
npx bookpub --help

# Option 3: Local project install
npm install bookpub --save-dev
```

---

## Quick Start

1. **Create a new Bookpub project**:
   ```bash
   bookpub new my-book
   ```
   Or:
   ```bash
   npx create-bookpub-project my-book
   ```
   This scaffolds a folder `my-book/` with all necessary boilerplate.

2. **Install dependencies**:
   ```bash
   cd my-book
   npm install
   ```
   (If you’ve globally installed `bookpub`, this step is optional for running commands, but recommended.)

3. **Build a PDF**:
   ```bash
   bookpub build pdf
   ```
   The output is in `build/pdf/`.

4. **Open** `manuscript/index.md.ejs` to write your content, or **customize** `book.config.yml` with your book’s metadata and pipeline stages.

---

## Project Structure

When you create a new Bookpub project (e.g. `my-book/`), you’ll typically see:

```
my-book/
├── .gitignore
├── README.md
├── book.config.yml
├── manuscript/
│   ├── index.md.ejs
│   └── themes/
│       ├── css/
│       │   ├── styles.pdf.scss
│       │   └── styles.epub.scss
│       ├── images/
│       └── ...
├── stages/
├── package.json
└── ...
```

- **`book.config.yml`**: Central config for metadata, pipeline definitions, etc.
- **`manuscript/`**: The source files for your book.  
  - `index.md.ejs` is your main entry point, combining EJS + Markdown.  
  - `themes/` holds SCSS/CSS, images, fonts, etc.
- **`stages/`**: (Optional) Put custom stages or override existing ones here.  
- **`package.json`**: The project’s local dependencies (including `bookpub`).

---

## Using Pipelines & Stages

### Default Pipelines & Stages

Bookpub comes with default pipelines for `pdf` and `epub` that have default stages:

```yaml
# If you don't define custom pipelines, these defaults apply:
# pdf:
#   1) ejs
#   2) markdown
#   3) theme
#   4) writeHtml

# epub:
#   1) ejs
#   2) markdown
#   3) theme
#   4) writeHtml
```

So `bookpub build pdf` automatically runs `ejs → markdown → theme`.

### Custom Pipelines in `book.config.yml`

```yaml
# book.config.yml

meta:
  title: "My Book"
  author: "Famous Name"

buildPipelines:
  pdf-lg:
    meta:
      title: "My Book (Large Print)"
      fontSize: 18
    stages:
      - name: ejs
      - name: markdown
      - name: theme
      - name: largePrint
        config:
          lineSpacing: 1.5
```

- **`pdf-lg`** pipeline: runs `ejs → markdown → theme → largePrint`.  
- **`meta`** inside `pdf-lg` overrides the top-level `meta` fields when building `pdf-lg`.

Run it:
```bash
bookpub build pdf-lg
```

---

## Working With Meta

Your `.md.ejs` can reference metadata from `book.config.yml` like this:

```markdown
# <%= meta.title %>

Author: <%= meta.author %>

This is dynamic EJS. If you specify `meta.title` in `book.config.yml`,
it appears here at build time.
```

1. **Top-level** `meta` applies to **all** builds.  
2. **Pipeline-specific** `meta` (under `buildPipelines.myPipeline.meta`) overrides top-level values for that build only.

---

## Overriding or Adding Stages

### Overriding a Built-In Stage

If you want to modify the core **ejs** stage (for example), just create a matching folder in your project:
```
my-book/
└─ stages/
   └─ ejs/
      └─ index.js
```
Inside `index.js`, export a `run()` function:

```js
// my-book/stages/ejs/index.js
export async function run(manuscript, { stageConfig, globalConfig }) {
  // Your custom logic
  // e.g., call the built-in ejs stage, then do extra stuff
  // or replace it entirely
  return manuscript;
}
```

Bookpub automatically detects `stages/ejs/index.js` and uses it **instead** of the built-in EJS stage.

### Creating a New Stage

Just name a folder in `stages/` (e.g., `stages/compressImages/`) with an `index.js`:

```js
// my-book/stages/compressImages/index.js
export async function run(manuscript, { stageConfig, globalConfig }) {
  console.log("Compressing images...");
  // do your stuff
  return manuscript;
}
```

Then add it to a pipeline in `book.config.yml`:

```yaml
buildPipelines:
  pdf:
    stages:
      - name: ejs
      - name: compressImages
      - name: markdown
      - name: theme
```

---

## Build Outputs

By default, Bookpub outputs to:
```
build/<buildType>/
```
For example:
```
build/pdf/
build/epub/
build/pdf-lg/
```
That folder might include:
- **index.html** (or whatever each stage produces)
- **themes/** (copied or compiled assets)
- Final PDF, EPUB, or other output generated by custom stages

---

## Pandoc Markdown Tutorial

This tutorial demonstrates how Pandoc converts extended Markdown into HTML. We’ll cover:

- General Markdown
- Fenced code blocks and attributes
- Link attributes
- Bracketed spans
- Generic attributes
- Raw attributes
- How to designate specific HTML tags: section, article, footer, div, span, pre, code, br, hr

---

### 1. General Markdown

Basic Markdown elements work as you’d expect. For example:

```markdown
# Sample Heading

This is a paragraph with **bold text** and *italic text*.

- List item 1
- List item 2
```

Pandoc converts that into:

```html
<h1>Sample Heading</h1>
<p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
<ul>
  <li>List item 1</li>
  <li>List item 2</li>
</ul>
```

---

### 2. Fenced Code Blocks and Attributes

Pandoc supports fenced code blocks with extra attributes to set language, id, classes, etc.

```markdown
    ```python {#code-example .highlight}
    def greet():
        print("Hello, world!")
    ```
```

This tells Pandoc to wrap the code in a `<pre>` and `<code>` block, add an `id` of `code-example`, a class `highlight`, and also a language class for syntax highlighting:

```html
<pre id="code-example" class="highlight">
  <code class="language-python">def greet():
    print("Hello, world!")
  </code>
</pre>
```

---

### 3. Link Attributes

You can attach extra attributes to links. Check out this example:

```markdown
[Visit Google](https://google.com){: target="_blank" class="external-link"}
```

Pandoc converts it into:

```html
<p><a href="https://google.com" target="_blank" class="external-link">Visit Google</a></p>
```

---

### 4. Bracketed Spans

Bracketed spans let you add attributes to inline elements. For instance:

```markdown
This is a [highlighted text]{.highlight} within a sentence.
```

Results in:

```html
<p>This is a <span class="highlight">highlighted text</span> within a sentence.</p>
```

---

### 5. Generic Attributes

Generic attributes work on block-level elements like headings or paragraphs. For example:

```markdown
# A Titled Section {.section-title}

Some paragraph text with a generic attribute.
```

Converts to:

```html
<h1 class="section-title">A Titled Section</h1>
<p>Some paragraph text with a generic attribute.</p>
```

---

### 6. Raw Attributes

Raw HTML in your Markdown is passed through as-is, including its attributes. For example:

```markdown
<div data-info="raw" style="color: red;">
  This is a raw HTML block with attributes.
</div>
```

Pandoc leaves it untouched:

```html
<div data-info="raw" style="color: red;">
  This is a raw HTML block with attributes.
</div>
```

---

### 7. Designating Specific HTML Tags

Pandoc’s Divs (and inline spans) let you specify a custom HTML tag by using the `tag` attribute.

#### Section

```markdown
::: {tag=section #sec1 .intro}
This content is inside a <code>section</code> element.
:::
```

Becomes:

```html
<section id="sec1" class="intro">
  <p>This content is inside a <code>section</code> element.</p>
</section>
```

#### Article

```markdown
::: {tag=article #article1 .post}
Content inside an <code>article</code> element.
:::
```

Converts to:

```html
<article id="article1" class="post">
  <p>Content inside an <code>article</code> element.</p>
</article>
```

#### Footer

```markdown
::: {tag=footer #footer1}
Footer content goes here.
:::
```

Becomes:

```html
<footer id="footer1">
  <p>Footer content goes here.</p>
</footer>
```

#### Div

A standard Div (without overriding the tag) remains a `<div>`:

```markdown
::: {#div1 .container}
Content inside a div.
:::
```

Converts to:

```html
<div id="div1" class="container">
  <p>Content inside a div.</p>
</div>
```

#### Span

Bracketed spans by default yield `<span>` elements. For example:

```markdown
Here is an [inline span]{#span1 .highlight} in a sentence.
```

Results in:

```html
<p>Here is an <span id="span1" class="highlight">inline span</span> in a sentence.</p>
```

#### Pre and Code

Fenced code blocks (as shown earlier) automatically produce `<pre>` and `<code>` blocks.

#### Line Break (br)

A hard line break can be made by ending a line with two spaces:

```markdown
First line with a hard break.  <-- Two Spaces
Second line continues.
```

This converts to:

```html
<p>First line with a hard break.<br />
Second line continues.</p>
```

#### Horizontal Rule (hr)

A horizontal rule is simply three or more hyphens:

```markdown
---
```

Which becomes:

```html
<hr />
```