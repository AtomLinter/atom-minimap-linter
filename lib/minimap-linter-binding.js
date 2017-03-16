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

  renderDecorations(messages = []) {
    // Parse out what messages have been added/removed
    const added = new Set();
    const removed = new Set();
    const filePath = this.editor.getPath();
    messages.forEach((message) => {
      if (!this.messages.has(message) && goodMessage(message, filePath)) {
        added.add(message);
      }
    });
    this.messages.forEach((message) => {
      if (!messages.includes(message)) {
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
      class: `.linter-line-${message.severity}`,
      plugin: 'linter',
    });
    this.decorations.add(minimapMarkerDecoration);
  }

  destroy() {
    this.removeDecorations();
    this.markers.forEach(marker => marker.destroy());
    this.markers.clear();
    this.markerLayer.destroy();
    this.messages.clear();
    this.subscriptions.dispose();
  }

  removeDecorations() {
    this.decorations.forEach(decoration => decoration.destroy());
    this.decorations.clear();
  }
}
