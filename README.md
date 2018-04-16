# Mycache

[![Build Status](https://travis-ci.org/arcthur/mycache.svg?branch=master)](http://travis-ci.org/arcthur/mycache)
[![NPM version](https://badge.fury.io/js/mycache.svg)](http://badge.fury.io/js/mycache)
[![Dependency Status](https://img.shields.io/david/arcthur/mycache.svg)](https://david-dm.org/arcthur/mycache)
[![npm](https://img.shields.io/npm/dm/mycache.svg?maxAge=2592000)](https://npmcharts.com/compare/mycache?minimal=true)

Mycache is a cache library enhanced front end local cache. Mycache provides two kinds of cache: persist cache and memory cache. Persist cache uses [localforage](https://github.com/localForage/localForage) to support.

```bash
npm install mycache
```

## How to use Mycache
### Init cache

```js
import { Cache, Persist } from 'mycache';

const persist = new Persist();
```

And the Promise/Async form:

```js
import { Cache, Persist } from 'mycache';

const persist = new Persist();

async function persist() {
  await persist.setItem('key', 'value');
  return await persist.getItem('key');
}
```

### Configuration

Cache Config:

```js
import { Cache } from 'mycache';

const cache = new Cache({
  name: 'mycache', // name prefix of key
});
```

Persist Config:

```js
import { Persist } from 'mycache';

const persist = new Persist({
  name: 'mycache', // name prefix of key
  valueMaxLength: 500 * 1000, // max length of value
  autoClearExpires: true, // auto clear expires and max length on beforeonload
  storeName: 'persist'; // The name of the datastore
});
```