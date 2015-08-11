define("prius/index", 
  ["prius/style-sheet-manager","prius/dom","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var StyleSheetManager = __dependency1__["default"];
    var updateTree = __dependency2__.updateTree;
    var removeTree = __dependency2__.removeTree;

    const mutationObserverOptions = {
      attributeFilter: ['class', 'style'],
      attributes: true,
      childList: true,
      subtree: true
    };

    __exports__["default"] = class Prius {
      constructor(meta) {
        this.styleSheetManager = new StyleSheetManager(meta);
        this.mutationObserver = new window.MutationObserver(records => {
          processMutationRecords(this, records);
        });
      }

      observe(node=document.body) {
        this.styleSheetManager.connect();
        this.mutationObserver.observe(node, mutationObserverOptions);
      }

      disconnect() {
        this.mutationObserver.disconnect();
        this.styleSheetManager.disconnect();
      }

      forceUpdate() {
        let records = this.mutationObserver.takeRecords();
        processMutationRecords(this, records);
      }

      updateTree(element) {
        updateTree(this.styleSheetManager, element);
      }

      removeTree(element) {
        removeTree(this.styleSheetManager, element);
      }
    }

    function processMutationRecords(prius, records) {
      records.forEach(record => {
        if (record.type === 'childList') {
          let addedNodes = record.addedNodes;
          let removedNodes = record.removedNodes;

          for (let i = 0; i < addedNodes.length; i++) {
            prius.updateTree(addedNodes[i]);
          }

          for (let i = 0; i < removedNodes.length; i++) {
            prius.removeTree(removedNodes[i]);
          }
        } else {
          prius.updateTree(record.target);
        }
      });
    }
  });
;define("prius/style-sheet-manager", 
  ["exports"],
  function(__exports__) {
    "use strict";
    const idPrefix = "prius-id-";
    __exports__.idPrefix = idPrefix;const metaSymbol = window.Symbol ? Symbol('prius') : '__prius__';
    __exports__.metaSymbol = metaSymbol;
    var globalIdCounter = 0;

    __exports__["default"] = class StyleSheetManager {
      constructor(meta) {
        let styleElement = document.createElement('style');
        styleElement.title = "prius";

        this.styleElement = styleElement;
        this.sheet = null;

        this.version = 0;
        this.meta = null;
        this.selectorsForCustomProperty = null;

        this.setMeta(meta);
      }

      setMeta(meta) {
        this.meta = meta;
        this.selectorsForCustomProperty = getSelectorsByCustomProperty(meta);
        this.selectorsForMixins = getSelectorsByMixin(meta);
      }

      connect(node=document.head) {
        node.appendChild(this.styleElement);
        this.sheet = this.styleElement.sheet;
      }

      disconnect() {
        if (this.sheet) {
          var rules = this.sheet.cssRules;
          for (var i = rules.length - 1; i >= 0; i--) {
            this.sheet.deleteRule(i);
          }
          this.sheet = null;
        }

        let styleElement = this.styleElement;
        if (styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      }

      incrementVersion() {
        this.version++;
      }

      getStyleFor(element) {
        let meta = element[metaSymbol];
        if (meta) {
          if (meta.version < this.version) {
            clearRule(meta.rule);
            ensureElementHasClass(element, meta.rule);
            meta.version = this.version;
          }

          return meta.rule.style;
        } else {
          return insertRuleFor(this, element).style;
        }
      }

      deleteRuleFor(element) {
        if (element[metaSymbol]) {
          let selector = element[metaSymbol].rule.selectorText;
          element[metaSymbol] = null;

          let index = findRuleIndex(this.sheet.cssRules, selector);
          if (index !== -1) {
            this.sheet.deleteRule(index);
          }
        }
      }
    }

    function getSelectorsByCustomProperty(meta) {
      let customProps = {};

      for (let selector in meta) {
        let declarations = meta[selector];
        for (let i=0; i<declarations.length; i++) {
          let declaration = declarations[i];
          if (declaration.type !== 'Declaration') {
            continue;
          }
          let name = declaration.name;
          if (name[0] === '-' && name[1] === '-') {
            if (!customProps[name]) { customProps[name] = {}; }
            customProps[name][selector] = true;
          }
        }
      }

      return customProps;
    }

    function getSelectorsByMixin(meta) {
      let mixins = {};
      for (let selector in meta) {
        let declarations = meta[selector];
        for (let i=0; i<declarations.length; i++) {
          let declaration = declarations[i];
          if (declaration.type !== 'Block') {
            continue;
          }
          let name = declaration.name;
          if (!mixins[name]) {
            mixins[name] = {};
          }
          mixins[name][selector] = true;
        }
      }
      return mixins;
    }

    function clearRule(rule) {
      let style = rule.style;

      for (let i = style.length - 1; i >= 0; i--) {
        style.removeProperty(style[i]);
      }
    }

    function ensureElementHasClass(element, rule) {
      let id = rule.selectorText.slice(1);

      if (element.className.indexOf(id) === -1) {
        element.className += ' ' + id;
      }
    }

    function findRuleIndex(rules, selector) {
      for (let i = 0; i < rules.length; i++) {
        if (rules[i].selectorText === selector) {
          return i;
        }
      }

      return -1;
    }

    function insertRuleFor(manager, element) {
      globalIdCounter++;

      let id = idPrefix + globalIdCounter;
      let index = manager.sheet.insertRule(`.${id}{}`, 0);
      let rule = manager.sheet.cssRules[index];
      let version = manager.version;

      element.className += ' ' + id;
      element[metaSymbol] = new Meta(rule, version);

      return rule;
    }

    class Meta {
      constructor(rule, version) {
        this.rule = rule;
        this.version = version;
      }
    }
  });
;define("prius/dom", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function updateTree(manager, element) {
      if (element.nodeType !== 1) {
        return;
      }

      manager.incrementVersion();
      updateNode(manager, element);
      updateDescendants(manager, element);
    }

    __exports__.updateTree = updateTree;
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
      },

      darken(manager, element, values) {
        return `dark${values[0]}`;
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

    function removeTree(manager, element) {
      if (element.nodeType !== 1) {
        return;
      }

      manager.deleteRuleFor(element);

      let childNodes = element.childNodes;

      for (let i = 0; i < childNodes.length; i++) {
        removeTree(manager, childNodes[i]);
      }
    }

    __exports__.removeTree = removeTree;
    function matches(element, selector) {
      return element.matches(selector);
    }

    function querySelectorAll(element, selector) {
      return element.querySelectorAll(selector);
    }
  });