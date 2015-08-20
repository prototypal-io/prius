import StyleSheetManager from './style-sheet-manager';
import { updateTree, removeTree } from './dom';
import { generateMeta } from './meta';

const mutationObserverOptions = {
  attributeFilter: ['class', 'style'],
  attributes: true,
  childList: true,
  subtree: true
};

export default class Prius {
  constructor() {
    this.customFunctions = {};
  }

  registerFunction(name, callback) {
    this.customFunctions[name] = callback;
  }

  generateMeta(css) {
    return generateMeta(css, this.customFunctions);
  }

  parse(css) {
    let meta = this.generateMeta(css);
    this.setup(meta);
  }

  setup(meta) {
    this.styleSheetManager = new StyleSheetManager(meta);
    this.mutationObserver = new window.MutationObserver(records => {
      processMutationRecords(this, records);
    });
  }

  observe(node=document) {
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
    updateTree(this.styleSheetManager, element, this.customFunctions);
  }

  removeTree(element) {
    removeTree(this.styleSheetManager, element);
  }

  addStyleElement(element) {
    let meta = this.generateMeta(element.innerText);
    this.styleSheetManager.mergeNewMeta(meta);
  }
}

function processMutationRecords(prius, records) {
  records.forEach(record => {
    if (record.type === 'childList') {
      let addedNodes = record.addedNodes;
      let removedNodes = record.removedNodes;

      for (let i = 0; i < addedNodes.length; i++) {
        if (addedNodes[i].tagName === 'STYLE') {
          prius.addStyleElement(addedNodes[i]);
        }

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
