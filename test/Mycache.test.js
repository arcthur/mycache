import test from 'ava';
import fs from 'fs';
import puppeteer from 'puppeteer';

test.beforeEach(async t => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const preloadCacheFile = fs.readFileSync(__dirname + '/../umd/mycache.min.js', 'utf8');
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

function tests(key) {
  test.serial('mycache set get item', async t => {
    const page = t.context.page;

    const result = await page.evaluate(async (k) => {
      const mycache = new window.Mycache(k);
      await mycache.set('a', { a: 1 });
      await mycache.set('b', { b: 1 });

      return {
        aVal: await mycache.get('a'),
        bVal: await mycache.get('b'),
        length: await mycache.length(),
      };
    }, key);

    t.deepEqual(result.aVal, { a: 1 });
    t.deepEqual(result.bVal, { b: 1 });
    t.is(result.length, 2);
  });

  test.serial('mycache gets items', async t => {
    const page = t.context.page;

    const result = await page.evaluate(async (k) => {
      const mycache = new window.Mycache(k);
      await mycache.set('a', { a: 1 });
      await mycache.set('b', { b: 1 });
      await mycache.set('c', { c: 1 });

      return {
        val: await mycache.gets(['a', 'b', 'c']),
      };
    }, key);

    t.deepEqual(result.val, [{ a: 1 }, { b: 1 }, { c: 1 }]);
  });

  test.serial('mycache append item', async t => {
    const page = t.context.page;

    const result = await page.evaluate(async (k) => {
      const mycache = new window.Mycache(k);
      await mycache.set('a', { a: 1 });
      await mycache.append('a', { b: 1 });

      return {
        aVal: await mycache.get('a'),
        length: await mycache.length(),
      };
    }, key);

    t.deepEqual(result.aVal, { 'a': 1, 'b': 1 });
    t.is(result.length, 1);
  });

  test.serial('mycache remove item', async t => {
    const page = t.context.page;

    const result1 = await page.evaluate(async (k) => {
      const mycache = new window.Mycache();
      await mycache.set('a', { a: 1 });

      return {
        aVal: await mycache.get('a'),
      };
    }, key);

    t.deepEqual(result1.aVal, { 'a': 1 });

    const result2 = await page.evaluate(async (k) => {
      const mycache = new window.Mycache();
      await mycache.remove('a');

      return {
        aVal: await mycache.get('a'),
      };
    }, key);

    t.deepEqual(result2.aVal, null);
  });

  test.serial('mycache clear item', async t => {
    const page = t.context.page;

    const result = await page.evaluate(async (k) => {
      const mycache = new window.Mycache(k);
      await mycache.set('a', { a: 1 });
      await mycache.set('b', { b: 1 });
      await mycache.clear()

      return {
        length: await mycache.length(),
      };
    }, key);

    t.is(result.length, 0);
  });

  test.serial('mycache each', async t => {
    const page = t.context.page;

    const result = await page.evaluate(async (k) => {
      const mycache = new window.Mycache(k);
      await mycache.set('a', { a: 1 });
      await mycache.set('b', { b: 1 });

      let length = 0;
      await mycache.each((val, key) => {
        length++;
      });

      return {
        length: length,
      };
    }, key);

    t.deepEqual(result.length, 2);
  });

  test.serial('mycache expire item use number', async t => {
    const page = t.context.page;

    const result = await page.evaluate(async (k) => {
      const MockDate = window.MockDate.set('1/2/2013');
      const mycache = new window.Mycache(k);
      await mycache.set('a', { a: 1 }, 1000);
      window.MockDate.set('1/3/2013');

      return {
        aVal: await mycache.get('a'),
      };
    }, key);

    t.is(result.aVal, null);
  });

  test.serial('mycache expire item use Date', async t => {
    const page = t.context.page;

    const result = await page.evaluate(async (k) => {
      const MockDate = window.MockDate.set('1/1/2013');
      const mycache = new window.Mycache(k);
      await mycache.set('b', { b: 1 }, new Date('January 2, 2013'));
      window.MockDate.set('1/3/2013');

      return {
        aVal: await mycache.get('a'),
      };
    }, key);

    t.is(result.aVal, null);
  });

  test.serial('mycache clear expire', async t => {
    const page = t.context.page;

    const result = await page.evaluate(async (k) => {
      const MockDate = window.MockDate.set('1/1/2013');
      const mycache = new window.Mycache(k);
      await mycache.set('a', { a: 1 }, 1000);
      await mycache.set('b', { b: 1 }, new Date('January 3, 2013'));
      window.MockDate.set('1/2/2013');

      const expired = await mycache.getExpiredKeys();
      for (let i = 0; i < expired.length; i++) {
        await mycache.remove(expired[i]);
      }

      return {
        length: await mycache.length(),
      };
    }, key);

    t.is(result.length, 1);
  });

  test.serial('mycache clear old', async t => {
    const page = t.context.page;

    const result = await page.evaluate(async (k) => {
      const mycache = new window.Mycache(k);
      await mycache.set('a', { a: 1 });
      await mycache.set('b', { b: 1 });
      await mycache.set('c', { c: 1 });
      await mycache.set('d', { d: 1 });
      await mycache.set('e', { e: 1 });

      const olds = await mycache.getOldKeys();
      for (let i = 0; i < olds.length; i++) {
        await mycache.remove(olds[i]);
      }
      const sortItems = await mycache.getSortedItems();

      return {
        keys: await sortItems.map((value) => value.key),
        length: await mycache.length(),
      };
    }, key);

    t.deepEqual(result.keys, ['a', 'b', 'c', 'd']);
    t.is(result.length, 4);
  });
}

tests(['indexedDB']);
tests(['localStorage']);
tests(['sessionStorage']);
tests(['memoryStore']);