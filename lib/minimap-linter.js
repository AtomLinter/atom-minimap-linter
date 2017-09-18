'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';
import MinimapLinterBinding from './minimap-linter-binding';

const messagePath = message =>
  (message.filePath ? message.filePath : message.location.file);
const messageRange = message =>
  (message.range ? message.range : message.location.position);
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
  // Message management
  updateMessageCache(added, removed) {
    added.forEach(message => this.messageCache.add(message));
    removed.forEach((message) => {
      this.bindings.forEach((binding) => {
        if (binding.hasMessage(message)) {
          binding.removeMessage(message);
        }
      });
      this.messageCache.delete(message);
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
        const added = new Set();
        // Store the removed messages for later batched removal
        const removed = new Set(messagePatch.removed);

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
              added.add(message);
              binding.addMessage(message);
            }
          });
        });

        updateMessageCache(added, removed);
      },
      didBeginLinting() {},
      didFinishLinting() {},
      dispose() {
        minimapBindings.forEach(binding => binding.removeMessages());
      },
    };
  },

  // atom-ide-ui / Nuclide messages
  consumeDiagnosticUpdates(diagnosticUpdater) {
    const updateMessageCache = this.updateMessageCache.bind(this);

    this.subscriptions.add(diagnosticUpdater.observeMessages((messages) => {
      const added = new Set();
      const removed = new Set();
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
        const filteredMessages = messages.filter((message) => {
          if (message.scope !== 'file' || message.filePath == null) {
            return false;
          }
          return goodMessage(message, filePath);
        });

        // Remove any messages not in the given list
        binding.getMessages().forEach((message) => {
          if (!filteredMessages.includes(message)) {
            removed.add(message);
          }
        });

        // Add any new messages
        filteredMessages.forEach((message) => {
          if (!binding.hasMessage(message)) {
            added.add(message);
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
        this.subscriptions.remove(subscription);
        subscription.dispose();
        this.bindings.delete(minimap);
      });
      this.subscriptions.add(subscription);

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
