import Mycache from 'mycache';

const mycache = new Mycache();

async function test() {
  await mycache.set('a', { a: 1 }, 1);
  await mycache.set('b', { b: 1 }, 30);

  console.log(await mycache.get('a'))
  await mycache.clear();
  setTimeout(async () => {
    console.log(await mycache.get('a'))
  }, 2000)
}

test();