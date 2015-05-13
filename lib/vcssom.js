import { updateTree, updateNode, updateDescendants } from './vcssom/dom';
import { buildMeta } from './vcssom/meta';

export {
  updateTree,
  updateNode,
  updateDescendants,
  buildMeta
};

export default class VCSSOM {
  constructor(meta) {
    this.meta = meta;

    this.mutationObserver = new MutationObserver(records => {
      this.update(records);
    });
  }

  observe(node) {
    this.mutationObserver.observe(node, {
      attributes: true,
      childList: true,
      subtree: true
    });
  }

  disconnect() {
    this.mutationObserver.disconnect();
  }

  forceUpdate() {
    this.update(this.mutationObserver.takeRecords());
  }

  update(records) {
    for (let i = 0; i < records.length; i++) {
      let record = records[i];
      if (record.type === 'childList') {
        let addedNodes = record.addedNodes;
        for (let i = 0; i < addedNodes.length; i++) {
          updateTree(this.meta, addedNodes[i]);
        }
      } else if (record.attributeName === 'class') {
        updateTree(this.meta, record.target);
      }
    }
  }
}
