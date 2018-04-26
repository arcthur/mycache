# Mycache

[![Build Status](https://travis-ci.org/arcthur/mycache.svg?branch=master)](http://travis-ci.org/arcthur/mycache)
[![NPM version](https://badge.fury.io/js/mycache.svg)](http://badge.fury.io/js/mycache)
[![Dependency Status](https://img.shields.io/david/arcthur/mycache.svg)](https://david-dm.org/arcthur/mycache)
[![npm](https://img.shields.io/npm/dm/mycache.svg?maxAge=2592000)](https://npmcharts.com/compare/mycache?minimal=true)

Mycache is a cache library enhanced front end local cache, and provides two kinds of cache: persist cache and memory cache.

The persist cache use two park to store, localStorage is responsible for store the meta info, and indexeddb is responsible for store value.

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

```ts
// get value of key
function get(key: string): Promise<any> {}
// get all value of keys
function gets() : Promise<any> {}
// set key value and expire time
function set<T>(key: string, value: T, expire: number | Date = -1): Promise<T> {}
// append key value and expire time
function append<T>(key: string, value: T, expire: number | Date = -1): Promise<T> {}
// if the key has in local
function has(key: string): Promise<boolean> {}
// remove key
function remove(key: string): Promise<void> {}
// get all keys
function keys(): Promise<string[]> {}
// clear all keys
function clear(): Promise<void> {}
// the length of all keys
function length(): Promise<number> {}
// each all keys by callback
function each(iterator: (value: any, key: string, iterationNumber: number) => void): Promise<boolean> {}
// if the key is expired
function isExpired(key: string): Promise<boolean> {}
```

Persist Config:

```js
import { Persist } from 'mycache';

const persist = new Persist({
  name: 'mycache', // name prefix of key
  storeName: 'persist', // The name of the datastore
  isCompress: false, // if enable string compress
  valueMaxLength: 500 * 1000, // max length of value
  oldItemsCount: 0.2, // this count of old items
});
```

Persist API:

```ts
// get value of key
function get(key: string): Promise<any> {}
// get all value of keys
function gets() : Promise<any> {}
// set key value and expire time
function set<T>(key: string, value: T, expire: number | Date = -1): Promise<T> {}
// append key value and expire time
function append<T>(key: string, value: T, expire: number | Date = -1): Promise<T> {}
// if the key has in local
function has(key: string): Promise<boolean> {}
// remove key
function remove(key: string): Promise<void> {}
// get all keys
function keys(): Promise<string[]> {}
// clear all keys
function clear(): Promise<void> {}
// the length of all keys
function length(): Promise<number> {}
// each all keys by callback
function each(iterator: (value: any, key: string, iterationNumber: number) => void): Promise<boolean> {}
// if the key is expired
function isExpired(key: string): Promise<boolean> {}
// get all expired keys
function getExpiredKeys(): Promise<string[]> {}
// if the key is overlength
function isOverLength(key: string): Promise<boolean> {}
// get all overlength keys
function getOverLengthKeys(): Promise<string[]> {}
// if the key is old
function getOldKeys(): Promise<string[]> {}
// get items by sorted
function getSortedItems(): Promise<typed.IPersistDataMap[]> {}
```

## License
[MIT](http://opensource.org/licenses/MIT)