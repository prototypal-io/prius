var generateMeta = require('./meta');

module.exports = function(babel) {
  var t = babel.types;

  return new babel.Transformer('prius-precompile-meta', {

    ImportDeclaration: function(node, parent, scope, file) {
      if (t.isLiteral(node.source, { value: "prius-precompile-meta" })) {
        var first = node.specifiers && node.specifiers[0];
        if (t.isImportDefaultSpecifier(first)) {
          file.importSpecifier = first.local.name;
        }
        this.remove();
      }
    },

    TaggedTemplateExpression: function(node, parent, scope, file) {
      if (t.isIdentifier(node.tag, { name: file.importSpecifier })) {
        if (node.quasi.expressions.length) {
          throw file.errorWithNode(node, "prius-precompile-meta does not support place holders.");
        }
        
        var cssSource = node.quasi.quasis[0].value.cooked;
        var meta = generateMeta(null, [cssSource]);

        return t.objectExpression([
          t.property('init', t.identifier('css'), t.valueToNode(cssSource)),
          t.property('init', t.identifier('meta'), t.valueToNode(meta)),
        ]);
      }
    }
  });
};
