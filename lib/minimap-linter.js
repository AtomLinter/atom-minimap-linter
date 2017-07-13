'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';
import MinimapLinterBinding from './minimap-linter-binding';

const bindings = new Map();

export default {
  // Atom package lifecycle events start
  activate() {
    this.idleCallbacks = new Set();
    let depsCallbackID;
    const installMinimapLinterDeps = () => {
      this.idleCallbacks.delete(depsCallbackID);
      if (!atom.inSpecMode()) {
        require('atom-package-deps').install('minimap-linter');
      }
    };
    depsCallbackID = window.requestIdleCallback(installMinimapLinterDeps);
    this.idleCallbacks.add(depsCallbackID);
    this.subscriptions = new CompositeDisposable();
  },

  deactivate() {
    this.idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID));
    this.idleCallbacks.clear();
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
      render(messagePatch) {
        bindings.forEach(binding => binding.renderDecorations(messagePatch));
      },
      didBeginLinting() {},
      didFinishLinting() {},
      dispose() {
        bindings.forEach(binding => binding.removeMessages());
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
