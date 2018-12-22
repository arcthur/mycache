# Mycache

[![Build Status](https://travis-ci.org/arcthur/mycache.svg?branch=master)](http://travis-ci.org/arcthur/mycache)
[![NPM version](https://badge.fury.io/js/mycache.svg)](http://badge.fury.io/js/mycache)
[![Dependency Status](https://img.shields.io/david/arcthur/mycache.svg)](https://david-dm.org/arcthur/mycache)
[![npm](https://img.shields.io/npm/dm/mycache.svg?maxAge=2592000)](https://npmcharts.com/compare/mycache?minimal=true)

Mycache is a cache library enhanced front end local cache. It can provide 4 stores, includes indexedDB, localStorage, sessionStorage and memorayStore.

## Installation
NPM is the easiest and fastest way to get started using Mycache.

```bash
# latest stable
npm install mycache
```

## How to use Mycache
### Init cache

```js
import Mycache from 'mycache';

const mycache = new Mycache();
```

Sample example used the promise/async form:

```js
import Mycache from 'mycache';

const mycache = new Mycache();

await mycache.set('key', 'value');
const val = await mycache.get('key');
```

### Configuration

```js
import Mycache from 'mycache';

const mycache = new Mycache({
  name: 'mycache', // name prefix of key
  oldItemsCount: 0.2, // this count of old items
  stores: ['indexedDB', 'localStorage'], // use first store if system support
});
```

Mycache API:

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
// get all overlength keys
function getOverLengthKeys(): Promise<string[]> {}
// if the key is old
function getOldKeys(): Promise<string[]> {}
// get items by sorted
function getSortedItems(): Promise<typed.IMycacheMetaDataMap[]> {}
```

## Inspire & Thanks

- [localForage](https://github.com/localForage/localForage)
- [ImmortalDB](https://github.com/gruns/ImmortalDB)

## License
[MIT](http://opensource.org/licenses/MIT)
