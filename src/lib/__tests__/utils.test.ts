import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  capitalize,
  snakeToTitle,
  truncate,
  isEmpty,
  safeJsonParse,
  getWordCountRange,
  getInitials,
  pluralize,
  validatePassword,
  formatDuration,
} from '../utils';

test('capitalize uppercases the first letter', () => {
  assert.equal(capitalize('hello'), 'Hello');
  assert.equal(capitalize(''), '');
});

test('snakeToTitle converts snake_case to Title Case', () => {
  assert.equal(snakeToTitle('hello_world'), 'Hello World');
  assert.equal(snakeToTitle('story_created'), 'Story Created');
});

test('truncate shortens long strings with ellipsis', () => {
  assert.equal(truncate('hello world', 8), 'hello...');
  assert.equal(truncate('short', 10), 'short');
});

test('isEmpty detects empty values', () => {
  assert.equal(isEmpty(null), true);
  assert.equal(isEmpty(undefined), true);
  assert.equal(isEmpty(''), true);
  assert.equal(isEmpty('  '), true);
  assert.equal(isEmpty([]), true);
  assert.equal(isEmpty({}), true);
  assert.equal(isEmpty('x'), false);
  assert.equal(isEmpty([1]), false);
});

test('safeJsonParse returns fallback on invalid JSON', () => {
  assert.deepEqual(safeJsonParse('{"a":1}', {}), { a: 1 });
  assert.deepEqual(safeJsonParse('not json', { fallback: true }), { fallback: true });
});

test('getWordCountRange returns age-appropriate ranges', () => {
  assert.deepEqual(getWordCountRange(5), { min: 40, max: 60 });
  assert.deepEqual(getWordCountRange(9), { min: 60, max: 80 });
  assert.deepEqual(getWordCountRange(12), { min: 80, max: 100 });
});

test('getInitials returns up to two uppercased initials', () => {
  assert.equal(getInitials('Jane Doe'), 'JD');
  assert.equal(getInitials('luno'), 'L');
  assert.equal(getInitials('Mary Anne Smith'), 'MA');
});

test('pluralize picks singular or plural form', () => {
  assert.equal(pluralize(1, 'story'), 'story');
  assert.equal(pluralize(2, 'story', 'stories'), 'stories');
  assert.equal(pluralize(0, 'badge'), 'badges');
});

test('validatePassword enforces strength rules', () => {
  assert.ok(validatePassword('short') !== null);
  assert.ok(validatePassword('alllowercase1!') !== null);
  assert.equal(validatePassword('Str0ng!Password'), null);
});

test('formatDuration formats seconds as mm:ss', () => {
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(600), '10:00');
});
