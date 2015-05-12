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

const VAR_EXPRESSION_REGEXP = /^var\((.*)\)/;

function parseDynamicExpression(expression) {
  let matches = VAR_EXPRESSION_REGEXP.exec(expression);
  if (matches) {
    return matches[1];
  }
}
