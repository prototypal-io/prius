import Ember from 'ember';
import VCSSOM from 'vcssom';

export default Ember.Service.extend({
  setup(meta, rootElement) {
    this.vcssom = new VCSSOM(meta);
    this.vcssom.observe(rootElement);
  },

  willDestroy: function() {
    if (this.vcssom) {
      this.vcssom.disconnect();
    }
  },

  observe(node) {
    this.vcssom.observe(node);
  },

  disconnect() {
    this.vcssom.disconnect();
  },

  forceUpdate() {
    this.vcssom.forceUpdate();
  }
});
