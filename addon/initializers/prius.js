export function initialize(container, application) {
  const metaElement = document.querySelector("meta[name='prius']");

  if (metaElement && metaElement.content) {
    const meta = JSON.parse(decodeURI(metaElement.content));
    const appElement = document.querySelector(application.rootElement);

    const prius = container.lookup('service:prius');
    prius.setup(meta, appElement);
  }
}

export default {
  name: 'prius',
  initialize: initialize
};
