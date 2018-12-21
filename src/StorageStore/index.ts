import { IndexedDbStore } from './IndexedDbStore';
import { MemoryStore } from './MemoryStore';
import { LocalStorageStore, SessionStorageStore } from './WebStorageStore';

// single, multi, smart three pattern
const DEFAULT_STORES = [
  'indexedDB',
  'localStorage',
  'sessionStorage',
  'memoryStore',
];

const DEFAULT_KEY_PREFIX = 'storage|';

function checkStores(stores = DEFAULT_STORES) {
  let store: any = MemoryStore;

  for (const item of stores) {
    if (item === 'indexedDB' && window.indexedDB) {
      store = IndexedDbStore;
      break;
    }

    if (item === 'localStorage' && window.localStorage) {
      store = LocalStorageStore;
      break;
    }

    if (item === 'sessionStorage' && window.sessionStorage) {
      store = SessionStorageStore;
      break;
    }

    if (item === 'memoryStore') {
      store = MemoryStore;
      break;
    }
  }

  return store;
}

class StorageStore {
  public store: any;
  public onReady: any;
  public config: { prefix: string };

  constructor(stores = DEFAULT_STORES, config = { prefix: '' }) {
    const store = checkStores(stores);
    this.store = new store();
    this.config = {
      prefix: config.prefix || DEFAULT_KEY_PREFIX,
    };
  }

  public async get(key: string) {
    await this.store.onReady();

    const prefixedKey = `${this.config.prefix}${key}`;

    return this.store.get(prefixedKey);
  }

  public async set(key: string, value: any) {
    await this.store.onReady();

    key = `${this.config.prefix}${key}`;

    return this.store.set(key, value);
  }

  public async remove(key: string) {
    await this.store.onReady();

    key = `${this.config.prefix}${key}`;

    return this.store.remove(key);
  }

  public async clear() {
    await this.store.onReady();

    const keys = await this.keys();

    for (const key of keys) {
      await this.remove(key);
    }

    return Promise.resolve(true);
  }

  public async keys() {
    await this.store.onReady();

    const keys = await this.store.keys();
    const getKeys: string[] = [];

    for (const key of keys) {
      if (key.indexOf(this.config.prefix) === 0) {
        getKeys.push(key.replace(this.config.prefix, ''));
      }
    }

    return Promise.resolve(getKeys);
  }

  public async length() {
    await this.store.onReady();
    return this.store.length();
  }
}

const Storage = new StorageStore();

export { Storage, StorageStore };
