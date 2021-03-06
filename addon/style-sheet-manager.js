export const idPrefix = "prius-id-";
export const metaSymbol = typeof window !== 'undefined' && window.Symbol ? Symbol('prius') : '__prius__';

var globalIdCounter = 0;

export default class StyleSheetManager {
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
