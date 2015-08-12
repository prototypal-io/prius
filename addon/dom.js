export function updateTree(manager, element) {
  if (element.nodeType !== 1) {
    return;
  }

  manager.incrementVersion();
  updateNode(manager, element);
  updateDescendants(manager, element);
}

export function registerCustomFunction(name, callback) {
  FUNCTIONS[name] = callback;
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

  let queue = dynamicDeclarations.slice().reverse();

  let customPropertyValues = {};

  let dynamicDeclaration;
  while (dynamicDeclaration = queue.pop()) {
    // TODO: Filter out custom properties at init time.
    let property = dynamicDeclaration.name;

    let isCustomProperty = dynamicDeclaration.type === 'Declaration' && property[0] === '-' && property[1] === '-';
    if (isCustomProperty) {
      customPropertyValues[dynamicDeclaration.name] = evaluateValues(manager, element, dynamicDeclaration.value, customPropertyValues).join('');
    }

    if (!style) {
      style = manager.getStyleFor(element);
    }

    if (dynamicDeclaration.type === 'ApplyRule') {
      queue.push.apply(queue, closestMixinDeclarations(manager, element, dynamicDeclaration.name));
    } else {
      let value = evaluateValues(manager, element, dynamicDeclaration.value, customPropertyValues).join('');
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

function evaluateValues(manager, element, values, knowns) {
  return values.map(function(value) {
    return evaluateValue(manager, element, value, knowns);
  });
}

function evaluateValue(manager, element, value, knowns) {
  if (typeof value === 'string') {
    return value;
  } else if (value.type === 'Function') {
    return evaluateFunction(manager, element, value, knowns);
  }

  throw new Error("Unknown runtime value");
}

const FUNCTIONS = {
  var(manager, element, values, knowns) {
    return (
      closestCustomPropertyValue(manager, element, values[0], knowns) ||
      evaluateValue(manager, element, values[3], knowns)
    );
  }
};

function evaluateFunction(manager, element, node, knowns) {
  let args = evaluateValues(manager, element, node.args, knowns);
  let fn = FUNCTIONS[node.name];
  if (fn) {
    return fn(manager, element, args, knowns);
  } else {
    // Fallback to browser implementation
    return `${node.name}(${args.join('')})`;
  }
}

const INLINE_STYLE_VALUE_REGEXP = /^\s*:\s*([^\s;]+)/;

function closestCustomPropertyValue(manager, element, customProperty, knowns) {
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
          let value = evaluateValues(manager, ancestor, declaration.value, knowns).join('');
          knowns[customProperty] = value;
          return value;
        }
      }

      ancestor = ancestor.parentElement;
    }

    let declaration = findDeclaration(manager.meta[':root'], customProperty);
    let value = evaluateValues(manager, ancestor, declaration.value, knowns).join('');
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
