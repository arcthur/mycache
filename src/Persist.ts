import * as localforage from 'localforage';
import * as utils from './utils';

interface Config {
  driver?: string | string[];
  valueMaxLength?: number;
  autoClearExpires?: boolean;
  name?: string;
  storeName?: string;
}

interface Data {
  expire: number | null;
  value: any;
}

const DEFAULT_CONFIG: Config = {
  driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
  valueMaxLength: 1000 * 500,
  autoClearExpires: false,
};

class Persist {
  private cacheConfig: Config;
  private cacheInstance: any;

  constructor(config: Config = {}) {
    this.cacheConfig = utils.extend(config, DEFAULT_CONFIG);
    this.cacheInstance = localforage.createInstance(this.cacheConfig);

    if (this.cacheConfig.autoClearExpires) {
      window.onbeforeunload = (e) => {
        this.clearExpires();
      };
    }
  }

  clearExpires(): Promise<boolean> {
    return this.cacheInstance.iterate((value: Data, key: string) => {
      Promise.all([this.isExpired(value), this.isOverLength(value)])
      .then((res: boolean[]) => {
        if (res[0] || res[1]) {
          this.cacheInstance.removeItem(key);
        }
      });
    });
  }

  isExpired(value: Data): Promise<boolean> {
    if (value && value.expire && value.expire > 0 && value.expire < new Date().getTime()) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  async isOverLength(value: Data): Promise<boolean> {
    const valueMaxLength = this.cacheConfig.valueMaxLength;
    const serialize = await this.cacheInstance.getSerializer();

    return new Promise<boolean>((resolve, reject) => {
      serialize.serialize(value, (res: any, err: any) => {
        if (err) { reject(err); }
        resolve(res.lenth > (valueMaxLength || 0));
      });
    });
  }

  dropInstance(config: Config = {}): Promise<void> {
    return this.cacheInstance.dropInstance(config);
  }

  async getItem(key: string): Promise<any> {
    try {
      const res = await this.cacheInstance.getItem(key);
      const isExpired = await this.isExpired(res);

      if (!res || !res.value) {
        return Promise.resolve(null);
      } else if (isExpired) {
        this.cacheInstance.removeItem(key);
        return Promise.resolve(null);
      } else if (res.value) {
        return Promise.resolve(res.value);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async setItem<T>(key: string, value: T, expire: number | Date = -1): Promise<T> {
    if (utils.isDate(expire)) {
      expire = (expire as Date).getTime();
    } else if (utils.isNumber(expire) && expire > 0) {
      // expire number is second
      expire = new Date().getTime() + (expire as number) * 1000;
    }

    return this.cacheInstance.setItem(key, { value, expire });
  }

  async appendItem<T>(key: string, value: T, expire = -1): Promise<T> {
    let res;

    try {
      res = await this.cacheInstance.getItem(key);
    } catch (err) {
      return Promise.reject(err);
    }

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
    return this.cacheInstance.removeItem(key);
  }

  clear(): Promise<void> {
    return this.cacheInstance.clear();
  }

  length(): Promise<number> {
    return this.cacheInstance.length();
  }

  iterate<T, U>(iterator: (value: T, key: string, iterationNumber: number) => U, 
    cb: (err: any, result: U) => void = null): Promise<U> {
    return this.cacheInstance.iterate(iterator, cb);
  }
}

export default Persist; 