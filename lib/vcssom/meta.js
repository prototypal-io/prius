import parse from "./parser";

export function buildMeta(css) {
  let meta = {
    dynamicSelectors: [],
    customProperties: { ":root": {} },
    selectorsForCustomProperty: {}
  };

  let { rules } = parse(css).stylesheet;

  for (let i = 0; i < rules.length; i++) {
    let { selectors, declarations } = rules[i];

    for (let i = 0; i < selectors.length; i++) {
      let selector = selectors[i];

      processCustomProperties(meta, selector, declarations);
      processDynamicDeclarations(meta, selector, declarations);
    }
  }

  return meta;
}

const CUSTOM_PROPERTY_REGEXP = /^--/;

function processCustomProperties(meta, selector, declarations) {
  for (let i = 0; i < declarations.length; i++) {
    let { property, value } = declarations[i];

    if (CUSTOM_PROPERTY_REGEXP.test(property)) {
      addCustomPropertyToMeta(meta, selector, property, value);
    }
  }
}

function addCustomPropertyToMeta(meta, selector, property, value) {
  let { customProperties, selectorsForCustomProperty } = meta;

  if (!customProperties[selector]) {
    customProperties[selector] = {};
  }

  customProperties[selector][property] = value;

  if (!selectorsForCustomProperty[property]) {
    selectorsForCustomProperty[property] = [];
  }

  selectorsForCustomProperty[property].push(selector);
}

function processDynamicDeclarations(meta, selector, declarations) {
  let dynamicDeclarations = [];

  for (let i = 0; i < declarations.length; i++) {
    let { property, value } = declarations[i];
    let dynamicExpression = parseDynamicExpression(value);

    if (dynamicExpression) {
      dynamicDeclarations.push({
        property: property,
        expression: dynamicExpression
      });
    }
  }

  if (dynamicDeclarations.length > 0) {
    meta.dynamicSelectors.push({ selector, dynamicDeclarations });
  }
}

function parseDynamicExpression(expression) {
  let varsRegExp = /var\(\w*([A-Za-z0-9_-]+)\w*\)/g;

  let strings = [];
  let vars = [];

  let match;
  let currentIndex = 0;

  while (match = varsRegExp.exec(expression)) {
    strings.push(expression.slice(currentIndex, match.index));
    vars.push(match[1]);

    currentIndex = match.index + match[0].length;
  }

  strings.push(expression.slice(currentIndex));

  if (vars.length > 0) {
    return { strings, vars };
  }
}
