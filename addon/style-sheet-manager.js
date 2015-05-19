const VCSSOM_PREFIX = "vcssom-id-";

var counter = 0;

export default class StyleSheetManager {
  constructor(meta) {
    let styleElement = document.createElement('style');
    styleElement.title = "vcssom";

    this.meta = meta;
    this.styleElement = styleElement;
    this.sheet = null;
  }

  connect(node=document.head) {
    node.appendChild(this.styleElement);
    this.sheet = this.styleElement.sheet;
  }

  disconnect() {
    var rules = this.sheet.cssRules;
    for (var i = rules.length - 1; i >= 0; i--) {
      this.sheet.deleteRule(i);
    }
    this.sheet = null;

    let styleElement = this.styleElement;
    if (styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
  }

  getFreshRuleFor(element) {
    let rule = element.__vcssomRule__;
    if (rule) {
      clearRule(rule);
      ensureElementHasClass(element, rule);
      return rule;
    } else {
      return this.insertRuleFor(element);
    }
  }

  insertRuleFor(element) {
    counter++;

    let id = VCSSOM_PREFIX + counter;
    let index = this.sheet.insertRule(`.${id}{}`, 0);
    let rule = this.sheet.cssRules[index];

    element.className += ' ' + id;
    element.__vcssomRule__ = rule;

    return rule;
  }

  deleteRuleFor(element) {
    if (element.__vcssomRule__) {
      let selector = element.__vcssomRule__.selectorText;
      element.__vcssomRule__ = null;

      let index = findRuleIndex(this.sheet.cssRules, selector);
      if (index !== -1) {
        this.sheet.deleteRule(index);
      }
    }
  }
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
