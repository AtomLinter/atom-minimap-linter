'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';
import MinimapLinterBinding from './minimap-linter-binding';

const bindings = new Map();

export default {
  // Atom package lifecycle events start
  activate() {
    require('atom-package-deps').install('minimap-linter');
    this.subscriptions = new CompositeDisposable();
  },

  deactivate() {
    if (!this.minimapProvider) {
      return;
    }
    this.minimapProvider.unregisterPlugin('linter');
    this.minimapProvider = null;
  },
  // Atom package lifecycle events end

  // Package dependencies provisioning start
  // Minimap
  consumeMinimapServiceV1(minimap) {
    this.minimapProvider = minimap;
    this.minimapProvider.registerPlugin('linter', this);
  },

  // LinterUI (for messages)
  provideUI() {
    return {
      name: 'minimap-linter',
      render({ messages }) {
        bindings.forEach(binding => binding.renderDecorations(messages));
      },
      didBeginLinting() {},
      didFinishLinting() {},
      dispose() {
        bindings.forEach(binding => binding.renderDecorations([]));
      },
    };
  },
  // Package dependencies provisioning end

  // Minimap plugin lifecycle events start
  active: false,

  isActive() {
    return this.minimapsSubscription !== undefined && !this.minimapsSubscription.disposed;
  },

  activatePlugin() {
    if (this.active) {
      return;
    }

    this.active = true;

    // Handle each minimap
    this.minimapsSubscription = this.minimapProvider.observeMinimaps((minimap) => {
      const binding = new MinimapLinterBinding(minimap);
      bindings.set(minimap, binding);
      const subscription = minimap.onDidDestroy(() => {
        binding.destroy();
        this.subscriptions.remove(subscription);
        subscription.dispose();
        bindings.delete(minimap);
      });

      this.subscriptions.add(subscription);
    });
  },

  deactivatePlugin() {
    if (!this.active) {
      return;
    }
    bindings.forEach((binding, minimap) => {
      binding.destroy();
      bindings.delete(minimap);
    });
    this.minimapsSubscription.dispose();
    this.subscriptions.dispose();
  },
  // Minimap plugin lifecycle events end
};
