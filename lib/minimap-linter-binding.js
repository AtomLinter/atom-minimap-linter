'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';
import { messageRange, messageSeverity } from './helpers';

export default class MinimapLinterBinding {
  constructor(minimap) {
    this.minimap = minimap;
    this.subscriptions = new CompositeDisposable();
    this.editor = this.minimap.getTextEditor();
    this.markerLayer = this.editor.addMarkerLayer();

    this.markers = new Map();
    this.messages = new Map();
    this.decorations = new Set();
    this.markerType = {
      // Default value, to be overridden by config
      error: 'line',
      warning: 'line',
      info: 'line',
    };

    // Try to migrate old config if it exists
    const oldMarkerType = atom.config.get('minimap-linter.markerType');
    if (oldMarkerType) {
      atom.config.set('minimap-linter.markerTypeError', oldMarkerType);
      atom.config.set('minimap-linter.markerTypeWarning', oldMarkerType);
      atom.config.set('minimap-linter.markerTypeInfo', oldMarkerType);
      atom.config.unset('minimap-linter.markerType');
    }

    this.subscriptions.add(
      atom.config.observe('minimap-linter.markerTypeError', (value) => {
        this.markerType.error = value;
        this.redecorateAllMarkers();
      }),
      atom.config.observe('minimap-linter.markerTypeWarning', (value) => {
        this.markerType.warning = value;
        this.redecorateAllMarkers();
      }),
      atom.config.observe('minimap-linter.markerTypeInfo', (value) => {
        this.markerType.info = value;
        this.redecorateAllMarkers();
      }),
    );
  }

  getMessages() {
    return Array.from(this.messages.values());
  }

  hasMessage(messageKey) {
    return this.markers.has(messageKey);
  }

  addMessage(message) {
    if (this.markers.has(message.key)) {
      // This message already has a marker, ignore the duplicate request to mark
      return;
    }
    const markerRange = messageRange(message);
    const marker = this.markerLayer.markBufferRange(markerRange, { invalidate: 'never' });
    this.markers.set(message.key, marker);
    this.messages.set(message.key, message);
    this.decorateMarker(marker, message);
  }

  removeMessage(messageKey) {
    const marker = this.markers.get(messageKey);
    if (marker) {
      marker.destroy();
    }
    // Delete references to destroyed decorations
    this.decorations.forEach((decoration) => {
      if (decoration.destroyed) {
        this.decorations.delete(decoration);
      }
    });
    this.markers.delete(messageKey);
    this.messages.delete(messageKey);
  }

  decorateMarker(marker, message) {
    const severity = messageSeverity(message);
    if (this.markerType[severity] !== 'off') {
      const minimapMarkerDecoration = this.minimap.decorateMarker(marker, {
        type: this.markerType[severity],
        class: `.linter-${severity}`,
        plugin: 'linter',
      });
      this.decorations.add(minimapMarkerDecoration);
    }
  }

  redecorateAllMarkers() {
    this.removeDecorations();
    this.markers.forEach((marker, key) => {
      this.decorateMarker(marker, this.messages.get(key));
    });
  }

  removeDecorations() {
    this.decorations.forEach((decoration) => decoration.destroy());
    this.decorations.clear();
  }

  removeMessages() {
    this.removeDecorations();
    this.markers.forEach((marker) => marker.destroy());
    this.markers.clear();
    this.messages.clear();
  }

  destroy() {
    this.removeMessages();
    this.markerLayer.destroy();
    this.subscriptions.dispose();
  }
}
