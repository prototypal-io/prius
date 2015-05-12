import { updateDescendants } from "vcssom";

const RED = `rgb(255, 0, 0)`;
const GREEN = `rgb(0, 255, 0)`;
const BLACK = `rgb(0, 0, 0)`;

QUnit.module("VCSSOM");

QUnit.test("Basic variable usage with :root", (assert) => {
  injectStyles(`
    :root {
      --main-color: ${RED};
    }

    span {
      background-color: ${BLACK};
      color: var(--main-color);
    }
  `);

  let meta = {
    dynamicSelectors: [{
      selector: "span",
      dynamicDeclarations: [{
        property: "color",
        expression: "--main-color"
      }]
    }],

    customProperties: {
      ":root": {
        "--main-color": RED
      }
    },

    selectorsForCustomProperty: {
      "--main-color": [":root"]
    }
  }

  injectContent(`
    <span id="subject">Hello</span>
  `);

  updateDescendants(meta, getFixture());

  equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });
});

QUnit.test("Basic variable usage with a class", (assert) => {
  injectStyles(`
    .foo {
      --main-color: ${RED};
    }

    span {
      background-color: ${BLACK};
      color: var(--main-color);
    }
  `);

  let meta = {
    dynamicSelectors: [{
      selector: "span",
      dynamicDeclarations: [{
        property: "color",
        expression: "--main-color"
      }]
    }],

    customProperties: {
      ":root": {},
      ".foo": {
        "--main-color": RED
      }
    },

    selectorsForCustomProperty: {
      "--main-color": [".foo"]
    }
  }

  injectContent(`
    <span id="subject" class="foo">Hello</span>
  `);

  updateDescendants(meta, getFixture());

  equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });
});


QUnit.test("Basic shadowing", (assert) => {
  injectStyles(`
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
  `);

  let meta = {
    dynamicSelectors: [{
      selector: "span",
      dynamicDeclarations: [{
        property: "color",
        expression: "--main-color"
      }]
    }],

    customProperties: {
      ":root": {
        "--main-color": RED
      },
      ".foo": {
        "--main-color": GREEN
      }
    },

    selectorsForCustomProperty: {
      "--main-color": [":root", ".foo"]
    }
  }

  injectContent(`
    <span id="subject-1">Hello</span>
    <span id="subject-2" class="foo">Hello</span>
  `);

  updateDescendants(meta, getFixture());

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
