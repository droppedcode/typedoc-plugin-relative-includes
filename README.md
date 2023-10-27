# Relative includes plugin for typedoc

This plugin for typedoc allows the use of relative path in markdown includes.

This way if you can define a relative (to the current document) path and it will resolve it when creating the documentation.

The path must be relative (starting with `./` or `../`) to the current file processed to be included, paths not starting like this will be handled by the original renderer.

## How to use

You must define the includes option, this is needed for typedoc to find the files (see: [options](https://typedoc.org/guides/options/#includes)). This is only needed for typedoc the relative path will be relative to your comment!:

```json
{
  "includes": "src"
}
```

You can use the relative path (for more example see the test cases on the git):

```ts
/**
 * My test class.
 *
 * [[include ./test.md]]
 */
class Test {}
```

## Typedoc

Supports 0.25 (tested with 0.25.2)

For 0.23 see version 1.0.4

For 0.22 see version 1.0.2

## If it does not work

Possible reasons:

- The plugin is not installed
- Typedoc version is not supported (happens every "major" typedoc release)
- The file is not there where you think it is (use the `--logLevel Verbose` command line parameter to see the messages)
- Wrong file included: because of how typedoc generation works sometimes a determining the path is not so easy, wrong file can be included if there is multiple same named files in the file tree. I have not seen this happen and should't happen, but theoretically it is possible.
- The [[include: x]] is not included in an md file. Md file does not support include only the comments handled by typedoc (still the file path will be changed by the plugin to be relative to src folder).
- The plugin option is not used with typedoc.

## How to build

- download the source or clone it
- npm i
- npm run build

## How to debug

- `npm run test:prep`
- Update the `@droppedcode/typedoc-plugin-copy-assets` version in `tests\typedoc-plugins-example\package.json` if needed
- vscode F5 or debug or run `npx typedoc` in the `tests\typedoc-plugins-example` folder
