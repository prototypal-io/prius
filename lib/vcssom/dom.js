export function updateTree(meta, element) {
  updateNode(meta, element);
  updateDescendants(meta, element);
}

export function updateNode(meta, element) {
  let { dynamicSelectors } = meta;

  for (let i = 0; i < dynamicSelectors.length; i++) {
    let { selector, dynamicDeclarations } = dynamicSelectors[i];

    if (element.matches(selector)) {
      updateDynamicProperties(meta, element, dynamicDeclarations);
    }
  }
}

export function updateDescendants(meta, element) {
  let { dynamicSelectors } = meta;

  for (let i = 0; i < dynamicSelectors.length; i++) {
    let { selector, dynamicDeclarations } = dynamicSelectors[i];
    let dynamicDescendants = element.querySelectorAll(selector);

    for (let i = 0; i < dynamicDescendants.length; i++) {
      updateDynamicProperties(meta, dynamicDescendants[i], dynamicDeclarations);
    }
  }
}

function updateDynamicProperties(meta, element, dynamicDeclarations) {
  for (let i = 0; i < dynamicDeclarations.length; i++) {
    let { property, expression } = dynamicDeclarations[i];
    let value = evaluateExpression(meta, element, expression);
    element.style.setProperty(property, value);
  }
}

function evaluateExpression(meta, element, expression) {
  return closestValue(meta, element, expression);
}

function closestValue(meta, element, customProperty) {
  let selector = closestSelectorWithCustomProperty(meta, element, customProperty);
  return meta.customProperties[selector][customProperty];
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
