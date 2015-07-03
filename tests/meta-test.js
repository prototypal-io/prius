import { module, test } from 'qunit';
import Prius from 'prius';
import m from 'prius-precompile-meta';

module("Prius (meta)");

test("A custom property", function(assert) {
  let { meta } = m`.foo { --bar: baz; }`;
  assert.deepEqual(meta, {
    ':root': {},
    '.foo': {
      '--bar': ['baz']
    }
  });
});

test("A var", function(assert) {
  let { meta } = m`.foo { bar: var(--baz); }`;

  assert.deepEqual(meta, {
    ':root': {},
    '.foo': {
      'bar': [{
        type: 'Function',
        name: 'var',
        args: ['--baz']
      }]
    }
  });
});

test("A function with variable argument", function(assert) {
  let { meta } = m`.foo { color: darken(var(--color)) }`;

  assert.deepEqual(meta, {
    ':root': {},
    '.foo': {
      'color': [{
        'type': 'Function',
        'name': 'darken',
        'args': [{
          type: 'Function',
          name: 'var',
          args: ['--color']
        }]
      }]
    }
  });
});
