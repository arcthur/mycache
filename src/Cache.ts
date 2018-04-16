import * as utils from './utils';

interface Config {
  name?: string;
}

interface Data {
  expire: number | null;
  value: any;
}

class Cache {
  private cacheConfig: Config;
  private cacheInstance: any;

  constructor(config: Config = {}) {
    this.cacheConfig = utils.extend(config, { name: 'memcache' });
    this.cacheInstance = {};
  }

  async clearExpires(): Promise<boolean> {
    const keys = Object.keys(this.cacheInstance);

    keys.forEach(async (res, num) => {
      const value = this.cacheInstance[res];
      const key = res.replace(this.cacheConfig.name + '/', '');

      const isExpired = await this.isExpired(value);
      if (isExpired) {
        this.removeItem(key);
      }
    });

    return Promise.resolve(true);
  }

  isExpired(value: Data): Promise<boolean> {
    if (value && value.expire && value.expire > 0 && value.expire < new Date().getTime()) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  getKey(key: string): string {
    return this.cacheConfig.name + '/' + key;
  }

  async getItem(key: string): Promise<any> {
    key = this.getKey(key);
    const res = this.cacheInstance[key];
    const isExpired = await this.isExpired(res);

    if (!res || !res.value) {
      return Promise.resolve(null);
    } else if (isExpired) {
      this.removeItem(key);
      return Promise.resolve(null);
    } else if (res.value) {
      return Promise.resolve(res.value);
    }
  }

  setItem<T>(key: string, value: T, expire: number | Date = -1): Promise<T> {
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

  appendItem<T>(key: string, value: T, expire = -1): Promise<T> {
    const res = this.cacheInstance[this.getKey(key)];

    if (!res) { return this.setItem(key, value, expire); }

    if (utils.isArray(value) && utils.isArray(res.value)) {
      value = res.value.concat(value);
    } else if (utils.isPlainObject(value) && utils.isPlainObject(res.value)) {
      value = utils.extend(res.value, value);
    }
 
    expire = expire ? expire : res.expire;
    return this.setItem(key, value, expire);
  }

  removeItem(key: string): Promise<void> {
    key = this.getKey(key);
    if (this.cacheInstance[key]) {
      this.cacheInstance[key] = null;
      this.cacheInstance = utils.omit(this.cacheInstance, key);
    }

    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.cacheInstance = {};
    return Promise.resolve();
  }

  length(): Promise<number> {
    const keys = Object.keys(this.cacheInstance);

    if (keys.length) {
      return Promise.resolve(keys.length);
    } else {
      return Promise.resolve(0);
    }
  }

  async iterate<T, U>(iterator: (value: T, key: string, iterationNumber: number) => U, 
    cb: (err: any, result: U) => void = null): Promise<U> {
    const keys = Object.keys(this.cacheInstance);

    const lastRes: U = keys.length > 0 ? this.cacheInstance[keys[keys.length - 1]]['value'] : null;

    keys.forEach(async (res, num) => {
      res = res.replace(this.cacheConfig.name + '/', '');
      const val = await this.getItem(res);
      iterator(val, res, num);
    });

    if (cb) { cb(null, lastRes); }

    return Promise.resolve(lastRes);
  }
}

export default Cache;