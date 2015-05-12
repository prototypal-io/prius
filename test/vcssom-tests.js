QUnit.module("VCSSOM");

const RED = `rgb(255, 0, 0)`;
const BLACK = `rgb(0, 0, 0)`;

QUnit.test("Basic variable usage", (assert) => {
  injectStyles(`
    :root {
      --main-color: ${RED};
    }

    span {
      background-color: ${BLACK};
      color: var(--main-color);
    }
  `);

  injectContent(`
    <span id="subject">Hello</span>
  `);

  equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });
});

function getFixture() {
  return document.getElementById('qunit-fixture');
}

function getSubject() {
  return document.getElementById('subject');
}

function injectStyles(css) {
  let style = document.createElement('style');
  style.appendChild(document.createTextNode(css));

  getFixture().appendChild(style);
}

function injectContent(html) {
  let content = document.createElement('div');
  content.innerHTML = html;

  getFixture().appendChild(content);
}

function equalStyle(element, expectedStyle, message) {
  let computedStyle = window.getComputedStyle(element);

  let actualStyle = {};
  for (let property in expectedStyle) {
    actualStyle[property] = computedStyle[property];
  }

  QUnit.deepEqual(actualStyle, expectedStyle, message);
}
