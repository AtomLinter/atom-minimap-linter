'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';

const messagePath = message =>
  (message.version === 1 ? message.filePath : message.location.file);
const messageRange = message =>
  (message.version === 1 ? message.range : message.location.position);
const goodMessage = (message, filePath) =>
  (messagePath(message) === filePath && messageRange(message));

export default class MinimapLinterBinding {
  constructor(minimap, messages) {
    this.minimap = minimap;
    this.messages = messages;
    this.subscriptions = new CompositeDisposable();
    this.editor = this.minimap.getTextEditor();
    this.markerLayer = this.editor.addMarkerLayer();

    this.markers = new Map();
    this.decorations = new Set();
    this.idleCallbacks = new Set();

    this.subscriptions.add(atom.config.observe('minimap-linter.markerType', (value) => {
      this.markerType = value;
      this.removeDecorations();
      this.markers.forEach((marker, message) => this.decorateMarker(marker, message));
    }));

    // Handle any existing messages in the cache for this file
    let hasMessages = false;
    const filePath = this.editor.getPath();
    this.messages.forEach((message) => {
      if (!hasMessages && goodMessage(message, filePath)) {
        hasMessages = true;
        this.renderOldMessages();
      }
    });
  }

  async waitOnIdle() {
    return new Promise((resolve) => {
      const callbackID = window.requestIdleCallback(() => {
        this.idleCallbacks.delete(callbackID);
        resolve();
      });
      this.idleCallbacks.add(callbackID);
    });
  }

  async renderOldMessages() {
    // FIXME: Wait on an idle timeout as if we process this immediately the
    // TextEditor isn't ready yet.
    // Needs to be fixed in Minimap as it is the one calling this package too early
    await this.waitOnIdle();
    const filePath = this.editor.getPath(); // Not cached as it may change
    if (filePath) {
      this.messages.forEach((message) => {
        if (goodMessage(message, filePath)) {
          this.addMessage(message);
        }
      });
    }
  }

  addMessage(message) {
    const markerRange = messageRange(message);
    const marker = this.markerLayer.markBufferRange(markerRange, { invalidate: 'never' });
    this.markers.set(message, marker);
    this.decorateMarker(marker, message);
  }

  renderDecorations(messagePatch) {
    // Parse out what messages have been added/removed
    const added = new Set();
    const removed = new Set();
    const filePath = this.editor.getPath();
    messagePatch.added.forEach((message) => {
      if (goodMessage(message, filePath)) {
        added.add(message);
      }
    });
    messagePatch.removed.forEach((message) => {
      if (this.messages.has(message)) {
        removed.add(message);
      }
    });

    // Handle any removed messages
    removed.forEach((message) => {
      const marker = this.markers.get(message);
      if (marker) {
        marker.destroy();
      }
      this.messages.delete(message);
      this.markers.delete(message);
    });

    // Handle any added messages
    added.forEach((message) => {
      this.messages.add(message);
      this.addMessage(message);
    });
  }

  decorateMarker(marker, message) {
    const minimapMarkerDecoration = this.minimap.decorateMarker(marker, {
      type: this.markerType,
      class: `.linter-${message.severity}`,
      plugin: 'linter',
    });
    this.decorations.add(minimapMarkerDecoration);
  }

  removeDecorations() {
    this.decorations.forEach(decoration => decoration.destroy());
    this.decorations.clear();
  }

  removeMessages() {
    this.removeDecorations();
    this.markers.forEach(marker => marker.destroy());
    this.markers.clear();
  }

  destroy() {
    this.removeMessages();
    this.markerLayer.destroy();
    this.subscriptions.dispose();
  }
}
