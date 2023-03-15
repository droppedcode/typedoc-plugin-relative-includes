# Relative includes plugin for typedoc

This plugin for typedoc allows the use of relative path in markdown includes.

This way if you can define a relative (to the current document) path and it will resolve it when creating the documentation.

The path must be relative (starting with `./` or `../`) to the current file processed to be included, paths not starting like this will be handled by the original renderer.

## How to use

```ts
/**
 * My test class.
 *
 * [[include ./test.md]]
 */
class Test {}
```
