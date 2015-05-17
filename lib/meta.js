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
  var rules = css.parse(stylesheet).stylesheet.rules;

  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    if (rule.type === 'rule') {
      var selectors = rule.selectors;
      var declarations = rule.declarations;

      for (var j = 0; j < selectors.length; j++) {
        var selector = selectors[j];

        processCustomProperties(meta, selector, declarations);
        processDynamicDeclarations(meta, selector, declarations);
      }
    }
  }
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
  var dynamicDeclarations = {};
  var hasDynamicDeclarations = false;

  for (var i = 0; i < declarations.length; i++) {
    var declaration = declarations[i];
    var property = declaration.property;
    var value = declaration.value;

    var dynamicExpression = parseDynamicExpression(value);
    if (dynamicExpression) {
      dynamicDeclarations[property] = dynamicExpression;
      hasDynamicDeclarations = true;
    } else if (CUSTOM_PROPERTY_REGEXP.test(property)) {
      dynamicDeclarations[property] = value;
      hasDynamicDeclarations = true;
    }
  }

  if (hasDynamicDeclarations) {
    meta.dynamicSelectors[selector] = dynamicDeclarations;
  }
}

function parseDynamicExpression(expression) {
  var varsRegExp = /var\(\w*([A-Za-z0-9_-]+)\w*\)/g;

  var strings = [];
  var vars = [];

  var match = undefined;
  var currentIndex = 0;

  while (match = varsRegExp.exec(expression)) {
    strings.push(expression.slice(currentIndex, match.index));
    vars.push(match[1]);

    currentIndex = match.index + match[0].length;
  }

  strings.push(expression.slice(currentIndex));

  if (vars.length > 0) {
    return { strings: strings, vars: vars };
  }
}
