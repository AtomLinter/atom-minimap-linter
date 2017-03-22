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
  constructor(minimap) {
    this.minimap = minimap;
    this.subscriptions = new CompositeDisposable();
    this.editor = this.minimap.getTextEditor();
    this.markerLayer = this.editor.addMarkerLayer();

    this.messages = new Set();
    this.markers = new Map();
    this.decorations = new Set();

    this.subscriptions.add(atom.config.observe('minimap-linter.markerType', (value) => {
      this.markerType = value;
      this.removeDecorations();
      this.markers.forEach((marker, message) => this.decorateMarker(marker, message));
    }));
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
      const markerRange = messageRange(message);
      const marker = this.markerLayer.markBufferRange(markerRange, { invalidate: 'never' });
      this.markers.set(message, marker);
      this.messages.add(message);
      this.decorateMarker(marker, message);
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
    this.messages.clear();
  }

  destroy() {
    this.removeMessages();
    this.markerLayer.destroy();
    this.subscriptions.dispose();
  }

}
