var css = require('css');

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

function appendMeta(meta, stylesheet) {
  var ast = css.parse(stylesheet);
  var rules = ast.stylesheet.rules.filter(isRule);

  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    var selectors = rule.selectors;
    var declarations = rule.declarations.filter(isDeclaration);

    for (var j = 0; j < selectors.length; j++) {
      var selector = selectors[j];

      processCustomProperties(meta, selector, declarations);
      processDynamicDeclarations(meta, selector, declarations);
    }
  }
}

function isRule(maybeRule) {
  return maybeRule.type === 'rule';
}

function isDeclaration(maybeDeclaration) {
  return maybeDeclaration.type === 'declaration';
}

var CUSTOM_PROPERTY_REGEXP = /^--/;

function processCustomProperties(meta, selector, declarations) {
  for (var i = 0; i < declarations.length; i++) {
    var declaration = declarations[i];
    var property = declaration.property;
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
    var property = declaration.property;
    var value;

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
