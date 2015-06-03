import QUnit, { module, test } from 'qunit';
import Prius from 'prius';
import m from 'prius-precompile-meta';

injectEqualStyleAssertion();

const RED = `rgb(255, 0, 0)`;
const GREEN = `rgb(0, 255, 0)`;
const BLACK = `rgb(0, 0, 0)`;

let prius;

module('prius', {
  beforeEach() {
    let content = document.createElement('div');
    content.id = "prius-test-content";

    let fixture = document.getElementById('qunit-fixture');
    fixture.appendChild(content);
  },
  afterEach() {
    if (prius) {
      prius.disconnect();
    }
  }
});

test('basic styling', function(assert) {
  initPrius(m`
    :root {
      --main-color: rgb(255, 0, 0);
    }

    .item {
      background-color: rgb(0, 0, 0);
      color: var(--main-color);
    }
  `);

  setContent(`<span id="subject" class="item">Hello</span>`);
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });
});

test('default value', function(assert) {
  initPrius(m`
    .item {
      background-color: rgb(0, 0, 0);
      color: var(--secondary-color, rgb(0, 255, 0));
    }
  `);

  setContent(`<span id="subject" class="item">Hello</span>`);
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": GREEN
  });
});

test('complex shadowing', function(assert) {
  initPrius(m`
    .one {
      --foo: 40px;
    }
    .two {
      --bar: var(--foo);
    }
    .three {
      --foo: calc(var(--bar) + 5px);
    }
    .foo {
      font-size: var(--foo);
    }
    .bar {
      font-size: var(--bar);
    }
  `);

  setContent(`
    <span class="one">
      <span class="foo" id="subject-1"></span>
      <span class="two">
        <span class="foo" id="subject-2"></span>
        <span class="bar" id="subject-3"></span>
        <span class="three">
          <span class="foo" id="subject-4"></span>
          <span class="bar" id="subject-5"></span>
        </span>
      </span>
    </span>
  `);
  prius.forceUpdate();

  assert.equalStyle(getSubject(1), { "font-size": '40px' });
  assert.equalStyle(getSubject(2), { "font-size": '40px' });
  assert.equalStyle(getSubject(3), { "font-size": '40px' });
  assert.equalStyle(getSubject(4), { "font-size": '45px' });
  assert.equalStyle(getSubject(5), { "font-size": '40px' });
});

test('rule merging', function(assert) {
  initPrius(m`
    :root {
      --foo: rgb(255, 0, 0);
    }
    :root {
      --bar: rgb(0, 255, 0);
    }
    .item {
      background-color: var(--foo);
      color: var(--bar);
    }
  `);

  setContent(`
    <span id="subject" class="item"></span>
  `);
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": RED,
    "color": GREEN
  });
});

test('class attribute mutation updates children', function(assert) {
  initPrius(m`
    .foo {
      --color: rgb(255, 0, 0);
    }
    .bar {
      --color: rgb(0, 255, 0);
    }
    .item {
      color: var(--color);
    }
  `);

  setContent(`
    <span id="subject-1" class="foo">
      <span id="subject-2" class="item"></span>
    </span>
  `);
  prius.forceUpdate();

  assert.equalStyle(getSubject(2), { "color": RED });

  getSubject(1).className = "bar";
  prius.forceUpdate();

  assert.equalStyle(getSubject(2), { "color": GREEN });
});

test('class attribute replaced', function(assert) {
  initPrius(m`
    :root {
      --foo: rgb(255, 0, 0);
      --bar: rgb(0, 255, 0);
    }
    .foo {
      color: var(--foo);
      background-color: rgb(0, 0, 0);
    }
    .bar {
      background-color: var(--bar);
    }
  `);

  setContent(`<span id="subject" class="foo"></span>`);
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });

  // Completely replace the class (removing the prius id class)
  getSubject().className = "bar";
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": GREEN,
    "color": BLACK
  });

  // Swap the class (leaving the prius id class in place)
  getSubject().className = getSubject().className.replace("bar", "foo");
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });
});

test('multiple classes', function(assert) {
  initPrius(m`
    :root {
      --background-color: rgb(0, 255, 0);
      --color: rgb(255, 0, 0);
    }
    .foo {
      background-color: var(--background-color);
    }
    .bar {
      color: var(--color);
    }
  `);

  setContent(`<span class="foo bar" id="subject"></span>`);
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": GREEN,
    "color": RED
  });

  getSubject().className = "foo";
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": GREEN,
    "color": BLACK
  });

  getSubject().className = "bar foo";
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": GREEN,
    "color": RED
  });
});

test('removing an element clears its rule', function(assert) {
  initPrius(m`
    :root {
      --size: 40px;
    }
    .foo {
      font-size: var(--size);
    }
  `);

  setContent(`
    <span class="foo" id="subject">
      <span class="foo"></span>
    </span>
  `);
  prius.forceUpdate();

  assert.equal(prius.styleSheetManager.sheet.cssRules.length, 2);

  getSubject().parentNode.removeChild(getSubject());
  prius.forceUpdate();

  assert.equal(prius.styleSheetManager.sheet.cssRules.length, 0);
});

test('[regression] custom properties do not clobber subsequent properties', function(assert) {
  var meta = m`
    .item {
      --foo: 23px;
      bar: 29px;
    }
  `.meta;

  assert.ok(!('bar' in meta.dynamicSelectors['.item']));
});

function getSubject(id) {
  return document.getElementById(id ? `subject-${id}` : 'subject');
}

function setContent(html) {
  let content = document.getElementById('prius-test-content');
  content.innerHTML = html;
}

function initPrius(meta) {
  let fixture = document.getElementById('qunit-fixture');

  let style = document.createElement('style');
  style.appendChild(document.createTextNode(meta.css));
  fixture.appendChild(style);

  prius = new Prius(meta.meta);
  prius.observe(fixture);
}

function injectEqualStyleAssertion() {
  QUnit.assert.equalStyle = function(element, expectedStyle, message) {
    let computedStyle = window.getComputedStyle(element);

    let actualStyle = {};
    for (let property in expectedStyle) {
      actualStyle[property] = computedStyle[property];
    }

    this.deepEqual(actualStyle, expectedStyle, message);
  };
}
