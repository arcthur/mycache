import * as utils from './utils';

interface Config {
  name?: string;
}

interface DataValue {
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

  async autoClear(): Promise<boolean> {
    const keys = Object.keys(this.cacheInstance);

    keys.forEach(async (res, num) => {
      const value = this.cacheInstance[res];
      const key = res.replace(this.cacheConfig.name + '/', '');

      const isExpired = await this.isExpired(value);
      if (isExpired) {
        this.remove(key);
      }
    });

    return Promise.resolve(true);
  }

  isExpired(value: DataValue): Promise<boolean> {
    if (value && value.expire && value.expire > 0 && value.expire < new Date().getTime()) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  getKey(key: string): string {
    return this.cacheConfig.name + '/' + key;
  }

  async get(key: string): Promise<any> {
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
  
  async gets(keys: string[]): Promise<any> {
    let res = [];
    for (let i = 0; i < keys.length; i++) {
      res.push(await this.get(keys[i]));
    }
    return Promise.resolve(res);
  }

  set<T>(key: string, value: T, expire: number | Date = -1): Promise<T> {
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

  append<T>(key: string, value: T, expire = -1): Promise<T> {
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

  has(key: string): Promise<boolean> {
    const value = this.get(key);

    if (value) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  remove(key: string): Promise<void> {
    key = this.getKey(key);
    if (this.cacheInstance[key]) {
      this.cacheInstance[key] = null;
      this.cacheInstance = utils.omit(this.cacheInstance, key);
    }

    return Promise.resolve();
  }

  keys(): Promise<string[]> {
    return Promise.resolve(Object.keys(this.cacheInstance));
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

  async each<T>(iterator: (value: T, key: string, iterationNumber: number) => void): Promise<boolean> {
    const keys = Object.keys(this.cacheInstance);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i].replace(this.cacheConfig.name + '/', '');
      const val = await this.get(key);

      if (iterator) { iterator(val, key, i); }
    }

    return Promise.resolve(true);
  }
}

export default Cache;