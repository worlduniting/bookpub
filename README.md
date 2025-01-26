<p align="center">
  <img src="assets/bookpub-logo.svg" align="right" hspace="30" vspace="30" width="30%" height="30%" alt="BookPub logo header"/>
</p>

# Bookpub

A forward-thinking book publishing pipeline; a modular CLI that helps you publish books written in **Markdown+EJS** to formats like PDF, EPUB, HTML **or anything else you can think of**!

BookPub manages a manuscript-to-market toolchain, allowing publishing firms, authors and other stakeholders to manage one markdown-based manuscript source, which can be professionally designed and typeset (even for print) using HTML, CSS and Javascript Web Standards. Bookpub will build your manuscript into any format (PDF, EPUB, MOBI, HTML). BookPub offers:

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
- [FAQ](#faq)  
- [License](#license)

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

## Using Pipelines

### Default Pipelines

Bookpub comes with default pipelines for `pdf` and `epub`:

```yaml
# If you don't define custom pipelines, these defaults apply:
# pdf:
#   1) ejs
#   2) markdown
#   3) theme
# epub:
#   1) ejs
#   2) markdown
#   3) theme
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

## FAQ

**Q**: *Do I need [Pandoc](https://pandoc.org) installed for the markdown → HTML stage?*  
**A**: Yes, the default markdown stage uses Pandoc. If you don’t have it, you can either install Pandoc or override the stage with your own converter.

**Q**: *Can I define multiple build types?*  
**A**: Absolutely! Each build type is a separate pipeline in `book.config.yml`. Use `bookpub build <buildType>` to run that pipeline.

**Q**: *What if I just want to write plain Markdown without EJS?*  
**A**: You can. If the EJS stage doesn’t find `.md.ejs`, it will skip. Or you can remove the ejs stage from your pipeline altogether.

---

## License

[MIT](./LICENSE) – this means you’re free to use, modify, and distribute Bookpub as you see fit. 

**Enjoy publishing!** If you have questions or ideas, feel free to open an issue or PR on the GitHub repo. 
```