export function updateTree(manager, element) {
  if (element.nodeType !== 1) {
    return;
  }

  manager.incrementVersion();
  updateNode(manager, element);
  updateDescendants(manager, element);
}

function updateNode(manager, element) {
  let dynamicSelectors = manager.meta.dynamicSelectors;

  for (let selector in dynamicSelectors) {
    if (element.matches(selector)) {
      updateDynamicProperties(manager, element, dynamicSelectors[selector]);
    }
  }
}

function updateDescendants(manager, element) {
  let dynamicSelectors = manager.meta.dynamicSelectors;

  for (let selector in dynamicSelectors) {
    let dynamicDescendants = element.querySelectorAll(selector);

    for (let i = 0; i < dynamicDescendants.length; i++) {
      updateDynamicProperties(manager, dynamicDescendants[i], dynamicSelectors[selector]);
    }
  }
}

const CUSTOM_PROPERTY_REGEXP = /^--/;

function updateDynamicProperties(manager, element, dynamicDeclarations) {
  let style = null;

  for (let property in dynamicDeclarations) {
    let expression = dynamicDeclarations[property];

    if (!CUSTOM_PROPERTY_REGEXP.test(property)) {
      let value = evaluateExpression(manager.meta, element, expression);

      style = style || manager.getStyleFor(element);
      style.setProperty(property, value);
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
    let _var = vars[i];
    value += (closestValue(meta, element, _var.name) || _var.defaultValue)+ strings[i+1];
  }

  return value;
}

const INLINE_STYLE_VALUE_REGEXP = /^\s*:\s*([^\s;]+)/;

function closestValue(meta, element, customProperty) {
  let style = element.getAttribute('style');
  if (style) {
    let index = style.indexOf(customProperty);
    if (index !== -1) {
      let styleTail = style.slice(index + customProperty.length);
      let value = INLINE_STYLE_VALUE_REGEXP.exec(styleTail)[1];
      return value;
    }
  }

  let closest = closestWithCustomProperty(meta, element, customProperty);
  if (closest) {
    let expression = meta.dynamicSelectors[closest.selector][customProperty];
    return evaluateExpression(meta, closest.ancestor, expression);
  }
}

function closestWithCustomProperty(meta, element, customProperty) {
  let selectors = meta.selectorsForCustomProperty[customProperty];

  if (selectors) {
    let ancestor = element;

    while (ancestor && ancestor.matches) {
      for (let i = 0; i < selectors.length; i++) {
        let selector = selectors[i];

        if (ancestor.matches(selector)) {
          return { ancestor, selector };
        }
      }

      ancestor = ancestor.parentNode;
    }

    return { ancestor: null, selector: ':root' };
  }
}

export function removeTree(manager, element) {
  if (element.nodeType !== 1) {
    return;
  }

  manager.deleteRuleFor(element);

  let childNodes = element.childNodes;

  for (let i = 0; i < childNodes.length; i++) {
    removeTree(manager, childNodes[i]);
  }
}
