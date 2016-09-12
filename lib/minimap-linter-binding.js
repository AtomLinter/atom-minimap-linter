'use babel';
import { CompositeDisposable } from 'atom';

const markerTypeConfigKey = 'minimap-linter.markerType';

export default class MinimapBookmarksBinding {
  constructor(editorMinimap) {
    this.markerType = atom.config.get('minimap-linter.markerType') || 'highlight-over';
    this.editorMinimap = editorMinimap;
    this.subscriptions = new CompositeDisposable();
    this.editor = this.editorMinimap.getTextEditor();
    this.decorations = [];
    this.reloadDecorations();

    atom.config.onDidChange(markerTypeConfigKey, ({ newValue }) => {
      this.markerType = newValue;
      this.reloadDecorations();
    });

    this.subscriptions.add(this.editor.onDidAddDecoration(decoration => this.processDecoration(decoration)));
  }

  reloadDecorations() {
    this.removeDecorations();
    for (let decoration in this.editor.getDecorations()) {
      this.processDecoration(decoration);
    }
  }

  processDecoration (linterDecoration) {
    if (linterDecoration.properties && linterDecoration.properties.class && linterDecoration.properties.class.indexOf('linter-') === 0) {
      const minimapDecoration = this.editorMinimap.decorateMarker(linterDecoration.marker, {
        type: ~linterDecoration.properties.class.indexOf('linter-row') ? 'gutter' : this.markerType,
        class: linterDecoration.properties.class
      });
      this.decorations.push(minimapDecoration);
    }
  }

  destroy() {
    this.removeDecorations();
    return this.subscriptions.dispose();
  }

  removeDecorations() {
    if (this.decorations.length === 0) return;
    this.decorations.forEach(decoration => decoration.destroy());
    this.decorations = [];
  }
}
