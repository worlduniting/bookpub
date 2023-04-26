# BookPub - a book publishing framework for a web-driven world

<!--- Logo picture element for user's light/dark modes --->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/bookpub-logo_white.png">
  <img style="text-align: center" alt="BookPub logo header" src="./assets/bookpub-logo.svg">
</picture>

An advanced book typesetting and publishing framework for publishing houses.

**BookPub** manages a manuscript-to-market toolchain, allowing publishing firms and their authors to track one markdown-based manuscript source, which can be built into any format (PDF, EPUB, MOBI, HTML), and can be professionally designed and typeset (for print houses) using HTML, CSS and Javascript Web Standards.

## Features

1. **[Markdown](https://www.markdownguide.org/) Based Manuscript**
    * **It's All Plain Text.**

      Easy-to-read, easy-to-write using the industry standard, Markdown, for authoring content.
    * **Lot's of Ready Made Apps/Tools.**

      Because markdown is ubiquitous for authoring content, there are already loads of tools and apps out there. But you can use any plain text editor (or Code Editor)
    * **Easy to Manage Edits & Versions.**

      Because it's plain text, we can use the most robust versioning software out there. We recommend github.com, but you can use any versioning platform.
2. **Javascript Enabled With [EJS](https://ejs.co/)**
    * **BookPub** uses EJS (Embedded Javascript) Templating which means that the entire world of javascript is at your disposal:

      * Use conditionals to only render certain sections of your manuscript for certain formats (like pdf, epub, mobi, etc)

      * Use any NPM package or javascript library, to add a world of possibilities to your book

      * Use custom layouts and includes to reuse parts of your manuscript
  * **Automatic Conversion of quotes and en/em-dashes**
    * Using Smartypants, all quotes and en/em-dashes will be automatically converted to curly (left/right) quotes and the relevant UTF-8 Codes/Typeset for en/em-dashes
  * **Multiple Formats**
    * Formats currently supported: PDF-ebook, PDF-print, HTML
    * Coming very soon (epub, mobi, and more)

## Install

### Install **BookPub**

  * From the command line:

    `npm install BookPub`

### Install PrinceXML (to build PDFs)

  * [Installation and Setup Instructions Here](https://www.princexml.com/doc/installing/)

## Usage

**BookPub** is essentially an HTML/CSS/Javascript based book framework. All the different book formats are built off of this foundation. That said, we've attempted to help streamline the process by integrating common industry tools best-practices.

### 1. Creating Your Book Project

To create a new **BookPub** book project, simply type the following command on your command line:

`npx create-book-project`

This will walk you through the creation of a new book project, and will generate our default book example, with the following structure:

```plain
bookpub-project
  |- book.config.yml        # Meta and Config Data (ISBN, Title, etc.)
  |- README.md              # Documentation for Contributors
  |- assets/                # Media assets (illustrator, photoshop, etc.)
  |- build/                 # Built book formats (pdf, html, epub)
  |- manuscript/            # Manuscript source
    |-- index.md.ejs        # Entryfile for your manuscript
    |-- frontmatter/        # Frontmatter content (titlepage, preface, etc.)
    |-- mainmatter/         # Main content (chapters, etc.)
    |-- backmatter/         # Backmatter content (author's note, bibliography)
    |-- theme/              # Theme & Design elements
      |--- css/             # CSS for each format
      |--- js/              # Javascript files
      |--- media/           # Media & Artwork
      |--- fonts/           # Custom fonts
  |- release-builds/        # Publicly released builds
```

### 2. Managing Your Book's Meta Data (book.config.yml)

The `book.config.yml` is a [YAML File](https://www.cloudbees.com/blog/yaml-tutorial-everything-you-need-get-started) used to store your book's meta-data and configuration settings. You can use this file to store details about the book, like the title, isbn, author, lccn, etc. 

All the data in `book.config.yml` is made available for you to use in the manuscript source.

**For Example:**

Let's say that we have the following `book.config.yml` file:

```yml
# book.yml

title: My Book Title
isbn-13: 012345678910

# (the rest of your meta data)

settings:
  entryfile: index.md.ejs
```

In your `index.md.ejs` you can access the book title using EJS syntax:

```ejs
The title of my book is "<%= meta.title %>".
```

Your build file will then be renderred as:

```
The title of my book is "My Book Title".
```

### 3. Working With Your Manuscript

We have tried to give users as much flexibility as possible. That said, there are a few things to keep in mind:

1. All source code for your manuscript must be stored in the `manuscript/` folder.

2. All files must end with .ejs

* For a tutorial on using EJS, visit [the EJS Site](https://ejs.co/)
  * Our convention for naming files has been `[name].[filetype].ejs`.
    * If we have an html file that we want to add, it will be named `myname.html.ejs`
    * The only part of the name that is necessary is the `.ejs` extension. For the sake of clarity, we recommend describing the file-type in the middle.
3. The entryfile (the beginning of your manuscript) must be in your `manuscript/` folder.
  * We recommend keeping the first file as `index.md.ejs`
  * You can choose another name or location. But it must be specified in your `book.config.yml`

    For example, if you want your entryfile to be `myentryfile.md.ejs`, record it in your book.config.yml as:

    ```yml
    # book.config.yml

    # Let's set our entryfile
    settings:
      entryfile: myentryfile.md.ejs

    ```

### 4. Building Your Book

The basic command for building a specific format (type) of your book is the following:

`bookpub build -t [format-type]`

1. The HTML format of your book

  * All that is needed to build the HTML format of your book is to type this command in your project's home directory:

    `bookpub build -t html`

    This will build your manuscript into an HTML version of your book, located in the `build/html/` folder.

2. The Print-PDF version of your book

  * To build a pdf typeset version of your book for print, type this command in your project's root directory:

    `bookpub build -t pdf`

    This will build your manuscript into a print-ready PDF version of your book in the `build/pdf/` folder.

### 5. "Dev" Mode - A Development Workflow

We built the **BookPub** framework to make writing, designing, typesetting and formatting your book as streamlined and instantaneous as possible.

With "dev" mode, you can work in REAL TIME. Changes in your manuscript are rebuilt and reloaded in your browser in real time.

"Dev" mode will launch a browser window that will display the newly built version of your book, which will be updated as changes are made to your manuscript.

#### HTML "DEV" Mode

To work on the HTML version of your book in "dev" mode, type:

    `bookpub dev -t html`

Now, as you edit your manuscript, the final HTML build will automatically be reloaded into your browser with the new updates.

> Developer Note:
>
> 1. We are using Nodemon to watch for changes in your manuscript directory and build a new copy upon any change.
> 2. We are using Webpack to serve any new builds to your browser and refresh when a new build is created.

#### PDF "DEV" MODE

To work on the PDF version of your book in "dev" mode, type:

`bookpub dev -t pdf`

Now, as you edit your manuscript, the final PDF Print build will automatically reload in your browser (or PDF viewer).

> Developer Note:
>
> 1. You can also open your preferred PDF viewer. Generally speaking, when new builds are created due to manuscript source changes, your PDF viewer should automatically update with the new PDF. We have tried this only with Mac's Preview app, which seems to load each new PDF build.

### 6. Themes: Book Design & Typesetting

**BookPub** uses industry standard web technologies for the design and layout of your book: HTML, CSS(3), and Javascript.

We chose to use web standards for the design element because they are free, they are universal, they are flexible, and there is an unending supply of resources for learning and working with these standards.

> Developer Note:
>
> There is clearly a significant audience who prefer to write their books using tools like Pandoc and LaTex for print typesetting. In our experience, even though these tools are powerful, they also requiring a significant learning curve, and their implementation is difficult to say the least.

#### Your Theme Folder

We have intentionally chosen to place all custom styling/fonts/media/etc. in the `theme/` folder of your manuscript/ directory.

> Developer Note:
>
> You can actually use whatever structure/location you want. We decided to use the `theme/` convention in order to allow a consistent way to drop new formatting/themes into your book by simply copying a new theme into your manuscript folder.

#### Styling with CSS or SASS

**BookPub** allows you to use Plain CSS (.css), or Sass CSS (*.scss) to style your html book.

  * If you change your .css files to .scss, **BookPub** will use Sass to build your CSS prior to its use in the build process [(More information about SASS)](https://sass-lang.com/)

  * We recommend using a new stylesheet for each format
    * This allows you to create a conditional statement in your index.md.ejs file, that loads a stylesheet based upon the output type (format). So if you are building html, the styles.html.scss file will be used.

### 7. Working With the Print-Ready PDF

We have chosen to use PrinceXML to create the PDF builds. In the future, we may also include the ability to use other pdf generators, but for now it's PrinceXML.

Please consult the [princexml.com](princexml.com) website for their documentation on building PDFs from HTML/CSS/Javascript

> Developer Note:
>
> PrinceXML is a pay-for-license and proprietary software, but they generously allow use of their software. The only tradeoff for free use is the presence of a small logo/watermark on the very first page of any PDF that is generated.
>
> You can also use Docusaurus (an online PDF generator that uses PrinceXML) as a pay-per-service version that uses PrinceXML.
>
> Currently, PrinceXML seems to have the best PDF rendering engine, especially for advanced typesetting, using HTML/CSS3/Javascript.