# Add your stages here

In this folder you can:
* Override a default stage; or
* Add your own custom stage

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
