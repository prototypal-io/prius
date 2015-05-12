import { updateDescendants, buildMeta } from "vcssom";

const RED = `rgb(255, 0, 0)`;
const GREEN = `rgb(0, 255, 0)`;
const BLACK = `rgb(0, 0, 0)`;

QUnit.module("VCSSOM");

QUnit.test("Basic variable usage with :root", (assert) => {
  let css = `
    :root {
      --main-color: ${RED};
    }

    span {
      background-color: ${BLACK};
      color: var(--main-color);
    }
  `;

  injectStyles(css);

  injectContent(`
    <span id="subject">Hello</span>
  `);

  updateDescendants(buildMeta(css), getFixture());

  equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });
});

QUnit.test("Basic variable usage with a class", (assert) => {
  let css = `
    .foo {
      --main-color: ${RED};
    }

    span {
      background-color: ${BLACK};
      color: var(--main-color);
    }
  `;

  injectStyles(css);

  injectContent(`
    <span id="subject" class="foo">Hello</span>
  `);

  updateDescendants(buildMeta(css), getFixture());

  equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });
});


QUnit.test("Basic shadowing", (assert) => {
  let css = `
    :root {
      --main-color: ${RED};
    }

    .foo {
      --main-color: ${GREEN};
    }

    span {
      background-color: ${BLACK};
      color: var(--main-color);
    }
  `;

  injectStyles(css);

  injectContent(`
    <span id="subject-1">Hello</span>
    <span id="subject-2" class="foo">Hello</span>
  `);

  updateDescendants(buildMeta(css), getFixture());

  equalStyle(getSubject(1), {
    "background-color": BLACK,
    "color": RED
  });

  equalStyle(getSubject(2), {
    "background-color": BLACK,
    "color": GREEN
  });
});

function getFixture() {
  return document.getElementById('qunit-fixture');
}

function getSubject(id) {
  return document.getElementById(id ? `subject-${id}` : 'subject');
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
