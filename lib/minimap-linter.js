"use babel";
import { CompositeDisposable } from 'event-kit';
import MinimapLinterBinding from './minimap-linter-binding';

class MinimapLinter {
    isActive() {
      return this.minimapsSubscription !== undefined;
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
      if (this.minimapsSubscription !== undefined) return this.minimapsSubscription;
      this.minimapsSubscription = this.minimap.observeMinimaps((minimap) => {
        var binding, subscription;
        binding = new MinimapLinterBinding(minimap);
        return this.subscriptions.add(subscription = minimap.onDidDestroy(() => {
          binding.destroy();
          this.subscriptions.remove(subscription);
          return subscription.dispose();
        }));
      });

      return this.minimapsSubscription;
    }

    deactivatePlugin() {
      this.minimapsSubscription.dispose();
      return this.subscriptions.dispose();
    }
}

export default new MinimapLinter();
