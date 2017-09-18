'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';

const messageRange = message =>
  (message.range ? message.range : message.location.position);
const messageSeverity = (message) => {
  const type = message.type ? message.type.toLowerCase() : '';
  const severity = message.severity ? message.severity : type;
  switch (severity) {
    case 'error':
    case 'warning':
    case 'info':
      return severity;
    default:
      return 'error';
  }
};

export default class MinimapLinterBinding {
  constructor(minimap) {
    this.minimap = minimap;
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
  }

  getMessages() {
    return Array.from(this.markers.keys());
  }

  hasMessage(message) {
    return this.markers.has(message);
  }

  addMessage(message) {
    const markerRange = messageRange(message);
    const marker = this.markerLayer.markBufferRange(markerRange, { invalidate: 'never' });
    this.markers.set(message, marker);
    this.decorateMarker(marker, message);
  }

  removeMessage(message) {
    const marker = this.markers.get(message);
    if (marker) {
      marker.destroy();
    }
    this.markers.delete(message);
  }

  decorateMarker(marker, message) {
    const severity = messageSeverity(message);
    const minimapMarkerDecoration = this.minimap.decorateMarker(marker, {
      type: this.markerType,
      class: `.linter-${severity}`,
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
