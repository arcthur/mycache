import * as Mycache from 'mycache';

const persist = new Mycache.Persist();

async function test() {
  await persist.setItem('a', { a: 1 }, 10);
  await persist.setItem('b', { b: 1 }, new Date('January 3, 2013'));

  setTimeout(async () => {
    await persist.clearExpires();
  }, 2000)
}

test();