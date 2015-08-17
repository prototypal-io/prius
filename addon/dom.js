export function updateTree(manager, element, customFunctions) {
  if (element.nodeType !== 1) {
    return;
  }

  manager.incrementVersion();
  updateNode(manager, element, customFunctions);
  updateDescendants(manager, element, customFunctions);
}

function updateNode(manager, element, customFunctions) {
  for (let selector in manager.meta) {
    if (matches(element, selector)) {
      updateDynamicProperties(manager, element, manager.meta[selector], customFunctions);
    }
  }
}

function updateDescendants(manager, element, customFunctions) {
  for (let selector in manager.meta) {
    let dynamicDescendants = querySelectorAll(element, selector);

    for (let i = 0; i < dynamicDescendants.length; i++) {
      updateDynamicProperties(manager, dynamicDescendants[i], manager.meta[selector], customFunctions);
    }
  }
}

function updateDynamicProperties(manager, element, dynamicDeclarations, customFunctions) {
  let style = null;

  let queue = dynamicDeclarations.slice().reverse();

  let customPropertyValues = {};

  let dynamicDeclaration;
  while (dynamicDeclaration = queue.pop()) {
    // TODO: Filter out custom properties at init time.
    let property = dynamicDeclaration.name;

    let isCustomProperty = dynamicDeclaration.type === 'Declaration' && property[0] === '-' && property[1] === '-';
    if (isCustomProperty) {
      customPropertyValues[dynamicDeclaration.name] = evaluateValues(manager, element, dynamicDeclaration.value, customPropertyValues, customFunctions).join('');
    }

    if (!style) {
      style = manager.getStyleFor(element);
    }

    if (dynamicDeclaration.type === 'ApplyRule') {
      queue.push.apply(queue, closestMixinDeclarations(manager, element, dynamicDeclaration.name));
    } else {
      let value = evaluateValues(manager, element, dynamicDeclaration.value, customPropertyValues, customFunctions).join('');
      style.setProperty(property, value);
    }
  }
}

function closestMixinDeclarations(manager, element, mixinName) {
  let selectors = manager.selectorsForMixins[mixinName];
  if (selectors) {
    let ancestor = element;

    while (ancestor) {
      // // Check in this ancestor's inline styles.
      // let style = ancestor.getAttribute('style');
      // if (style) {
      //   let index = style.indexOf(customProperty);
      //   if (index !== -1) {
      //     let styleTail = style.slice(index + customProperty.length);
      //     return INLINE_STYLE_VALUE_REGEXP.exec(styleTail)[1];
      //   }
      // }

      // Check if this ancestor matches any preprocessed rule selectors.
      for (let selector in selectors) {
        if (matches(ancestor, selector)) {
          let declaration = findDeclaration(manager.meta[selector], mixinName);
          return declaration.value;
        }
      }

      ancestor = ancestor.parentElement;
    }

    return findDeclaration(manager.meta[':root'], mixinName).value;
  }
}

function evaluateValues(manager, element, values, knowns, customFunctions) {
  return values.map(function(value) {
    return evaluateValue(manager, element, value, knowns, customFunctions);
  });
}

function evaluateValue(manager, element, value, knowns, customFunctions) {
  if (typeof value === 'string') {
    return value;
  } else if (value.type === 'Function') {
    return evaluateFunction(manager, element, value, knowns, customFunctions);
  }

  throw new Error("Unknown runtime value");
}

function variable(manager, element, values, knowns, customFunctions) {
  return (
    closestCustomPropertyValue(manager, element, values[0], knowns, customFunctions) ||
    evaluateValue(manager, element, values[3], knowns, customFunctions)
  );
}

function evaluateFunction(manager, element, node, knowns, customFunctions) {
  let args = evaluateValues(manager, element, node.args, knowns, customFunctions);
  let fn = customFunctions[node.name];
  if (node.name === 'var') {
    return variable(manager, element, args, knowns, customFunctions);
  } else if (fn) {
    return fn(args);
  } else {
    // Fallback to browser implementation
    return `${node.name}(${args.join('')})`;
  }
}

const INLINE_STYLE_VALUE_REGEXP = /^\s*:\s*([^\s;]+)/;

function closestCustomPropertyValue(manager, element, customProperty, knowns, customFunctions) {
  if (knowns[customProperty] !== undefined) {
    return knowns[customProperty];
  }
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
          let value = evaluateValues(manager, ancestor, declaration.value, knowns, customFunctions).join('');
          knowns[customProperty] = value;
          return value;
        }
      }

      ancestor = ancestor.parentElement;
    }

    let declaration = findDeclaration(manager.meta[':root'], customProperty);
    let value = evaluateValues(manager, ancestor, declaration.value, knowns, customFunctions).join('');
    knowns[customProperty] = value;
    return value;
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
