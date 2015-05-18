import Ember from 'ember';
import QUnit, { module, test } from 'qunit';
import startApp from './helpers/start-app';

var application, container, vcssom;

injectEqualStyleAssertion();

function setContent(html) {
  var appElement = document.querySelector(application.rootElement);
  appElement.innerHTML = html;
}

module('vcssom', {
  beforeEach() {
    application = startApp();
    container = application.__container__;
    vcssom = container.lookup('service:vcssom');
  },

  afterEach() {
    Ember.run(application, 'destroy');
  }
});

const RED = `rgb(255, 0, 0)`;
const GREEN = `rgb(0, 255, 0)`;
const BLACK = `rgb(0, 0, 0)`;

test('basic test', function(assert) {
  setContent(`<span id="subject" class="basic-test">Hello</span>`);
  vcssom.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": RED
  });
});

test('default value', function(assert) {
  setContent(`<span id="subject" class="default-value-test">Hello</span>`);
  vcssom.forceUpdate();

  assert.equalStyle(getSubject(), {
    "background-color": BLACK,
    "color": GREEN
  });
});

test('complex shadowing', function(assert) {
  setContent(`
    <span class="complex-shadowing-test-one">
      <span id="subject-1" class="complex-shadowing-test-foo"></span>
      <span class="complex-shadowing-test-two">
        <span id="subject-2" class="complex-shadowing-test-foo"></span>
        <span id="subject-3" class="complex-shadowing-test-bar"></span>
        <span class="complex-shadowing-test-three">
          <span id="subject-4" class="complex-shadowing-test-foo"></span>
          <span id="subject-5" class="complex-shadowing-test-bar"></span>
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
