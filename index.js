/* jshint node: true */
'use strict';

var injectMeta = require('./lib/inject');

module.exports = {
  name: 'prius',

  postprocessTree: function(type, tree) {
    if (type === 'all') {
      return injectMeta(tree);
    }

    return tree;
  }
};
