var cascada = require('cascada');

module.exports = function generateMeta(srcDir, stylesheets) {
  var meta = {
    dynamicSelectors: { ":root": {} },
    selectorsForCustomProperty: {}
  };

  stylesheets.forEach(function(stylesheet) {
    appendMeta(meta, stylesheet);
  });

  return meta;
}

function appendMeta(meta, source) {
  var stylesheet = cascada.parse(source);
  var rules = stylesheet.rules.filter(isStyleRule);

  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    var selectors = rule.selectors;
    var declarations = rule.body.filter(isStylePropertyDeclaration);

    for (var j = 0; j < selectors.length; j++) {
      var selector = selectors[j];

      processCustomProperties(meta, selector, declarations);
      processDynamicDeclarations(meta, selector, declarations);
    }
  }
}

function isStyleRule(rule) {
  return rule.type === 'StyleRule';
}

function isStylePropertyDeclaration(node) {
  return node.type === 'StylePropertyDeclaration';
}

var CUSTOM_PROPERTY_REGEXP = /^--/;

function processCustomProperties(meta, selector, declarations) {
  for (var i = 0; i < declarations.length; i++) {
    var declaration = declarations[i];
    var property = declaration.name;
    var value = declaration.value;

    if (CUSTOM_PROPERTY_REGEXP.test(property)) {
      addCustomPropertyToMeta(meta, selector, property, value);
    }
  }
}

function addCustomPropertyToMeta(meta, selector, property) {
  var selectorsForCustomProperty = meta.selectorsForCustomProperty;

  if (!selectorsForCustomProperty[property]) {
    selectorsForCustomProperty[property] = [];
  }

  selectorsForCustomProperty[property].push(selector);
}

function processDynamicDeclarations(meta, selector, declarations) {
  var dynamicSelectors = meta.dynamicSelectors;
  var dynamicDeclarations = {};

  for (var i = 0; i < declarations.length; i++) {
    var declaration = declarations[i];
    var property = declaration.name;
    var value = undefined;

    var dynamicExpression = parseDynamicExpression(declaration.value);
    if (dynamicExpression) {
      value = dynamicExpression;
    } else if (CUSTOM_PROPERTY_REGEXP.test(property)) {
      value = declaration.value;
    }

    if (value) {
      if (!dynamicSelectors[selector]) {
        dynamicSelectors[selector] = {};
      }

      dynamicSelectors[selector][property] = value;
    }
  }
}

function parseDynamicExpression(expression) {
  var varsRegExp = /var\(\s*([A-Za-z0-9_-]+)\s*(?:,([^)]+))?\)/g;

  var strings = [];
  var vars = [];

  var match = undefined;
  var currentIndex = 0;

  while (match = varsRegExp.exec(expression)) {
    strings.push(expression.slice(currentIndex, match.index));

    var name = match[1];
    var defaultValue = match[2] || null;

    vars.push({ name: name, defaultValue: defaultValue });

    currentIndex = match.index + match[0].length;
  }

  strings.push(expression.slice(currentIndex));

  if (vars.length > 0) {
    return { strings: strings, vars: vars };
  }
}
