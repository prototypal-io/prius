import Ember from 'ember';
import Prius from 'prius';

export default Ember.Service.extend({
  setup(meta) {
    this.prius = new Prius();
    this.prius.setup(meta);
    this.prius.observe();
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
