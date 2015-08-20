export function initialize(container) {
  const metaElement = document.querySelector("meta[name='prius']");

  if (metaElement && metaElement.content) {
    const meta = JSON.parse(decodeURI(metaElement.content));

    const prius = container.lookup('service:prius');
    prius.setup(meta);
  }
}

export default {
  name: 'prius',
  initialize: initialize
};
