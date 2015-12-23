'use babel';
import { CompositeDisposable } from 'atom';
import MinimapLinterBinding from './minimap-linter-binding';

class MinimapLinter {
    constructor() {
      this.config = {
        markerType: {
          type: 'string',
          default: 'highlight-over',
          enum: ['line', 'highlight-under', 'highlight-over', 'highlight-outline'],
          description: 'Marker type'
        }
      };
      this.bindings = [];
    }

    isActive() {
      return this.minimapsSubscription !== undefined && !this.minimapsSubscription.disposed;
    }

    activate() {
      this.subscriptions = new CompositeDisposable();
    }

    consumeMinimapServiceV1(minimap) {
      this.minimap = minimap;
      this.minimap.registerPlugin('linter', this);
    }

    deactivate() {
      this.minimap.unregisterPlugin('linter');
      this.minimap = null;
    }

    activatePlugin() {
      if (this.isActive()) return;

      this.minimapsSubscription = this.minimap.observeMinimaps((minimap) => {
        let subscription, binding;
        this.bindings.push(binding = new MinimapLinterBinding(minimap));
        return this.subscriptions.add(subscription = minimap.onDidDestroy(() => {
          binding.destroy();
          this.subscriptions.remove(subscription);
          return subscription.dispose();
        }));
      });
    }

    deactivatePlugin() {
      this.bindings.forEach(binding => binding.destroy());
      this.bindings = [];
      this.minimapsSubscription.dispose();
      return this.subscriptions.dispose();
    }
}

export default new MinimapLinter();
