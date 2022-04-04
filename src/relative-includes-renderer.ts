import path = require('path');

import { Application, Context, Converter, Reflection } from 'typedoc';
import { Node } from 'typescript';

/**
 * Converts include statement to contain the relative path.
 */
export class RelativeIncludesRenderer {
  private _typedoc?: Readonly<Application>;

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

        const filePath = this.getNodeFilePath(n);
        if (!filePath) return;
        this.replaceInReflection(r, filePath, includes);
      }
    );
  }

  /**
   * Get the file the node was created from.
   *
   * @param node The node.
   * @returns The file path.
   */
  private getNodeFilePath(node: Node): string | undefined {
    if (!node) return undefined;
    if ('fileName' in node) return node['fileName'];

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
    if (reflection.comment) {
      reflection.comment.shortText = this.replaceInComment(
        reflection.comment.shortText,
        filePath,
        includes
      );
      reflection.comment.text = this.replaceInComment(
        reflection.comment.text,
        filePath,
        includes
      );
    }
  }

  /**
   * Applies the replacement info to the comment.
   *
   * @param comment The comment on which to apply the replacement info.
   * @param filePath Path of the parsed file.
   * @param includes The includes option.
   * @returns The modified comment.
   */
  private replaceInComment(
    comment: string,
    filePath: string,
    includes: string
  ): string {
    return comment.replace(
      this._includePattern,
      (_match, prefix, pathGroup, suffix) => {
        if (
          typeof pathGroup === 'string' &&
          (pathGroup.startsWith('./') || pathGroup.startsWith('../'))
        ) {
          const result =
            prefix +
            path.relative(
              includes,
              path.join(path.dirname(filePath), pathGroup)
            ) +
            suffix;
          return result;
        } else {
          return _match;
        }
      }
    );
  }
}
