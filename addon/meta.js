import cascada from 'cascada';
import { FUNCTIONS } from './dom';

export function generateMeta(cssString) {
  var meta = { ':root': [] };

  appendMeta(meta, cssString);

  return meta;
}

function appendMeta(meta, source) {
  var stylesheet = cascada.parse(source, { customFunctions: FUNCTIONS });
  var rules = stylesheet.rules.filter(function(rule) {
    return rule.type === 'StyleRule';
  });

  for (var i = 0; i < rules.length; i++) {
    processRule(meta, rules[i]);
  }
}

function processRule(meta, rule) {
  var selectors = rule.selectors;
  var body = rule.body;

  for (var i = 0; i < body.length; i++) {
    var declaration = body[i];
    var property = declaration.name;
    var result = processValues(declaration.values);

    var isCustomProperty = property[0] === '-' && property[1] === '-';
    var isDynamic = result.dynamic || isCustomProperty;

    if (isDynamic) {
      for (var j = 0; j < selectors.length; j++) {
        var selector = selectors[j];

        if (!meta[selector]) { meta[selector] = []; }

        meta[selector].push({
          type: 'Declaration',
          name: property,
          value: result.values
        });
      }
    }
  }
}

function processValues(nodes) {
  var dynamic = false;

  var values = nodes.map(function(node) {
    if (node.source) {
      return node.source;
    } else if (node.type === 'Function') {
      var result = processValues(node.args);
      dynamic = dynamic || result.dynamic || node.name === 'var';
      return {
        type: 'Function',
        name: node.name,
        args: result.values
      };
    } else {
      var error = new Error("Unknown node type");
      error.node = node;
      throw error;
    }
  });

  return {
    dynamic: dynamic,
    values: values
  };
}

// function parseDynamicExpression(expression) {
//   var varsRegExp = /var\(\s*([A-Za-z0-9_-]+)\s*(?:,([^)]+))?\)/g;
//
//   var strings = [];
//   var vars = [];
//
//   var match;
//   var currentIndex = 0;
//
//   while (match = varsRegExp.exec(expression)) {
//     strings.push(expression.slice(currentIndex, match.index));
//
//     var name = match[1];
//     var defaultValue = match[2] || null;
//
//     vars.push({ name: name, defaultValue: defaultValue });
//
//     currentIndex = match.index + match[0].length;
//   }
//
//   strings.push(expression.slice(currentIndex));
//
//   if (vars.length > 0) {
//     return { strings: strings, vars: vars };
//   }
// }
