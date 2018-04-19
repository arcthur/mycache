import test from 'ava';
import sinon from 'sinon';
import MemCache from '../lib/MemCache';

let sandbox;

test.beforeEach(t => {
  t.context.cache = new MemCache();
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

  await cache.set('a', { a: 1 });
  await cache.set('b', { b: 1 });

  t.deepEqual(await cache.get('a'), { a: 1 });
  t.deepEqual(await cache.get('b'), { b: 1 });
  t.is(await cache.length(), 2);
});

test.serial('cache gets items', async t => {
  const cache = t.context.cache;

  await cache.set('a', { a: 1 });
  await cache.set('b', { b: 1 });
  await cache.set('c', { c: 1 });

  t.deepEqual(await cache.gets(['a', 'b', 'c']), [{ a: 1 }, { b: 1 }, { c: 1 }]);
});

test('cache append item', async t => {
  const cache = t.context.cache;

  const setRes = await cache.set('a', { a: 1 });
  const appendRes = await cache.append('a', { b: 1 });

  t.deepEqual(await cache.get('a'), { 'a': 1, 'b': 1 });
  t.is(await cache.length(), 1);
});

test('cache remove item', async t => {
  const cache = t.context.cache;

  const setRes = await cache.set('a', { a: 1 });
  t.deepEqual(await cache.get('a'), { a: 1 });

  const removeRes = await cache.remove('a');
  t.deepEqual(await cache.get('a'), null);
});

test('cache clear item', async t => {
  const cache = t.context.cache;

  const setRes = await cache.set('a', { a: 1 });
  const setOtherRes = await cache.set('b', { b: 1 });
  const clearRes = await cache.clear();

  t.is(await cache.length(), 0);
});

test.serial('cache each', async t => {
  const cache = t.context.cache;

  await cache.set('a', { a: 1 });
  await cache.set('b', { b: 1 });

  let len = 0;
  await cache.each((val, key) => { len++; });

  t.is(len, 2);
});

test.serial('cache expire item use number', async t => {
  const cache = t.context.cache;
  const clock = t.context.clock;
  
  await cache.set('a', { a: 1 }, 1000);
  clock.tick(1000001);

  t.is(await cache.get('a'), null);
});

test.serial('cache expire item use Date', async t => {
  const cache = t.context.cache;
  const clock = t.context.clock;

  await cache.set('b', { b: 1 }, new Date('January 2, 2013'));
  clock.tick(86400001);

  t.is(await cache.get('b'), null);
});

test.serial('cache clear expire', async t => {
  const cache = t.context.cache;
  const clock = t.context.clock;

  await cache.set('a', { a: 1 }, 1000);
  await cache.set('b', { b: 1 }, new Date('January 2, 2013'));
  clock.tick(1000001);
  await cache.clearExpired();

  t.is(await cache.length(), 1);
});
