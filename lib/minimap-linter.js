'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';
import MinimapLinterBinding from './minimap-linter-binding';
import configSchema from './minimap-linter-config';

class MinimapLinter {
  constructor() {
    this.config = configSchema;
    this.bindings = [];
  }

    // Atom package lifecycle events start
  activate() {
    this.subscriptions = new CompositeDisposable();
  }

  deactivate() {
    this.minimapProvider.unregisterPlugin('linter');
    this.minimapProvider = null;
  }
    // Atom package lifecycle events end

    // Package dependencies provisioning start
  consumeMinimapServiceV1(minimapProvider) {
    this.minimapProvider = minimapProvider;
    this.minimapProvider.registerPlugin('linter', this);
  }
    // Package dependencies provisioning end

    // Minimap plugin lifecycle events start
  isActive() {
    return this.minimapsSubscription !== undefined && !this.minimapsSubscription.disposed;
  }

  activatePlugin() {
    if (this.isActive()) return;

      // Handle each minimap
    this.minimapsSubscription = this.minimapProvider.observeMinimaps((editorMinimap) => {
      let subscription;
      let binding;
      this.bindings.push(binding = new MinimapLinterBinding(editorMinimap));

        // minimap destroyed
      return this.subscriptions.add(subscription = editorMinimap.onDidDestroy(() => {
        binding.destroy();
        this.subscriptions.remove(subscription);
        return subscription.dispose();
      }));
    });
  }

  deactivatePlugin() {
    this.bindings.forEach(binding => binding.destroy());
    this.bindings = [];
    this.minimapsSubscription.dispose();
    return this.subscriptions.dispose();
  }
    // Minimap plugin lifecycle events end
}

export default new MinimapLinter();
