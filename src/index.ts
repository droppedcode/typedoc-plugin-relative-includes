import { Application } from 'typedoc';

import { RelativeIncludesRenderer } from './relative-includes-renderer';

/**
 * Load the plugin.
 *
 * @param pluginHost Plugin host to load to.
 */
export function load(pluginHost: Application): void {
  const app = pluginHost.owner;

  new RelativeIncludesRenderer().initialize(app);
}
