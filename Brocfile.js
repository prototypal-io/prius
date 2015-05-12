var funnel = require('broccoli-funnel');
var merge = require('broccoli-merge-trees');
var babel = require('broccoli-babel-transpiler');
var concat = require('broccoli-sourcemap-concat');
var replace = require('broccoli-string-replace');

var lib = merge(['lib', getCSSParserTree()]);
var tests = funnel('test', { include: ['*.js'] });

module.exports = merge([
  compileAndConcat(lib, 'vcssom.js'),
  compileAndConcat(tests, 'vcssom-tests.js')
]);

function compileAndConcat(tree, outputFile) {
  var babelled = babel(tree, {
    modules: 'amdStrict',
    moduleIds: true
  });

  var concatted = concat(babelled, {
    inputFiles: ['**'],
    outputFile: outputFile
  });

  return concatted;
}

function getCSSParserTree() {
  var css = funnel('node_modules/css/lib/parse', {
    destDir: 'vcssom',
    getDestinationPath: function() {
      return 'parser.js';
    }
  });

  return replace(css, {
    files: ['vcssom/parser.js'],
    pattern: {
      match: "module.exports =",
      replacement: "export default"
    }
  });
}
