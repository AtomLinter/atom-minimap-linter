'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';
import MinimapLinterBinding from './minimap-linter-binding';

export default {
  // Atom package lifecycle events start
  activate() {
    this.bindings = [];
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
  // Package dependencies provisioning end

  // Minimap plugin lifecycle events start
  active: false,

  bindings: {},

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
      const id = minimap.id;
      const binding = new MinimapLinterBinding(minimap);
      this.bindings[id] = binding;
      const subscription = minimap.onDidDestroy(() => {
        binding.destroy();
        this.subscriptions.remove(subscription);
        subscription.dispose();
        delete this.bindings[id];
      });

      this.subscriptions.add(subscription);
    });
  },

  deactivatePlugin() {
    if (!this.active) {
      return;
    }
    Object.keys(this.bindings).forEach(id => this.bindings[id].destroy());
    this.bindings = {};
    this.minimapsSubscription.dispose();
    this.subscriptions.dispose();
  },
  // Minimap plugin lifecycle events end
};
