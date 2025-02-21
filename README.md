<p>
  <img src="assets/logo-mid.svg" align="right"  hspace="60" vspace="80" width="30%" height="30%" alt="BookPub logo header"/>
</p>

# bookpub

A lightweight book publishing cli framework providing customizable pipelines with modular stages that can be stacked like legos to create any type/number of publishable assets you need---from only one manuscript source.

> Author's Note:
>
> My intent is to focus **bookpub** on orchestrating pipelines and stages in a standardized way so that users can easily add their own solutions (stages) for converting the manuscript.
>
>Currently bookpub's pre-built stages utilize standard Web conventions for styling (HTML/CSS/JS).


---

## Table of Contents

- [Features](#features)  
- [Installation](#installation)  
- [Quick Start](#quick-start)  
- [Project Structure](#project-structure)  
- [Using Pipelines or Stages](#using-pipelines-or-stages)  
- [Working With Meta](#working-with-meta)  
- [Overriding or Adding Stages](#overriding-or-adding-stages)  
- [Build Outputs](#build-outputs)  
- [Pandoc Markdown Tutorial](#pandoc-markdown-tutorial)  

---

## Features

- **One Manuscript Source**
  - The manuscript is written in industry-standard [Markdown](https://www.markdownguide.org/), wrapped in [EJS (Embedded JavaScript: a javascript based templating standard)](https://ejs.co/)  
- **Stage-Based Pipelines**: Pipelines are composed of individual stages executed in sequence.
  - Pre-Defined Build Pipelines:
    - **HTML** - Creates an HTML build of your book.
    - **PDF** - Creates a PDF build of your book.
  - Pre-Built Stages:  
    - **ejs** (EJS to Markdown)  
    - **markdown** (Markdown to HTML using Pandoc)  
    - **themes** (SCSS to CSS using SASS and coping assets)  
    - **pdf** (html/css/js to PDF using PrinceXML)
- **Extend or Override**:
  - Drop in your own custom **stages**
  - Define new build pipelines and their stages.
  - Or Override built-in stages and/or pipelines.  
- **Dev Mode**: View the final pipeline result in real time (via browser) as you edit the manuscript.  
- **Project Settings (book.config.yml)**: Use [YAML](https://spacelift.io/blog/yaml) to define global, pipeline, or stage based settings
  - **Meta** (e.g. title: My Title)
  - **Config** (e.g. (for EJS... rmWhitespace: true))
- **Scaffolding**: Spin up a new bookpub project with a single command that includes all the boilerplate.

---

## Pre-Requisites

1. **Installing Pandoc**

    bookpub uses pandoc in its built-in markdown stage
    * (You can easily use something else by visiting the [Overriding or Adding Stages](#overriding-or-adding-stages) section)

    Please visit the [Pandoc Installation Page](https://pandoc.org/installing.html) for directions on installing Pandoc on your operating system

2. **Installing PrinceXML**

    bookpub uses princexml (an advanced PDF typesetting library) in its built-in pdf stage
    * (You can easily use something else, by visiting the [Overriding or Adding Stages](#overriding-or-adding-stages) section)

    Please visit the [PrinceXML Installation Page](https://www.princexml.com/doc/12/doc-install/) for directions on installing Pandoc on your operating system

---

## Installation

```bash
# Option 1: Install globally
npm install -g bookpub
```

---

## Quick Start

1. **Create a new Bookpub project**:
   ```bash
   bookpub new my-book
   ```
   This scaffolds a folder `my-book/` with all necessary boilerplate.

3. **Build a PDF**:
   ```bash
   cd my-book
   bookpub build html
   ```
   The output is in `build/html/`.

4. **Open** `manuscript/index.md.ejs` to write your content, or **customize** `book.config.yml` with your book’s metadata and pipelines/stages.

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
|       └── default/
│           ├── css/
│           │   ├── styles.pdf.scss
│           │   └── styles.epub.scss
│           ├── images/
│           └── ...
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

## Using Pipelines or Stages

### Default Pipelines & Stages (`book.config.yml`)

Bookpub comes with a couple pipelines pre-defined for `html` and `pdf` that have pre-built stages (_all of which you can override_):

```yaml
buildPipelines:
  html:
    stages:
      - name: ejs
      - name: markdown
      - name: themes
      - name: writeHtml

  pdf:
    stages:
      - name: ejs
      - name: markdown
      - name: themes
      - name: writeHtml
      - name: pdf
```

Now `bookpub build pdf` will run the pdf build-pipeline and execute these stages in order: `ejs > markdown > themes > writeHtml > pdf `.

### Defining Custom Pipelines in `book.config.yml`

```yaml
# book.config.yml

global: # Applied globally to all pipelines
  meta:
    title: "My Book"
    author: "Famous Name"
  stages:
    - name: ejs # Applied to all ejs stages in every pipeline
      config:
        rmWhitespace: true

buildPipelines:
  pdf-lg: # A custom pipeline for a large font pdf
    meta:
      title: "My Book (Large Print)" # Overrides global meta
      fontSize: 18
    stages:
      - name: ejs
        config: # Overrides global settings for thie pipeline
          rmWhitespace: false
      - name: markdown
      - name: theme
      - name: writeHtml
      - name: pdf
        config:
          lineSpacing: 1.5
```

Now `bookpub build pdf-lg` will run the pdf-lg build-pipeline and execute these stages in order: `ejs > markdown > themes > writeHtml > pdf `.

---

## Working With Meta

Your `file.md.ejs` can reference metadata from `book.config.yml` like this:

```markdown
# <%= meta.title %>

Author: <%= meta.author %>

This is dynamic EJS. If you specify `meta.title` in `book.config.yml`,
it appears here at build time.
```

1. **global** `meta` applie to **all** builds.  
2. **Pipeline-specific** `meta` (defined under a pipeline) override global values for that build only.

---

## Overriding or Adding Stages

### Overriding a Pre-Built Stage

If you want to modify bookpub's pre-built **ejs** stage (for example), just create a matching folder in your project:
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

Bookpub automatically detects `stages/ejs/index.js` and uses it **instead** of the pre-built EJS stage.

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

Here's an example explanation you can include in your README.md under a "Developing Custom Stages" section. This explanation details the API that each stage must follow—specifically, the requirements for the exported `run()` function and its parameters: `manuscript`, `stageConfig`, and `globalConfig`.

---

### Developing Custom Stages

Bookpub's modular design allows you to extend or replace any stage by creating a new module. Each stage is expected to expose a single asynchronous function named `run()`. When Bookpub executes a build pipeline, it will call the `run()` function for each stage, passing in three key parameters:

- **`run()` Function**  
  This is the entry point for your stage. It must be an asynchronous function (or return a Promise) so that the build pipeline can wait for it to complete its work before proceeding to the next stage. For example:
  
  ```js
  export async function run(manuscript, { stageConfig, globalConfig }) {
    // Your custom stage logic here
    return manuscript;
  }
  ```

- **`manuscript` Object**  
  This object represents the current state of the manuscript and is passed from one stage to the next. It typically contains:
  
  - `manuscript.content`: The manuscript content (e.g., rendered Markdown or HTML). Each stage can read or modify this property.
  - `manuscript.buildType`: The current build type (e.g., `'html'`, `'pdf'`, etc.), which might affect how the stage processes the content.
  
  Your stage should update and then return the modified `manuscript` so that subsequent stages can work with the latest version.

- **`stageConfig` Object**  
  This object contains configuration options specific to the current stage. It is built by merging any global defaults (from `global.stages` in `book.config.yml`) with pipeline-specific overrides. It is typically structured as follows:
  
  ```js
  {
    config: {
      // Stage-specific configuration options go here.
      // For example, for the built-in EJS stage:
      rmWhitespace: true
    },
    meta: {
      // Optional stage-specific metadata.
    }
  }
  ```
  
  Use `stageConfig.config` to access options for your stage. For example, if you’re building a custom image compressor, you might include options such as `quality` or `maxWidth` in this object.

- **`globalConfig` Object**  
  This object contains configuration and metadata that apply to every stage. Typically, it includes:
  
  ```js
  {
    meta: {
      // Global metadata such as title, author, publication date, etc.
      title: "My Awesome Book",
      author: "John Doe",
      ...
    }
  }
  ```
  
  This allows your stage to access universal information about the book, regardless of its own specific configuration.

By following this API, you ensure that your custom stage can be seamlessly integrated into Bookpub's build pipeline. Developers can add new functionality or override existing stages simply by creating a folder under `/stages/` with the same name as the stage they want to replace. Bookpub will automatically use your custom implementation.

## Build Outputs

By default, Bookpub outputs to:
```
build/<buildType>/
```
For example:
```
build/html/
build/pdf/
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

First line with a hard break.  <-- Two Spaces
```markdown
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

This code is licensed under the C-MIT (Caffeinated-MIT) License