export function updateTree(manager, element) {
  if (element.nodeType !== 1) {
    return;
  }

  manager.incrementVersion();
  updateNode(manager, element);
  updateDescendants(manager, element);
}

function updateNode(manager, element) {
  for (let selector in manager.meta) {
    if (matches(element, selector)) {
      updateDynamicProperties(manager, element, manager.meta[selector]);
    }
  }
}

function updateDescendants(manager, element) {
  for (let selector in manager.meta) {
    let dynamicDescendants = querySelectorAll(element, selector);

    for (let i = 0; i < dynamicDescendants.length; i++) {
      updateDynamicProperties(manager, dynamicDescendants[i], manager.meta[selector]);
    }
  }
}

function updateDynamicProperties(manager, element, dynamicDeclarations) {
  let style = null;

  for (let i=0; i<dynamicDeclarations.length; i++) {
    // TODO: Filter out custom properties at init time.
    let dynamicDeclaration = dynamicDeclarations[i];
    let property = dynamicDeclaration.name;
    let isCustomProperty = property[0] === '-' && property[1] === '-';
    if (isCustomProperty) { continue; }

    if (!style) {
      style = manager.getStyleFor(element);
    }

    let value = evaluateValues(manager, element, dynamicDeclaration.value).join('');
    style.setProperty(property, value);
  }
}

function evaluateValues(manager, element, values) {
  return values.map(function(value) {
    return evaluateValue(manager, element, value);
  });
}

function evaluateValue(manager, element, value) {
  if (typeof value === 'string') {
    return value;
  } else if (value.type === 'Function') {
    return evaluateFunction(manager, element, value);
  }

  throw new Error("Unknown runtime value");
}

const FUNCTIONS = {
  var(manager, element, values) {
    return (
      closestCustomPropertyValue(manager, element, values[0]) ||
      evaluateValue(manager, element, values[3])
    );
  },

  darken(manager, element, values) {
    return `dark${values[0]}`;
  }
};

function evaluateFunction(manager, element, node) {
  let args = evaluateValues(manager, element, node.args);
  let fn = FUNCTIONS[node.name];
  if (fn) {
    return fn(manager, element, args);
  } else {
    // Fallback to browser implementation
    return `${node.name}(${args.join('')})`;
  }
}

const INLINE_STYLE_VALUE_REGEXP = /^\s*:\s*([^\s;]+)/;

function closestCustomPropertyValue(manager, element, customProperty) {
  let selectors = manager.selectorsForCustomProperty[customProperty];
  if (selectors) {
    let ancestor = element;

    while (ancestor) {
      // Check in this ancestor's inline styles.
      let style = ancestor.getAttribute('style');
      if (style) {
        let index = style.indexOf(customProperty);
        if (index !== -1) {
          let styleTail = style.slice(index + customProperty.length);
          return INLINE_STYLE_VALUE_REGEXP.exec(styleTail)[1];
        }
      }

      // Check if this ancestor matches any preprocessed rule selectors.
      for (let selector in selectors) {
        if (matches(ancestor, selector)) {
          let declaration = findDeclaration(manager.meta[selector], customProperty);
          return evaluateValues(manager, ancestor, declaration.value).join('');
        }
      }

      ancestor = ancestor.parentElement;
    }

    return evaluateValues(manager, null, findDeclaration(manager.meta[':root'], customProperty).value).join('');
  }
}

function findDeclaration(declarations, name) {
  for (let i=0; i<declarations.length; i++) {
    if (declarations[i].name === name) {
      return declarations[i];
    }
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

function matches(element, selector) {
  return element.matches(selector);
}

function querySelectorAll(element, selector) {
  return element.querySelectorAll(selector);
}
