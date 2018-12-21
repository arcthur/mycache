import * as utils from '../Utils/utils';

interface IStore {
  [key: string]: any;
}

class MemoryStore {
  public store: IStore;

  constructor() {
    this.store = {};
  }

  public async onReady() {
    return this;
  }

  public async get(key: string) {
    const res = this.store[key];
    return Promise.resolve(res);
  }

  public async set(key: string, value: any) {
    this.store[key] = value;
    return Promise.resolve(true);
  }

  public async remove(key: string) {
    if (this.store[key]) {
      this.store[key] = null;
      this.store = utils.omit(this.store, key);
    }
    return Promise.resolve(true);
  }

  public async clear() {
    this.store = {};
    return Promise.resolve(true);
  }

  public async keys() {
    const keys = Object.keys(this.store);
    return Promise.resolve(keys);
  }

  public async length() {
    const keys = await this.keys();
    return Promise.resolve(keys.length);
  }
}

export { MemoryStore };
