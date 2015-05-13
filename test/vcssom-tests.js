import VCSSOM, { buildMeta } from "vcssom";

const RED = `rgb(255, 0, 0)`;
const GREEN = `rgb(0, 255, 0)`;
const BLACK = `rgb(0, 0, 0)`;

let vcssom;

QUnit.module("VCSSOM", {
  afterEach() {
    if (vcssom) {
      vcssom.disconnect();
    }
  }
});

QUnit.test("Basic variable usage with :root", assert => {
  let css = `
    :root {
      --main-color: ${RED};
    }

    span {
      background-color: ${BLACK};
      color: var(--main-color);
    }
  `;

  let html = `<span id="subject">Hello</span>`;

  injectStyles(css);

  vcssom = new VCSSOM(buildMeta(css));
  vcssom.observe(getFixture());

  injectContent(html);

  vcssom.forceUpdate();

  equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });
});

QUnit.test("Basic variable usage with a class", assert => {
  let css = `
    .foo {
      --main-color: ${RED};
    }

    span {
      background-color: ${BLACK};
      color: var(--main-color);
    }
  `;

  let html = `<span id="subject" class="foo">Hello</span>`;

  injectStyles(css);

  vcssom = new VCSSOM(buildMeta(css));
  vcssom.observe(getFixture());

  injectContent(html);

  vcssom.forceUpdate();

  equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });
});

QUnit.test("Basic shadowing", assert => {
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

  let html = `
    <span id="subject-1">Hello</span>
    <span id="subject-2" class="foo">Hello</span>
  `;

  injectStyles(css);

  vcssom = new VCSSOM(buildMeta(css));
  vcssom.observe(getFixture());

  injectContent(html);

  vcssom.forceUpdate();

  equalStyle(getSubject(1), {
    "background-color": BLACK,
    "color": RED
  });

  equalStyle(getSubject(2), {
    "background-color": BLACK,
    "color": GREEN
  });
});

QUnit.test("Attribute mutation", assert => {
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

  let html = `
    <span id="subject-1">Hello</span>
    <span id="subject-2">Hello</span>
  `;

  injectStyles(css);

  vcssom = new VCSSOM(buildMeta(css));
  vcssom.observe(getFixture());

  injectContent(html);

  vcssom.forceUpdate();

  getSubject(2).className = "foo";

  vcssom.forceUpdate();

  equalStyle(getSubject(1), {
    "background-color": BLACK,
    "color": RED
  });

  equalStyle(getSubject(2), {
    "background-color": BLACK,
    "color": GREEN
  });
});

QUnit.test("Attribute mutation updates children", assert => {
  let css = `
    :root {
      --main-color: ${RED};
    }

    .foo {
      --main-color: ${GREEN};
    }

    .bar {
      color: var(--main-color);
    }
  `;

  let html = `
    <span id="subject-1">Hello</span>
    <span id="subject-2">
      <span id="subject-3" class="bar">Hello</span>
    </span>
  `;

  injectStyles(css);

  vcssom = new VCSSOM(buildMeta(css));
  vcssom.observe(getFixture());

  injectContent(html);

  vcssom.forceUpdate();

  equalStyle(getSubject(3), {
    "color": RED
  });

  getSubject(2).className = "foo";

  vcssom.forceUpdate();

  equalStyle(getSubject(3), {
    "color": GREEN
  });
});

QUnit.test("Complex expressions with multiple var expressions", assert => {
  let css = `
    :root {
      --x1: 40px;
    }

    .foo1 {
      --x2: 13px;
    }

    .foo2 {
      --x2: 22px;
    }

    .bar {
      font-size: calc(var(--x1) - var(--x2));
    }
  `;

  let html = `
    <span class="foo1" id="subject-1">
      <span class="bar" id="subject-2">Hello</span>
    </span>
  `;

  injectStyles(css);

  vcssom = new VCSSOM(buildMeta(css));
  vcssom.observe(getFixture());

  injectContent(html);

  vcssom.forceUpdate();

  equalStyle(getSubject(2), {
    "font-size": "27px"
  });

  getSubject(1).className = "foo2";

  vcssom.forceUpdate();

  equalStyle(getSubject(2), {
    "font-size": "18px"
  });
});

QUnit.test("Chained var expressions", assert => {
  let css = `
    :root {
      --x: 40px;
    }

    .foo {
      --y: calc(var(--x) / 2);
    }

    .bar {
      font-size: var(--y);
    }
  `;

  let html = `
    <span class="foo">
      <span class="bar" id="subject">Hello</span>
    </span>
  `;

  injectStyles(css);

  vcssom = new VCSSOM(buildMeta(css));
  vcssom.observe(getFixture());

  injectContent(html);

  vcssom.forceUpdate();

  equalStyle(getSubject(), {
    "font-size": "20px"
  });
});

QUnit.test("Chained var expressions with shadowing", assert => {
  let css = `
    :root {
      --x: 40px;
    }

    .foo {
      --y: calc(var(--x) / 2);
    }

    .bar {
      --x: 60px;
      font-size: var(--y);
    }
  `;

  let html = `
    <span class="foo">
      <span class="bar" id="subject">Hello</span>
    </span>
  `;

  injectStyles(css);

  vcssom = new VCSSOM(buildMeta(css));
  vcssom.observe(getFixture());

  injectContent(html);

  vcssom.forceUpdate();

  equalStyle(getSubject(), {
    "font-size": "30px"
  });
});

QUnit.test("Cycles throw an error instead of endlessly looping", assert => {
  let css = `
    :root {
      --x: var(--y);
    }

    .foo {
      --y: var(--x);
    }

    .bar {
      font-size: var(--y);
    }
  `;

  let html = `<span class="foo bar" id="subject">Hello</span>`;

  injectStyles(css);

  vcssom = new VCSSOM(buildMeta(css));
  vcssom.observe(getFixture());

  injectContent(html);

  assert.throws(() => {
    vcssom.forceUpdate();
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
