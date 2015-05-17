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
