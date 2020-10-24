'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';
import MinimapLinterBinding from './minimap-linter-binding';
import { goodMessage } from './helpers';

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
    this.minimapSubscriptions = new CompositeDisposable();
    this.messageCache = new Map();
  },

  deactivate() {
    this.idleCallbacks.forEach((callbackID) => window.cancelIdleCallback(callbackID));
    this.idleCallbacks.clear();
    this.subscriptions.dispose();
    if (!this.minimapProvider) {
      return;
    }
    this.minimapProvider.unregisterPlugin('linter');
    this.minimapProvider = null;
    this.messageCache.clear();
  },
  // Atom package lifecycle events end

  // Package dependencies provisioning start
  // Message management
  updateMessageCache(added, removed) {
    added.forEach(message => this.messageCache.set(message.key, message));
    removed.forEach((message) => {
      this.bindings.forEach((binding) => {
        if (binding.hasMessage(message.key)) {
          binding.removeMessage(message.key);
        }
      });
      this.messageCache.delete(message.key);
    });
  },

  // Minimap
  consumeMinimapServiceV1(minimap) {
    this.minimapProvider = minimap;
    this.minimapProvider.registerPlugin('linter', this);
  },

  // LinterUI (for messages)
  provideUI() {
    const updateMessageCache = this.updateMessageCache.bind(this);
    const { bindings: minimapBindings } = this;

    return {
      name: 'minimap-linter',
      render(messagePatch) {
        // Parse out what messages have been added/removed
        const added = new Map();
        // Store the removed messages for later batched removal
        const removed = new Map(messagePatch.removed.map(m => [m.key, m]));

        minimapBindings.forEach((binding, minimap) => {
          // Validate the editor
          const textEditor = minimap.getTextEditor();
          if (!atom.workspace.isTextEditor(textEditor)) {
            return;
          }
          const filePath = textEditor.getPath();
          if (!filePath) {
            return;
          }

          // Add the messages specific to this TextEditor
          messagePatch.added.forEach((message) => {
            if (goodMessage(message, filePath)) {
              added.set(message.key, message);
              binding.addMessage(message);
            }
          });
        });

        updateMessageCache(added, removed);
      },
      didBeginLinting() {},
      didFinishLinting() {},
      dispose() {
        minimapBindings.forEach((binding) => binding.removeMessages());
      },
    };
  },

  // atom-ide-ui / Nuclide messages
  consumeDiagnosticUpdates(diagnosticUpdater) {
    const updateMessageCache = this.updateMessageCache.bind(this);

    this.subscriptions.add(diagnosticUpdater.observeMessages((messages) => {
      const added = new Map();
      const removed = new Map();
      this.bindings.forEach((binding, minimap) => {
        // Validate the editor
        const textEditor = minimap.getTextEditor();
        if (!atom.workspace.isTextEditor(textEditor)) {
          return;
        }
        const filePath = textEditor.getPath();
        if (!filePath) {
          return;
        }

        // Filter the message list for the current binding's TextEditor
        const filteredMessages = messages.filter((message) => goodMessage(message, filePath));

        // Remove any messages not in the given list
        binding.getMessages().forEach((message) => {
          if (!filteredMessages.includes(message)) {
            removed.set(message.key, message);
          }
        });

        // Add any new messages
        filteredMessages.forEach((message) => {
          if (!binding.hasMessage(message.key)) {
            added.set(message.key, message);
            binding.addMessage(message);
          }
        });
      });

      updateMessageCache(added, removed);
    }));
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
        this.minimapSubscriptions.remove(subscription);
        subscription.dispose();
        this.bindings.delete(minimap);
      });
      this.minimapSubscriptions.add(subscription);

      // Force rendering of old messages after a small delay
      let oldMsgCallbackID;
      const renderOldMessages = () => {
        this.idleCallbacks.delete(oldMsgCallbackID);
        const textEditor = minimap.getTextEditor();
        if (!atom.workspace.isTextEditor(textEditor)) {
          return;
        }
        const filePath = textEditor.getPath();
        this.messageCache.forEach((message) => {
          if (goodMessage(message, filePath) && !binding.hasMessage(message.key)) {
            binding.addMessage(message);
          }
        });
      };
      oldMsgCallbackID = window.requestIdleCallback(renderOldMessages);
      this.idleCallbacks.add(oldMsgCallbackID);
    });
    this.minimapSubscriptions.add(this.minimapsSubscription);
  },

  deactivatePlugin() {
    if (!this.active) {
      return;
    }
    this.bindings.forEach((binding, minimap) => {
      binding.destroy();
      this.bindings.delete(minimap);
    });
    this.minimapSubscriptions.dispose();
  },
  // Minimap plugin lifecycle events end
};
