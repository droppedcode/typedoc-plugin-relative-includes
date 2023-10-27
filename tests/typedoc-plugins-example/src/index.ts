/**
 * THIS PLUGIN WILL REPLACE RELATIVE PATH IN INCLUDE WITH ABSOLUTE, WILL NOT INCLUDE THE FILES THAT IS SUPPORTED BY TYPEDOC OR A DIFFERENT PLUGIN
 *
 * Documentation about collection module
 *
 * [[include: ./root.md]]
 *
 * @module
 */
/**
 * [[include:./module-1/README.md]]
 */
export * as module_1 from './module-1';
/**
 * [[include:./module-2/README.md]]
 *
 * This does not exist:
 * [[include:./module-2/README2.md]]
 * This does not exist end.
 */
export * as module_2 from './module-2';
