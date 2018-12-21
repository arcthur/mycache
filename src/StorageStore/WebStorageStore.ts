import { deserialize, serialize } from '../Utils/serializer';

class StorageApiWrapper {
  public store: Storage;

  constructor(store: any) {
    this.store = store;
  }

  public async onReady() {
    return this;
  }

  public async get(key: string) {
    const value = this.store.getItem(key);
    const val = typeof value === 'string' ? deserialize(value) : undefined;

    return Promise.resolve(val);
  }

  public async set(key: string, value: any) {
    return new Promise((resolve, reject) => {
      serialize(value, (val: any, err: Error) => {
        if (err) {
          reject(err);
        }

        try {
          this.store.setItem(key, val);
          return resolve(true);
        } catch (e) {
          if (
            e.name === 'QuotaExceededError' ||
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
          ) {
            reject(e);
          }
          reject(e);
        }
      });
    });
  }

  public async remove(key: string) {
    this.store.removeItem(key);
    return Promise.resolve(true);
  }

  public async clear() {
    this.store.clear();
    return Promise.resolve(true);
  }

  public async keys() {
    const keys = Array.apply(0, new Array(this.store.length)).map((o, i) =>
      this.store.key(i)
    );
    return Promise.resolve(keys);
  }

  public async length() {
    return Promise.resolve(this.store.length);
  }
}

// tslint:disable-next-line:max-classes-per-file
class LocalStorageStore extends StorageApiWrapper {
  constructor() {
    super(window.localStorage);
  }
}

// tslint:disable-next-line:max-classes-per-file
class SessionStorageStore extends StorageApiWrapper {
  constructor() {
    super(window.sessionStorage);
  }
}

export { LocalStorageStore, SessionStorageStore };
