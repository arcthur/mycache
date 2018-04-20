import * as typed from './typed';
import * as utils from './utils';

class MemCache {
  private cacheConfig: typed.IMemCacheConfig;
  private cacheInstance: any;

  constructor(config: typed.IMemCacheConfig = {}) {
    this.cacheConfig = utils.extend(config, { name: 'memcache' });
    this.cacheInstance = {};
  }

  public async clearExpired(): Promise<boolean> {
    const keys = Object.keys(this.cacheInstance);

    for (const key of keys) {
      const value = this.cacheInstance[key];
      const realKey = key.replace(this.cacheConfig.name + '/', '');

      const isExpired = await this.isExpired(value);
      if (isExpired) { this.remove(realKey); }
    }

    return Promise.resolve(true);
  }

  public isExpired(value: typed.IMemCacheDataValue): Promise<boolean> {
    if (value && value.expire && value.expire > 0 && value.expire < new Date().getTime()) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  public getKey(key: string): string {
    return this.cacheConfig.name + '/' + key;
  }

  public async get(key: string): Promise<any> {
    key = this.getKey(key);
    const res = this.cacheInstance[key];
    const isExpired = await this.isExpired(res);

    if (!res || !res.value) {
      return Promise.resolve(null);
    } else if (isExpired) {
      this.remove(key);
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
    key = this.getKey(key);
    if (utils.isDate(expire)) {
      expire = (expire as Date).getTime();
    } else if (utils.isNumber(expire) && expire > 0) {
      // expire number is second
      expire = new Date().getTime() + (expire as number) * 1000;
    }

    this.cacheInstance[key] = { value, expire };
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
    key = this.getKey(key);
    if (this.cacheInstance[key]) {
      this.cacheInstance[key] = null;
      this.cacheInstance = utils.omit(this.cacheInstance, key);
    }

    return Promise.resolve();
  }

  public keys(): Promise<string[]> {
    return Promise.resolve(Object.keys(this.cacheInstance));
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
}

export default MemCache;
