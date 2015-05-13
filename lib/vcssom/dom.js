export function updateTree(meta, element) {
  updateNode(meta, element);
  updateDescendants(meta, element);
}

export function updateNode(meta, element) {
  let { dynamicSelectors } = meta;

  for (let selector in dynamicSelectors) {
    if (element.matches(selector)) {
      updateDynamicProperties(meta, element, dynamicSelectors[selector]);
    }
  }
}

export function updateDescendants(meta, element) {
  let { dynamicSelectors } = meta;

  for (let selector in dynamicSelectors) {
    let dynamicDescendants = element.querySelectorAll(selector);

    for (let i = 0; i < dynamicDescendants.length; i++) {
      updateDynamicProperties(meta, dynamicDescendants[i], dynamicSelectors[selector]);
    }
  }
}

const CUSTOM_PROPERTY_REGEXP = /^--/;

function updateDynamicProperties(meta, element, dynamicDeclarations) {
  for (let property in dynamicDeclarations) {
    let expression = dynamicDeclarations[property];

    if (!CUSTOM_PROPERTY_REGEXP.test(property)) {
      let value = evaluateExpression(meta, element, expression);
      element.style.setProperty(property, value);
    }
  }
}

function evaluateExpression(meta, element, expression) {
  if (typeof expression === 'object') {
    return evaluateVarExpression(meta, element, expression);
  } else {
    return expression;
  }
}

function evaluateVarExpression(meta, element, { strings, vars }) {
  let value = strings[0];

  for (let i = 0; i < vars.length; i++) {
    value += closestValue(meta, element, vars[i]) + strings[i+1];
  }

  return value;
}

function closestValue(meta, element, customProperty) {
  let selector = closestSelectorWithCustomProperty(meta, element, customProperty);
  let expression = meta.dynamicSelectors[selector][customProperty];
  return evaluateExpression(meta, element, expression);
}

function closestSelectorWithCustomProperty(meta, element, customProperty) {
  let selectors = meta.selectorsForCustomProperty[customProperty];
  let ancestor = element;

  while (ancestor && ancestor.matches) {
    for (let i = 0; i < selectors.length; i++) {
      let selector = selectors[i];

      if (ancestor.matches(selector)) {
        return selector;
      }
    }

    ancestor = ancestor.parentNode;
  }

  return ':root';
}
