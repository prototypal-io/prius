import QUnit, { module, test } from 'qunit';
import Prius from 'prius';
import { generateMeta } from 'prius/meta';

injectEqualStyleAssertion();

const RED = `rgb(255, 0, 0)`;
const GREEN = `rgb(0, 255, 0)`;
const BLACK = `rgb(0, 0, 0)`;

let prius;

module('Prius (runtime)', {
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
  initPrius(`
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
  initPrius(`
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
  initPrius(`
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
  initPrius(`
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
  initPrius(`
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
  initPrius(`
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
  initPrius(`
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
  initPrius(`
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

test('inline styles can contain custom property declarations', function(assert) {
  initPrius(`
    :root {
      --size: 40px;
    }
    .foo {
      font-size: var(--size);
    }
  `);

  setContent(`
    <span id="subject" class="foo" style="--size: 50px;"></span>
  `);
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "font-size": "50px"
  });

  getSubject().setAttribute("style", "--size: 45px;");
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "font-size": "45px"
  });
});

test('inline styles with custom property declarations inherit correctly', function(assert) {
  initPrius(`
    :root {
      --size: 40px;
    }
    .foo {
      font-size: var(--size);
    }
  `);

  setContent(`
    <div id="subject-1" style="--size: 50px;">
      <span id="subject-2" class="foo"></span>
    </div>
  `);
  prius.forceUpdate();

  assert.equalStyle(getSubject(2), {
    "font-size": "50px"
  });

  getSubject(1).setAttribute("style", "--size: 45px;");
  prius.forceUpdate();

  assert.equalStyle(getSubject(2), {
    "font-size": "45px"
  });
});

test('basic custom functions work', function(assert) {
  prius = new Prius();
  prius.registerFunction('darken', function (values) {
    return `dark${values[0]}`;
  });

  initPrius(`
    :root {
      --color: blue;
    }
    .foo {
      color: darken(var(--color));
    }
  `, prius);


  setContent(`
    <span id="subject" class="foo"></span>
  `);
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "color": "rgb(0, 0, 139)"
  });

  getSubject().setAttribute("style", "--color: red;");
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "color": "rgb(139, 0, 0)"
  });
});

test('custom functions work with multiple arguments', function(assert) {
  prius = new Prius();
  prius.registerFunction('multiplySumByGoldenRatio', function(values) {
    let sum = values.reduce(function(pv, v) {
      return parseInt(pv) + parseInt(v);
    });
    let goldenNumber = sum * 1.618;
    return goldenNumber;
  });

  initPrius(`
    :root {
      --luckyNumber: 7;
    }
    .foo {
      width: multiplySumByGoldenRatio(3, var(--luckyNumber))px;
    }
  `, prius);

  setContent(`
    <div id="subject" class="foo"></div>
  `);
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "width": "16.171875px"
  });

  getSubject().setAttribute("style", "--luckyNumber: 42;");
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "width": "72.796875px"
  });
});
/*
test('mixins work correctly', function (assert) {
  initPrius({
    meta: {
      ':root': [{
        type: 'Block',
        name: '--my-mixin',
        value: [{
          type: 'Declaration',
          name: 'color',
          value: ['blue']
        }]
      }],
      '.foo': [{
        type: 'Declaration',
        name: 'font-weight',
        value: ['bold']
      },
      {
        type: 'ApplyRule',
        name: '--my-mixin'
      }]
    }
  });

  setContent(`
    <span id="subject" class="foo"></span>
  `);
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "color": "rgb(0, 0, 255)",
    "font-weight": "bold"
  });
});

test('mixins that define custom property works correctly', function (assert) {
  initPrius({
    meta: {
      ':root': [{
        type: 'Block',
        name: '--my-mixin',
        value: [{
          type: 'Declaration',
          name: '--color',
          value: ['blue']
        }]
      }],
      '.foo': [{
        type: 'ApplyRule',
        name: '--my-mixin'
      }, {
        type: 'Declaration',
        name: 'color',
        value: [{
          type: 'Function',
          name: 'var',
          args: ['--color']
        }]
      }]
    }
  });

  setContent(`
    <span id="subject" class="foo"></span>
  `);
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "color": "rgb(0, 0, 255)"
  });
});

test('mixins that consume a custom property works correctly', function (assert) {
  initPrius({
    meta: {
      ':root': [{
        type: 'Block',
        name: '--my-mixin',
        value: [{
          type: 'Declaration',
          name: 'color',
          value: [{
            type: 'Function',
            name: 'var',
            args: ['--color']
          }]
        }]
      }],
      '.foo': [{
        type: 'Declaration',
        name: '--color',
        value: ['blue']
      }, {
        type: 'ApplyRule',
        name: '--my-mixin'
      }]
    }
  });

  setContent(`
    <span id="subject" class="foo"></span>
  `);
  prius.forceUpdate();

  assert.equalStyle(getSubject(), {
    "color": "rgb(0, 0, 255)"
  });
});
*/
test('[regression] custom properties do not clobber subsequent properties', function(assert) {
  var meta = generateMeta(`
    .item {
      --foo: 23px;
      bar: 29px;
    }
  `);

  assert.ok(!('bar' in meta['.item']));
});

function getSubject(id) {
  return document.getElementById(id ? `subject-${id}` : 'subject');
}

function setContent(html) {
  let content = document.getElementById('prius-test-content');
  content.innerHTML = html;
}

function initPrius(css, modifiedPrius) {
  let fixture = document.getElementById('qunit-fixture');

  let style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  fixture.appendChild(style);

  prius = modifiedPrius || new Prius();
  prius.parse(css);
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
