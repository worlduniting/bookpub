# Changelog

## [0.3.0] - 2023-5-14

### Added

* New Testing Framework!
    * Added Mocha and Chai for BDD/TDD testing
    * Created Mock Book/Manuscript
        * Mock book.config.mock.yml
        * Mock manuscript using most major EJS funcitonality
    * Added Archive function to be able to view test builds
        * Creates an archive of builds for each test in the `archives/` folder
    * Created test:clean npm task for removing archives/builds

## [0.2.0] - 2023-5-9

### Added

* New Book Project Creator
    * `bookpub new my-book` starts a generator that asks basic questions (title, author, etc.) to assist in creating a new custom book project.
    * Copies the `example-book` default book and project contents, adding answers to the questions asked.

* New Github Issue Forms

* New Custom "Example Book" added as part of book project creator
    * Used book microformat demo page and converted it into BookPub format.
    * Included basic convention files like CONTRIBUTING, CODE_OF_CONDUCT, CHANGELOG, etc.
    * Included .github folder with errata and feature templates
    * Included .vscode folder with recommended extensions and some custom settings

* New Assets folder
    * A place to store master documents for art and other assets
    * Included an InDesign print 5x9 cover art template from Lightning Source as an example
    * Included cover art master for non-print book, with Adobe Illustrator format

* Custom Webpack and Nodemon config files are added to each new book/project created.

* Added command `bookpub lint` to run EJS Linter against all manuscript EJS files.
    * This was originally part of the convert.js module, but removed due to some duplication of errors with EJS rendering module.

### Changed

* Overhaul and refactoring of entire code base
    * Streamlining and cleaning up inefficient code

### Fixed

* A number of bugs.

### Removed

* (See above)

---

## [0.1.0] - 2023-3-17

### Added

* Themes
    * `./manuscript/theme` directory will now be the default location for themes. The hope is to provide a consistent structure for themeing that can simply be dropped into the manuscript/ folder.
    * current structure is:
    
    ```markdown
    theme/
    |--BOOM!-README    // README describing theme
    |--css/styles.css  // Main Stylesheet
    |--fonts/          // Additional Fonts
    |--media/          // Any other media to include: imgs/vids/etc
    ```

### Changed

* Unified Pipeline
    * Removed rehype from the pipeline for simplicity
        * using rehype was making things more complicated
        * found a way to accomplish the same thing with less packages/code
    * Employing a new convention for referencing issues
        * - Fixed a bug that caused the app to crash when clicking the "Submit" button. ([#1234])


        * Following the [GitHub guidelines](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-to-issues-and-pull-requests#linking-to-issues-in-your-information-resources):
        ```markdown
        [#1234]: <https://github.com/your-username/your-repo/issues/1234>
        ```

### Fixed

* Spaces or indentation before @includes caused them to be ignored.
    * This was a problem with includerJS
    * The includerjs package was updated to latest version that included a mod to the RegExp used to discover @includes. Blank spaces are now ignored.

### Removed

* `lib/plugins`
    * Included directive plugin within the `convert.js` module for simplicity
    * May abstract this in the future, back to having a plugin/ folder where custom directives can be added back in
