import test from 'ava';
import Persist from '../lib/Persist';
import fs from 'fs';
import puppeteer from 'puppeteer';

test.beforeEach(async t => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const preloadCacheFile = fs.readFileSync(__dirname + '/../dist/umd/mycache.prod.min.js', 'utf8');
  await page.evaluateOnNewDocument(preloadCacheFile);

  const preloadDateFile = fs.readFileSync(__dirname + '/MockDate.js', 'utf8');
  await page.evaluateOnNewDocument(preloadDateFile);
  await page.goto('http://example.com/')

  t.context.browser = browser;
  t.context.page = page;
});

test.afterEach(async t => {
  await t.context.browser.close();
});

test.serial('persist set get item', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist();
    const setARes = await persist.setItem('a', { a: 1 });
    const setBRes = await persist.setItem('b', { b: 1 });

    return {
      aVal: await persist.getItem('a'),
      bVal: await persist.getItem('b'),
      length: await persist.length(),
    };
  });

  t.deepEqual(result.aVal, { a: 1 });
  t.deepEqual(result.bVal, { b: 1 });
  t.is(result.length, 2);
});

test.serial('persist append item', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist();
    const setRes = await persist.setItem('a', { a: 1 });
    const appendRes = await persist.appendItem('a', { b: 1 });

    return {
      aVal: await persist.getItem('a'),
      length: await persist.length(),
    };
  });

  t.deepEqual(result.aVal, { 'a': 1, 'b': 1 });
  t.is(result.length, 1);
});

test.serial('persist remove item', async t => {
  const page = t.context.page;

  const result1 = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist();
    const setRes = await persist.setItem('a', { a: 1 });

    return {
      aVal: await persist.getItem('a'),
    };
  });

  t.deepEqual(result1.aVal, { 'a': 1 });

  const result2 = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist();
    const setRes = await persist.removeItem('a');

    return {
      aVal: await persist.getItem('a'),
    };
  });

  t.deepEqual(result2.aVal, null);
});

test.serial('persist clear item', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist();
    await persist.setItem('a', { a: 1 });
    await persist.setItem('b', { b: 1 });
    await persist.clear()

    return {
      length: await persist.length(),
    };
  });

  t.is(result.length, 0);
});

test.serial('persist iterate', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist();
    await persist.setItem('a', { a: 1 });
    await persist.setItem('b', { b: 1 });

    let length = 0;
    await persist.iterate((val, key) => {
      length++;
    });

    return {
      length: length,
    };
  });

  t.deepEqual(result.length, 2);
});

test.serial('persist expire item use number', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const MockDate = window.MockDate.set('1/2/2013');
    const persist = new window.Mycache.Persist();
    await persist.setItem('a', { a: 1 }, 1000);
    window.MockDate.set('1/3/2013');

    return {
      aVal: await persist.getItem('a'),
    };
  });

  t.is(result.aVal, null);
});

test.serial('persist expire item use Date', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const MockDate = window.MockDate.set('1/1/2013');
    const persist = new window.Mycache.Persist();
    await persist.setItem('b', { b: 1 }, new Date('January 2, 2013'));
    window.MockDate.set('1/3/2013');

    return {
      aVal: await persist.getItem('a'),
    };
  });

  t.is(result.aVal, null);
});

test.serial('persist clear expire', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const MockDate = window.MockDate.set('1/1/2013');
    const persist = new window.Mycache.Persist();
    await persist.setItem('a', { a: 1 }, 1000);
    await persist.setItem('b', { b: 1 }, new Date('January 3, 2013'));
    window.MockDate.set('1/2/2013');
    await persist.clearExpires();

    return {
      length: await persist.length(),
    };
  });

  t.is(result.length, 1);
});