'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';

const markerTypeConfigKey = 'minimap-linter.markerType';

export default class MinimapLinterBinding {
  constructor(minimap) {
    this.minimap = minimap;
    this.subscriptions = new CompositeDisposable();
    this.editor = this.minimap.getTextEditor();

    this.decorations = [];

    this.subscriptions.add(atom.config.observe(markerTypeConfigKey, (value) => {
      this.markerType = value;
      this.reloadDecorations();
    }));

    this.subscriptions.add(this.editor.onDidAddDecoration(
      decoration => this.processDecoration(decoration),
    ));
  }

  reloadDecorations() {
    this.removeDecorations();
    this.editor.getDecorations().forEach((decoration) => {
      this.processDecoration(decoration);
    });
  }

  processDecoration(linterDecoration) {
    if (linterDecoration.properties &&
      linterDecoration.properties.class &&
      linterDecoration.properties.class.indexOf('linter-') === 0
    ) {
      const minimapDecoration = this.minimap.decorateMarker(linterDecoration.marker, {
        type: linterDecoration.properties.class.includes('linter-row') ? 'gutter' : this.markerType,
        class: linterDecoration.properties.class,
      });
      this.decorations.push(minimapDecoration);
    }
  }

  destroy() {
    this.removeDecorations();
    this.subscriptions.dispose();
  }

  removeDecorations() {
    if (this.decorations.length === 0) {
      return;
    }
    this.decorations.forEach(decoration => decoration.destroy());
    this.decorations = [];
  }
}
