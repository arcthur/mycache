import test from 'ava';
import Persist from '../lib/Persist/Persist';
import fs from 'fs';
import puppeteer from 'puppeteer';

test.beforeEach(async t => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
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
    const setARes = await persist.set('a', { a: 1 });
    const setBRes = await persist.set('b', { b: 1 });

    return {
      aVal: await persist.get('a'),
      bVal: await persist.get('b'),
      length: await persist.length(),
    };
  });

  t.deepEqual(result.aVal, { a: 1 });
  t.deepEqual(result.bVal, { b: 1 });
  t.is(result.length, 2);
});

test.serial('persist set get item using compress', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist({
      isCompress: true,
    });
    const setARes = await persist.set('a', { a: 1 });
    const setBRes = await persist.set('b', { b: 1 });

    return {
      aVal: await persist.get('a'),
      bVal: await persist.get('b'),
      length: await persist.length(),
    };
  });

  t.deepEqual(result.aVal, { a: 1 });
  t.deepEqual(result.bVal, { b: 1 });
  t.is(result.length, 2);
});

test.serial('persist gets items', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist();
    await persist.set('a', { a: 1 });
    await persist.set('b', { b: 1 });
    await persist.set('c', { c: 1 });

    return {
      val: await persist.gets(['a', 'b', 'c']),
    };
  });

  t.deepEqual(result.val, [{ a: 1 }, { b: 1 }, { c: 1 }]);
});

test.serial('persist append item', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist();
    const setRes = await persist.set('a', { a: 1 });
    const appendRes = await persist.append('a', { b: 1 });

    return {
      aVal: await persist.get('a'),
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
    const setRes = await persist.set('a', { a: 1 });

    return {
      aVal: await persist.get('a'),
    };
  });

  t.deepEqual(result1.aVal, { 'a': 1 });

  const result2 = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist();
    const setRes = await persist.remove('a');

    return {
      aVal: await persist.get('a'),
    };
  });

  t.deepEqual(result2.aVal, null);
});

test.serial('persist clear item', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist();
    await persist.set('a', { a: 1 });
    await persist.set('b', { b: 1 });
    await persist.clear()

    return {
      length: await persist.length(),
    };
  });

  t.is(result.length, 0);
});

test.serial('persist each', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist();
    await persist.set('a', { a: 1 });
    await persist.set('b', { b: 1 });

    let length = 0;
    await persist.each((val, key) => {
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
    await persist.set('a', { a: 1 }, 1000);
    window.MockDate.set('1/3/2013');

    return {
      aVal: await persist.get('a'),
    };
  });

  t.is(result.aVal, null);
});

test.serial('persist expire item use Date', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const MockDate = window.MockDate.set('1/1/2013');
    const persist = new window.Mycache.Persist();
    await persist.set('b', { b: 1 }, new Date('January 2, 2013'));
    window.MockDate.set('1/3/2013');

    return {
      aVal: await persist.get('a'),
    };
  });

  t.is(result.aVal, null);
});

test.serial('persist clear expire', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const MockDate = window.MockDate.set('1/1/2013');
    const persist = new window.Mycache.Persist();
    await persist.set('a', { a: 1 }, 1000);
    await persist.set('b', { b: 1 }, new Date('January 3, 2013'));
    window.MockDate.set('1/2/2013');

    const expired = await persist.getExpiredKeys();
    for (let i = 0; i < expired.length; i++) {
      await persist.remove(expired[i]);
    }

    return {
      length: await persist.length(),
    };
  });

  t.is(result.length, 1);
});

test.serial('persist clear overlength', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist({
      valueMaxLength: 20,
    });
    await persist.set('a', { a: 10000, b: 10000 });
    await persist.set('b', { b: 1 });

    const overlength = await persist.getOverLengthKeys();
    for (let i = 0; i < overlength.length; i++) {
      await persist.remove(overlength[i]);
    }

    return {
      length: await persist.length(),
    };
  });

  t.is(result.length, 1);
});

test.serial('persist clear old', async t => {
  const page = t.context.page;

  const result = await page.evaluate(async () => {
    const persist = new window.Mycache.Persist();
    await persist.set('a', { a: 1 });
    await persist.set('b', { b: 1 });
    await persist.set('c', { c: 1 });
    await persist.set('d', { d: 1 });
    await persist.set('e', { e: 1 });
    await persist.get('d');
    await persist.get('d');
    await persist.get('c');
    await persist.get('b');

    const olds = await persist.getOldKeys();
    for (let i = 0; i < olds.length; i++) {
      await persist.remove(olds[i]);
    }
    const sortItems = await persist.getSortedItems();

    return {
      keys: await sortItems.map((value) => value.key),
      length: await persist.length(),
    };
  });

  t.deepEqual(result.keys, ['d', 'b', 'c', 'e']);
  t.is(result.length, 4);
});