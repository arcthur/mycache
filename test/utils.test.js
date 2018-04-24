import test from 'ava';
import * as utils from '../lib/utils';

test('isDate', t => {
  t.false(utils.isDate(100));
  t.false(utils.isDate({}));
  t.true(utils.isDate(new Date()));
});

test('isNumber', t => {
  t.false(utils.isNumber('str'));
  t.false(utils.isNumber({}));
  t.true(utils.isNumber(123));
});

test('isArray', t => {
  t.false(utils.isArray({}));
  t.false(utils.isArray(123));
  t.false(utils.isArray('str'));
  t.true(utils.isArray([1, 2, 3]));
});

test('isPainObject', t => {
  t.true(utils.isPlainObject({ a: 1 }));
  t.true(utils.isPlainObject(Object.create({})));
  t.true(utils.isPlainObject(Object.create(Object.prototype)));
  t.false(utils.isPlainObject(['foo', 'bar']));
  t.false(utils.isPlainObject(Object.create(null)));
  t.false(utils.isPlainObject(function() {}));
});

test('extend', t => {
  t.deepEqual(utils.extend({}, { a: 1 }), { a: 1 });
  t.deepEqual(utils.extend({ b: 2 }, { a: 1 }), { a: 1, b: 2 });
  t.deepEqual(utils.extend({ b: 2, a: 2 }, { a: 1 }), { a: 1, b: 2 });
  t.deepEqual(utils.extend({ b: 2, a: 2 }, null), { a: 2, b: 2 });
  t.deepEqual(utils.extend({ b: 2, a: 2 }, 123), { a: 2, b: 2 });
});

test('omit', t => {
  t.deepEqual(utils.omit({ a: 1, b: 2 }, 'a'), { b: 2 });
  t.deepEqual(utils.omit({ a: 1, b: 2 }, 'c'), { a: 1, b: 2 });
  t.deepEqual(utils.omit([], 'c'), {});
});

test('utf16ByteLength', t => {
  t.deepEqual(utils.utf16ByteLength('abcd'), 8);
  t.deepEqual(utils.utf16ByteLength('𐐷𐐷'), 8);
});