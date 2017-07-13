'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';
import MinimapLinterBinding from './minimap-linter-binding';

const messagePath = message =>
  (message.version === 1 ? message.filePath : message.location.file);
const messageRange = message =>
  (message.version === 1 ? message.range : message.location.position);
const goodMessage = (message, filePath) =>
  (messagePath(message) === filePath && messageRange(message));

export default {
  // Atom package lifecycle events start
  activate() {
    this.bindings = new Map();
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
    this.messageCache = new Set();
  },

  deactivate() {
    this.idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID));
    this.idleCallbacks.clear();
    if (!this.minimapProvider) {
      return;
    }
    this.minimapProvider.unregisterPlugin('linter');
    this.minimapProvider = null;
    this.messageCache.clear();
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
    const minimapBindings = this.bindings;
    const messageCache = this.messageCache;
    return {
      name: 'minimap-linter',
      render(messagePatch) {
        // Parse out what messages have been added/removed
        const added = new Set();
        const removed = new Set();
        minimapBindings.forEach((binding, minimap) => {
          const filePath = minimap.getTextEditor().getPath();
          messagePatch.added.forEach((message) => {
            if (goodMessage(message, filePath)) {
              added.add(message);
              binding.addMessage(message);
            }
          });
          messagePatch.removed.forEach((message) => {
            removed.add(message);
            if (binding.hasMessage(message)) {
              binding.removeMessage(message);
            }
          });
        });
        added.forEach(message => messageCache.add(message));
        removed.forEach(message => messageCache.delete(message));
      },
      didBeginLinting() {},
      didFinishLinting() {},
      dispose() {
        minimapBindings.forEach(binding => binding.removeMessages());
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
      this.bindings.set(minimap, binding);
      const subscription = minimap.onDidDestroy(() => {
        binding.destroy();
        this.subscriptions.remove(subscription);
        subscription.dispose();
        this.bindings.delete(minimap);
      });
      this.subscriptions.add(subscription);

      // Force rendering of old messages after a small delay
      let oldMsgCallbackID;
      const renderOldMessages = () => {
        this.idleCallbacks.delete(oldMsgCallbackID);
        const filePath = minimap.getTextEditor().getPath();
        this.messageCache.forEach((message) => {
          if (goodMessage(message, filePath)) {
            binding.addMessage(message);
          }
        });
      };
      oldMsgCallbackID = window.requestIdleCallback(renderOldMessages);
      this.idleCallbacks.add(oldMsgCallbackID);
    });
  },

  deactivatePlugin() {
    if (!this.active) {
      return;
    }
    this.bindings.forEach((binding, minimap) => {
      binding.destroy();
      this.bindings.delete(minimap);
    });
    this.minimapsSubscription.dispose();
    this.subscriptions.dispose();
  },
  // Minimap plugin lifecycle events end
};
