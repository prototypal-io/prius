var fs = require('fs');
var path = require('path');
var walkSync = require('walk-sync');
var mkdirpSync = require('mkdirp').sync;

var Writer = require('broccoli-writer');
var mergeTrees = require('broccoli-merge-trees');

var generateMeta = require('./meta');

module.exports = function injectModernRules(tree) {
  return mergeTrees([tree, new InjectMeta(tree)], { overwrite: true });
};

function InjectMeta(inputTree) {
  this.inputTree = inputTree;
}

InjectMeta.prototype = Object.create(Writer.prototype);

InjectMeta.prototype.write = function(readTree, destDir) {
  return readTree(this.inputTree).then(function(srcDir) {
    var paths = walkSync(srcDir);
    var cssPaths = paths.filter(isExt('.css'));
    var htmlPaths = paths.filter(isExt('.html'));

    var stylesheets = readStyleSheets(srcDir, cssPaths);
    var meta = generateMeta(srcDir, stylesheets);
    findAndReplaceWithMeta(srcDir, destDir, htmlPaths, meta);
  });
};

function readStyleSheets(srcDir, cssPaths) {
  return cssPaths.map(function(cssPath) {
    var src = path.join(srcDir, cssPath);

    return fs.readFileSync(src, 'utf8');
  });
}

function findAndReplaceWithMeta(srcDir, destDir, htmlPaths, meta) {
  var escapedMeta = "";
  escapedMeta += '<meta name="prius" content="';
  escapedMeta += encodeURI(JSON.stringify(meta));
  escapedMeta += '">';

  htmlPaths.forEach(function(htmlPath) {
    var src = path.join(srcDir, htmlPath);
    var dest = path.join(destDir, htmlPath);

    mkdirpSync(path.dirname(dest));

    var html = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, html.replace("{{prius-meta}}", escapedMeta));
  });
}

function isExt(ext) {
  return function(filePath) {
    return path.extname(filePath) === ext;
  };
}
