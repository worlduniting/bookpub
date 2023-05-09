# Changelog

## [0.2.0] - 2023-3-17

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
