import * as typed from './typed';
import * as utils from './utils';

class MemCache {
  private cacheConfig: typed.IMemCacheConfig;
  private cacheInstance: any;

  constructor(config: typed.IMemCacheConfig = {}) {
    this.cacheConfig = utils.extend(config, { name: 'memcache' });
    this.cacheInstance = {};
  }

  public async getExpiredKeys(): Promise<string[]> {
    try {
      const getkeys: string[] = [];
      const keys = await this.keys();

      for (const key of keys) {
        const isExpired = await this.isExpired(key);
        if (isExpired) {
          getkeys.push(key);
        }
      }

      return Promise.resolve(getkeys);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async isExpired(key: string): Promise<boolean> {
    const newkey = this.getKey(key);
    const res = this.cacheInstance[newkey];
    const now = new Date().getTime();

    if (res && res.expire && res.expire > 0 && res.expire < now) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  public async get(key: string): Promise<any> {
    const newkey = this.getKey(key);
    const res = this.cacheInstance[newkey];
    const isExpired = await this.isExpired(key);

    if (!res || !res.value) {
      return Promise.resolve(null);
    } else if (isExpired) {
      this.remove(newkey);
      return Promise.resolve(null);
    } else if (res.value) {
      return Promise.resolve(res.value);
    }
  }

  public async gets(keys: string[]): Promise<any> {
    const res = [];

    for (const key of keys) {
      res.push(await this.get(key));
    }
    return Promise.resolve(res);
  }

  public set<T>(key: string, value: T, expire: number | Date = -1): Promise<T> {
    const newkey = this.getKey(key);
    if (utils.isDate(expire)) {
      expire = (expire as Date).getTime();
    } else if (utils.isNumber(expire) && expire > 0) {
      // expire number is second
      expire = new Date().getTime() + (expire as number) * 1000;
    }

    this.cacheInstance[newkey] = { value, expire };
    return Promise.resolve(value);
  }

  public append<T>(key: string, value: T, expire = -1): Promise<T> {
    const res = this.cacheInstance[this.getKey(key)];

    if (!res) { return this.set(key, value, expire); }

    if (utils.isArray(value) && utils.isArray(res.value)) {
      value = res.value.concat(value);
    } else if (utils.isPlainObject(value) && utils.isPlainObject(res.value)) {
      value = utils.extend(res.value, value);
    }

    expire = expire ? expire : res.expire;
    return this.set(key, value, expire);
  }

  public has(key: string): Promise<boolean> {
    const value = this.get(key);

    if (value) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  public remove(key: string): Promise<void> {
    const newkey = this.getKey(key);
    if (this.cacheInstance[newkey]) {
      this.cacheInstance[newkey] = null;
      this.cacheInstance = utils.omit(this.cacheInstance, newkey);
    }

    return Promise.resolve();
  }

  public keys(): Promise<string[]> {
    const keys = Object.keys(this.cacheInstance);
    const getKeys: string[] = [];

    for (const key of keys) {
      getKeys.push(key.replace(this.cacheConfig.name + '/', ''));
    }
    return Promise.resolve(getKeys);
  }

  public clear(): Promise<void> {
    this.cacheInstance = {};
    return Promise.resolve();
  }

  public length(): Promise<number> {
    const keys = Object.keys(this.cacheInstance);

    if (keys.length) {
      return Promise.resolve(keys.length);
    } else {
      return Promise.resolve(0);
    }
  }

  public async each<T>(iterator: (value: T, key: string, iterationNumber: number) => void): Promise<boolean> {
    const keys = Object.keys(this.cacheInstance);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i].replace(this.cacheConfig.name + '/', '');
      const val = await this.get(key);

      if (iterator) { iterator(val, key, i); }
    }

    return Promise.resolve(true);
  }

  private getKey(key: string): string {
    return this.cacheConfig.name + '/' + key;
  }
}

export default MemCache;
