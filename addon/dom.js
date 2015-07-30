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
  let queue = dynamicDeclarations.slice().reverse();

  let customPropertyRefs = {};

  let properties = {};

  let dynamicDeclaration;
  while (dynamicDeclaration = queue.pop()) {
    // TODO: Filter out custom properties at init time.
    let property = dynamicDeclaration.name;

    let isCustomProperty = dynamicDeclaration.type === 'Declaration' && property[0] === '-' && property[1] === '-';
    if (isCustomProperty) {
      customPropertyRefs[dynamicDeclaration.name] = {
        value: valuesToLazyConcat(manager, element, dynamicDeclaration.value, customPropertyRefs)
      };
    }

    if (dynamicDeclaration.type === 'ApplyRule') {
      queue.push.apply(queue, closestMixinDeclarations(manager, element, dynamicDeclaration.name));
    } else {
      properties[property] = valuesToLazyConcat(manager, element, dynamicDeclaration.value, customPropertyRefs);
    }
  }

  let style = manager.getStyleFor(element);

  for (let property in properties) {
    style.setProperty(property, properties[property]());
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

// resolves how to produce a value and returns a function that will lazy
// return a string of the concatenated lazy values
function valuesToLazyConcat(manager, element, values, customPropertyRefs) {
  var lazyArray = valuesToLazyArray(manager, element, values, customPropertyRefs);
  return function () {
    return lazyArray().join('');
  };
}

// resolves how to produce a value and returns a function that will lazy
// create an array of those values
function valuesToLazyArray(manager, element, values, customPropertyRefs) {
  let lazyValues = new Array(values.length);
  for (let i=0; i<values.length; i++) {
    lazyValues[i] = toLazyValue(manager, element, values[i], customPropertyRefs);
  }
  return function () {
    return lazyValues.map(function (lazyValue) {
      return lazyValue();
    });
  };
}

function toLazyValue(manager, element, value, customPropertyRefs) {
  if (typeof value === 'string') {
    return () => value; // allow strings not to be wrapped?
  } else if (value.type === 'Function') {
    if (value.name === 'var') {
      let customProperty = value.args[0];
      let lazyValue = closestCustomPropertyValue(manager, element, customProperty, customPropertyRefs);
      if (value.args.length > 1) {
        let lazyDefault = toLazyValue(manager, element, value.args[3], customPropertyRefs);
        return () => {
          return lazyValue() || lazyDefault();
        };
      }
      return lazyValue;
    }
    return toLazyFunction(manager, element, value, customPropertyRefs);
  }

  throw new Error("Unknown runtime value");
}

const FUNCTIONS = {
  darken(value) {
    return `dark${value}`;
  }
};

function toLazyFunction(manager, element, node, customPropertyRefs) {
  let args = valuesToLazyArray(manager, element, node.args, customPropertyRefs);
  let fn = FUNCTIONS[node.name];
  if (fn) {
    return () => fn(...args());
  }

  // Fallback to browser implementation
  return () => `${node.name}(${args().join('')})`;
}

const INLINE_STYLE_VALUE_REGEXP = /^\s*:\s*([^\s;]+)/;

function closestCustomPropertyValue(manager, element, customProperty, customPropertyRefs) {
  let customPropertyRef = customPropertyRefs[customProperty];
  if (!customPropertyRef) {
    customPropertyRefs[customProperty] = customPropertyRef = { value: undefined };

    let selectors = manager.selectorsForCustomProperty[customProperty];
    if (selectors) {
      let ancestor = element;

      search:
      while (ancestor) {
        // Check in this ancestor's inline styles.
        let style = ancestor.getAttribute('style');
        if (style) {
          let index = style.indexOf(customProperty);
          if (index !== -1) {
            let styleTail = style.slice(index + customProperty.length);
            let staticVal = INLINE_STYLE_VALUE_REGEXP.exec(styleTail)[1];
            customPropertyRef.value = () => staticVal;
            break search;
          }
        }

        // Check if this ancestor matches any preprocessed rule selectors.
        for (let selector in selectors) {
          if (matches(ancestor, selector)) {
            let declaration = findDeclaration(manager.meta[selector], customProperty);
            customPropertyRef.value = valuesToLazyConcat(manager, ancestor, declaration.value, customPropertyRefs);
            break search;
          }
        }

        ancestor = ancestor.parentElement;
      }

      if (customPropertyRef.value === undefined) {
        let declaration = findDeclaration(manager.meta[':root'], customProperty);
        if (declaration) {
         customPropertyRef.value = valuesToLazyConcat(manager, ancestor, declaration.value, customPropertyRefs);
        }
      }
    }
  }

  return () => {
    // allows custom property to be set after we create a value for it
    var lazyValue = customPropertyRef.value;
    return lazyValue && lazyValue();
  };
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
