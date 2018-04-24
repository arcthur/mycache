# Mycache

[![Build Status](https://travis-ci.org/arcthur/mycache.svg?branch=master)](http://travis-ci.org/arcthur/mycache)
[![NPM version](https://badge.fury.io/js/mycache.svg)](http://badge.fury.io/js/mycache)
[![Dependency Status](https://img.shields.io/david/arcthur/mycache.svg)](https://david-dm.org/arcthur/mycache)
[![npm](https://img.shields.io/npm/dm/mycache.svg?maxAge=2592000)](https://npmcharts.com/compare/mycache?minimal=true)

Mycache is a cache library enhanced front end local cache. Mycache provides two kinds of cache: persist cache and memory cache. Persist cache is used [localforage](https://github.com/localForage/localForage).

## Installation
NPM is the easiest and fastest way to get started using Mycache.

```bash
# latest stable
npm install mycache
```

## How to use Mycache
### Init cache

```js
import { Persist } from 'mycache';

const persist = new Persist();
```

Sample example used the promise/async form:

```js
import { Persist } from 'mycache';

const persist = new Persist();

async function persist() {
  await persist.set('key', 'value');
  return await persist.get('key');
}
```

### Configuration

MemCache Config:

```js
import { MemCache } from 'mycache';

const cache = new MemCache({
  name: 'mycache', // name prefix of key
});
```

MemCache API:

```js
// get value of key
cache.get(key: string)
// get all value of keys
cache.gets();
// set key value and expire time
cache.set(key: sting, value: any, expire: number | Date = -1)
// append key value and expire time
cache.append(key: sting, value: any, expire: number | Date = -1)
// if the key has in local
cache.has(key: string)
// remove key
cache.remove(key: string)
// get all keys
cache.keys()
// clear all keys
cache.clear()
// the length of all keys
cache.length()
// each all keys by callback
cache.each(iterator: (value: any, key: string, iterationNumber: number) => void)
// get all expired keys
cache.getExpiredKeys()
// if the key is expired
cache.isExpired(key: string)
```

Persist Config:

```js
import { Persist } from 'mycache';

const persist = new Persist({
  name: 'mycache', // name prefix of key
  storeName: 'persist', // The name of the datastore
  valueMaxLength: 500 * 1000, // max length of value
  oldItemsCount: 0.2, // this count of old items
});
```

Persist API:

```js
// get value of key
persist.get(key: string)
// get all value of keys
persist.gets();
// set key value and expire time
persist.set(key: sting, value: any, expire: number | Date = -1)
// append key value and expire time
persist.append(key: sting, value: any, expire: number | Date = -1)
// if the key has in local
persist.has(key: string)
// remove key
persist.remove(key: string)
// get all keys
persist.keys()
// clear all keys
persist.clear()
// the length of all keys
persist.length()
// each all keys by callback
persist.each(iterator: (value: any, key: string, iterationNumber: number) => void)
// if the key is expired
persist.isExpired(key: string)
// get all expired keys
persist.getExpiredKeys()
// if the key is overlength
persist.isOverLength(key: string)
// get all overlength keys
persist.getOverLengthKeys()
// if the key is old
persist.getOldKeys()
// get items by sorted
persist.getSortedItems();
```

## License
[MIT](http://opensource.org/licenses/MIT)