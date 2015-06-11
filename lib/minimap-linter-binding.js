"use babel";
import { CompositeDisposable } from 'event-kit';

export default class MinimapBookmarksBinding {
  constructor(minimap) {
    this.minimap = minimap;
    this.subscriptions = new CompositeDisposable();
    this.editor = this.minimap.getTextEditor();
    this.subscriptions.add(this.editor.displayBuffer.onDidAddDecoration((decoration) => {
      if (decoration.properties && decoration.properties['class'] && decoration.properties['class'].indexOf('linter-') === 0) {
        this.minimap.decorateMarker(decoration.marker, { type: 'line', 'class': decoration.properties['class'] });
      }
    }));
  }

  destroy() {
    return this.subscriptions.dispose();
  }
}
