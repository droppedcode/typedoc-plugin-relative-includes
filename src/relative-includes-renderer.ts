import fs = require('fs');
import path = require('path');

import {
  Application,
  Context,
  Converter,
  MarkdownEvent,
  PageEvent,
  Reflection,
} from 'typedoc';
import { Node } from 'typescript';

/**
 * Converts include statement to contain the relative path.
 */
export class RelativeIncludesRenderer {
  private _typedoc?: Readonly<Application>;
  /** Maps a reflection to a source file it was created from. */
  private _reflectionPaths: Map<Reflection, string[]> = new Map();

  /**
   * The pattern used to find references in markdown.
   */
  private _includePattern = /(\[\[include:\s*)([^\]]+?)(\s*\]\])/g;

  /**
   * Create a new RelativeIncludesConverterComponent instance.
   *
   * @param typedoc The application.
   */
  public initialize(typedoc: Readonly<Application>): void {
    this._typedoc = typedoc;
    let includes: string = '';

    typedoc.converter.on(Converter.EVENT_BEGIN, () => {
      includes = this._typedoc?.options.getValue('includes') ?? '';
    });

    typedoc.converter.on(
      Converter.EVENT_CREATE_DECLARATION,
      (c: Readonly<Context>, r: Reflection, n: Node) => {
        if (!includes) return;

        const folderPaths = this.getFolderPaths(n, r, c);

        if (!folderPaths) return;
        this._reflectionPaths.set(r, folderPaths);

        let filePath = this.getNodeFilePath(n);
        if (!filePath && r.sources) {
          filePath = r.sources[0].fileName;
        }

        if (!filePath) return;
        this.replaceInReflection(r, filePath, includes);
      }
    );

    let currentReflection: Reflection | undefined = undefined;
    let currentOutputFilePath: string | undefined = undefined;

    typedoc.renderer.on(PageEvent.BEGIN, (event: PageEvent) => {
      currentOutputFilePath = event.url;
      currentReflection =
        event.model instanceof Reflection ? event.model : undefined;
    });

    typedoc.renderer.on(
      MarkdownEvent.PARSE,
      (event: MarkdownEvent) => {
        if (!currentOutputFilePath) return;
        if (!currentReflection) return;

        const folderPaths = this._reflectionPaths.get(currentReflection);

        if (!folderPaths) return;

        event.parsedText = this.replaceInComment(
          event.parsedText,
          folderPaths,
          includes
        );
      },
      undefined,
      1 // Do it before the default
    );
  }

  /**
   * Get the folder path for the current item.
   *
   * @param n Node.
   * @param r Reflection.
   * @param c Context.
   * @returns The folder path for the current context item or undefined.
   */
  private getFolderPaths(
    n: Node,
    r: Reflection,
    c: Readonly<Context>
  ): string[] | undefined {
    if (r.parent) {
      const filePath = this.getNodeFilePath(n) ?? this.getReflectionFilePath(r);
      return filePath ? [path.dirname(filePath)] : undefined;
    } else {
      const result: string[] = [];
      const filePath = this.getReflectionFilePath(r);
      if (filePath) {
        result.push(path.dirname(filePath));
      }
      result.push(c.program.getCurrentDirectory());
      return result;
    }
  }

  /**
   * Get the first file the reflection was created from.
   *
   * @param reflection The reflection.
   * @returns The file path.
   */
  private getReflectionFilePath(reflection: Reflection): string | undefined {
    if (!reflection.sources || reflection.sources.length === 0) return;

    return reflection.sources[0].fileName;
  }

  /**
   * Get the file the node was created from.
   *
   * @param node The node.
   * @returns The file path.
   */
  private getNodeFilePath(node: Node): string | undefined {
    if (!node) return undefined;
    if ('fileName' in node) return <string | undefined>node['fileName'];

    return this.getNodeFilePath(node.parent);
  }

  /**
   * Applies the replacement info to a reflection, recursively.
   *
   * @param reflection The reflection.
   * @param filePath Path of the parsed file.
   * @param includes THe includes option.
   */
  private replaceInReflection(
    reflection: Reflection,
    filePath: string,
    includes: string
  ): void {
    if (reflection.comment?.summary.length) {
      for (const summary of reflection.comment.summary) {
        summary.text = this.replaceInComment(
          summary.text,
          [path.dirname(filePath)],
          includes
        );
      }
    }
  }

  /**
   * Applies the replacement info to the comment.
   *
   * @param comment The comment on which to apply the replacement info.
   * @param originalFolderPaths Possible paths of the parsed file.
   * @param includes The includes option.
   * @returns The modified comment.
   */
  private replaceInComment(
    comment: string,
    originalFolderPaths: string[],
    includes: string
  ): string {
    return comment.replace(
      this._includePattern,
      (_match, prefix, pathGroup, suffix) => {
        if (
          typeof pathGroup === 'string' &&
          (pathGroup.startsWith('./') || pathGroup.startsWith('../'))
        ) {
          let referencePath: string | undefined;

          for (const p of originalFolderPaths) {
            const possiblePath = path.join(p, pathGroup);
            if (fs.existsSync(possiblePath)) {
              referencePath = possiblePath;
              break;
            }
          }

          if (!referencePath) {
            console.warn(
              `Missing file on relative paths: ${pathGroup}, paths tried: [${originalFolderPaths.join(
                ', '
              )}]`
            );

            return prefix + pathGroup + suffix;
          }

          const relative = path.relative(includes, referencePath);

          const result = prefix + relative + suffix;
          return result;
        } else {
          return _match;
        }
      }
    );
  }
}
