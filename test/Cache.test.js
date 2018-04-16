import test from 'ava';
import sinon from 'sinon';
import Cache from '../lib/Cache';

let sandbox;

test.beforeEach(t => {
  t.context.cache = new Cache();
  sandbox = sinon.sandbox.create();

  const date = new Date('January 1, 2013');
  t.context.clock = sinon.useFakeTimers(date.getTime());
});

test.afterEach(t => {
  sandbox.restore();
  t.context.clock.restore();
});

test('cache set get item', async t => {
  const cache = t.context.cache;

  const setARes = await cache.setItem('a', { a: 1 });
  const setBRes = await cache.setItem('b', { b: 1 });

  t.deepEqual(await cache.getItem('a'), { a: 1 });
  t.deepEqual(await cache.getItem('b'), { b: 1 });
  t.is(await cache.length(), 2);
});

test('cache append item', async t => {
  const cache = t.context.cache;

  const setRes = await cache.setItem('a', { a: 1 });
  const appendRes = await cache.appendItem('a', { b: 1 });

  t.deepEqual(await cache.getItem('a'), { 'a': 1, 'b': 1 });
  t.is(await cache.length(), 1);
});

test('cache remove item', async t => {
  const cache = t.context.cache;

  const setRes = await cache.setItem('a', { a: 1 });
  t.deepEqual(await cache.getItem('a'), { a: 1 });

  const removeRes = await cache.removeItem('a');
  t.deepEqual(await cache.getItem('a'), null);
});

test('cache clear item', async t => {
  const cache = t.context.cache;

  const setRes = await cache.setItem('a', { a: 1 });
  const setOtherRes = await cache.setItem('b', { b: 1 });
  const clearRes = await cache.clear();

  t.is(await cache.length(), 0);
});

test('cache iterate', async t => {
  const cache = t.context.cache;

  await cache.setItem('a', { a: 1 });
  await cache.setItem('b', { b: 1 });

  const res = await cache.iterate((val, key) => {});

  t.deepEqual(res, { b: 1 });
});

test.serial('cache expire item use number', async t => {
  const cache = t.context.cache;
  const clock = t.context.clock;
  
  await cache.setItem('a', { a: 1 }, 1000);
  clock.tick(1000001);

  t.is(await cache.getItem('a'), null);
});

test.serial('cache expire item use Date', async t => {
  const cache = t.context.cache;
  const clock = t.context.clock;

  await cache.setItem('b', { b: 1 }, new Date('January 2, 2013'));
  clock.tick(86400001);

  t.is(await cache.getItem('b'), null);
});

test.serial('cache clear expire', async t => {
  const cache = t.context.cache;
  const clock = t.context.clock;

  await cache.setItem('a', { a: 1 }, 1000);
  await cache.setItem('b', { b: 1 }, new Date('January 2, 2013'));
  clock.tick(1000001);
  await cache.clearExpires();

  t.is(await cache.length(), 1);
});
