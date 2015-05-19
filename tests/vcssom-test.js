import Ember from 'ember';
import QUnit, { module, test } from 'qunit';
import startApp from './helpers/start-app';

var application, container, vcssom;
var appElement;

injectEqualStyleAssertion();

function setContent(html) {
  appElement.innerHTML = html;
}

module('vcssom', {
  beforeEach(assert) {
    application = startApp();
    container = application.__container__;
    vcssom = container.lookup('service:vcssom');

    appElement = document.querySelector(application.rootElement);
    appElement.className = Ember.String.dasherize(assert.test.testName);
  },

  afterEach() {
    appElement.className = "";
    Ember.run(application, 'destroy');
  }
});

const RED = `rgb(255, 0, 0)`;
const GREEN = `rgb(0, 255, 0)`;
const BLACK = `rgb(0, 0, 0)`;

test('basic styling', function(assert) {
  setContent(`<span id="subject" class="item">Hello</span>`);
  vcssom.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });
});

test('default value', function(assert) {
  setContent(`<span id="subject" class="item">Hello</span>`);
  vcssom.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": GREEN
  });
});

test('complex shadowing', function(assert) {
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

  vcssom.forceUpdate();

  assert.equalStyle(getSubject(1), { "font-size": '40px' });
  assert.equalStyle(getSubject(2), { "font-size": '40px' });
  assert.equalStyle(getSubject(3), { "font-size": '40px' });
  assert.equalStyle(getSubject(4), { "font-size": '45px' });
  assert.equalStyle(getSubject(5), { "font-size": '40px' });
});

test('rule merging', function(assert) {
  setContent(`
    <span id="subject" class="item"></span>
  `);

  vcssom.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": RED,
    "color": GREEN
  });
});

test('class attribute mutation updates children', function(assert) {
  setContent(`
    <span id="subject-1" class="foo">
      <span id="subject-2" class="item"></span>
    </span>
  `);

  vcssom.forceUpdate();

  assert.equalStyle(getSubject(2), { "color": RED });

  getSubject(1).className = "bar";
  vcssom.forceUpdate();

  assert.equalStyle(getSubject(2), { "color": GREEN });
});

test('class attribute replaced', function(assert) {
  setContent(`<span id="subject" class="foo"></span>`);
  vcssom.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });

  // Completely replace the class (removing the vcssom id class)
  getSubject().className = "bar";
  vcssom.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": GREEN,
    "color": BLACK
  });

  // Swap the class (leaving the vcssom id class in place)
  getSubject().className = getSubject().className.replace("bar", "foo");
  vcssom.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });
});

function getSubject(id) {
  return document.getElementById(id ? `subject-${id}` : 'subject');
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
