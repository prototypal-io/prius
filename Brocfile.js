var funnel = require('broccoli-funnel');
var merge = require('broccoli-merge-trees');
var babel = require('broccoli-babel-transpiler');
var concat = require('broccoli-sourcemap-concat');

var lib = funnel('lib');
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
