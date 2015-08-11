var pickFiles = require('broccoli-static-compiler');
var compileES6 = require('broccoli-es6-concatenator');

var addonTree = pickFiles('../addon', {srcDir: '/', destDir: 'prius'});

var compiled = compileES6(addonTree, {
  wrapInEval: false,
  // loaderFile: 'loader.js',
  inputFiles: ['prius/index.js'],
  outputFile: '/prius.js',
  legacyFilesToAppend: []
});

module.exports = compiled;
