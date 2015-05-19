import StyleSheetManager from './style-sheet-manager';
import { updateTree } from './dom';

const mutationObserverOptions = {
  attributes: true,
  childList: true,
  subtree: true
};

export default class VCSSOM {
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
}

function processMutationRecords(vcssom, records) {
  records.forEach(record => {
    if (record.type === 'childList') {
      let addedNodes = record.addedNodes;
      for (let i = 0; i < addedNodes.length; i++) {
        vcssom.updateTree(addedNodes[i]);
      }
    } else if (record.attributeName === 'class') {
      vcssom.updateTree(record.target);
    }
  });
}
