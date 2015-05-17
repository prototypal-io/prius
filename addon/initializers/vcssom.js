export function initialize(container, application) {
  const metaElement = document.querySelector("meta[name='vcssom']");

  if (metaElement && metaElement.content) {
    const meta = JSON.parse(decodeURI(metaElement.content));
    const appElement = document.querySelector(application.rootElement);

    const vcssom = container.lookup('service:vcssom');
    vcssom.setup(meta, appElement);
  }
}

export default {
  name: 'vcssom',
  initialize: initialize
};
