import Ember from 'ember';
import Prius from 'prius';

export default Ember.Service.extend({
  setup(meta, rootElement) {
    this.prius = new Prius(meta);
    this.prius.observe(rootElement);
  },

  willDestroy: function() {
    if (this.prius) {
      this.prius.disconnect();
    }
  },

  observe(node) {
    this.prius.observe(node);
  },

  disconnect() {
    this.prius.disconnect();
  },

  forceUpdate() {
    this.prius.forceUpdate();
  }
});
