const vcssomIdPrefix = "vcssom-id-";
// const vcssomIdRegExp = /\bvcssom-id-\S+/;

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
      return rule;
    } else {
      return this.insertRuleFor(element);
    }
  }

  insertRuleFor(element) {
    counter++;

    let id = vcssomIdPrefix + counter;
    let index = this.sheet.insertRule(`.${id}{}`);
    let rule = this.sheet.cssRules[index];

    element.className += ' ' + id;
    element.__vcssomRule__ = rule;

    return rule;
  }

  // deleteRuleFor(id) {
  //   let index = findRuleIndex(this.sheet, id);
  //   this.sheet.deleteRule(index);
  // }
}

function clearRule(rule) {
  let style = rule.style;

  for (let i = style.length - 1; i >= 0; i--) {
    style.removeProperty(style[i]);
  }
}

// function findRuleIndex(styleSheet, id) {
//   let rules = styleSheet.cssRules;
//   let selector = '.' + id;

//   for (let i = 0; i < rules.length; i++) {
//     if (rules[i].selectorText === selector) {
//       return i;
//     }
//   }
// }
