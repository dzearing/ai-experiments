import { test } from 'node:test';
import assert from 'node:assert';
import { hello } from '../lib/index.js';

test('hello function returns greeting', () => {
  const result = hello('World');
  assert.strictEqual(result, 'Hello, World!');
});