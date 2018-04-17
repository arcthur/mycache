import * as localforage from 'localforage';
import * as utils from './utils';
import LZString from './LZString';

interface Config {
  driver?: string | string[];
  valueMaxLength?: number;
  name?: string;
  storeName?: string;
  isCompress?: boolean;
}

interface DataMap {
  key: string;
  value: DataValue;
}

interface DataValue {
  expire: number | null;
  now: number | null;
  value: any;
}

const DEFAULT_CONFIG: Config = {
  driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
  valueMaxLength: 1000 * 500,
  isCompress: false,
};

class Persist {
  private cacheConfig: Config;
  private cacheInstance: any;

  constructor(config: Config = {}) {
    this.cacheConfig = utils.extend(config, DEFAULT_CONFIG);
    this.cacheInstance = localforage.createInstance(this.cacheConfig);
  }

  autoClear(): Promise<boolean> {
    return this.cacheInstance.iterate((value: DataValue, key: string) => {
      Promise.all([this.isExpired(value), this.isOverLength(value)])
      .then((res: boolean[]) => {
        if (res[0] || res[1]) {
          this.remove(key);
        }
      });
    });
  }

  isExpired(value: DataValue): Promise<boolean> {
    if (value && value.expire && value.expire > 0 && value.expire < new Date().getTime()) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  async isOverLength(value: DataValue): Promise<boolean> {
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

  async get(key: string): Promise<any> {
    try {
      const res = await this.getItem(key);
      const isExpired = await this.isExpired(res);

      if (!res || !res.value) {
        return Promise.resolve(null);
      } else if (isExpired) {
        this.remove(key);
        return Promise.resolve(null);
      } else if (res.value) {
        let value = res.value;
        if (this.cacheConfig.isCompress) {
          value = JSON.parse(LZString.decompress(res.value));
        }
        // update now time
        await this.set(key, res.value, res.expire);
        return Promise.resolve(value);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async gets(keys: string[]): Promise<any> {
    let res = [];
    for (let i = 0; i < keys.length; i++) {
      res.push(await this.get(keys[i]));
    }
    return Promise.resolve(res);
  }

  async set<T>(key: string, value: T, expire: number | Date = -1): Promise<T> {
    try {
      const serialize = await this.cacheInstance.getSerializer();
      const now = new Date().getTime();

      if (utils.isDate(expire)) {
        expire = (expire as Date).getTime();
      } else if (utils.isNumber(expire) && expire > 0) {
        // expire number is second
        expire = now + (expire as number) * 1000;
      }

      const setRes = await this.setItem(key, { 
        value: this.cacheConfig.isCompress ? LZString.compress(JSON.stringify(value)) : value,
        expire,
        now,
      });

      let setVal = this.cacheConfig.isCompress ?
        JSON.parse(LZString.decompress(setRes.value as string)) : setRes.value;

      return Promise.resolve(setVal);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async append<T>(key: string, value: T, expire = -1): Promise<T> {
    let res;

    try {
      res = await this.getItem(key);
    } catch (err) {
      return Promise.reject(err);
    }

    if (!res) { return this.set(key, value, expire); }

    if (utils.isArray(value) && utils.isArray(res.value)) {
      value = res.value.concat(value);
    } else if (utils.isPlainObject(value) && utils.isPlainObject(res.value)) {
      value = utils.extend(res.value, value);
    }

    expire = expire ? expire : res.expire;
    return this.set(key, value, expire);
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);

    if (value) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  remove(key: string): Promise<void> {
    return this.cacheInstance.removeItem(key);
  }

  keys(): Promise<string[]> {
    return this.cacheInstance.keys();
  }

  clear(): Promise<void> {
    return this.cacheInstance.clear();
  }

  length(): Promise<number> {
    return this.cacheInstance.length();
  }

  async each<T>(iterator: (value: T, key: string, num: number) => void): Promise<boolean> {
    try {
      const cache: DataMap[] = [];
      await this.cacheInstance.iterate((value: DataValue, key: string, num: number) => {
        cache.push({ key, value });
      });

      const LRUMap = cache.sort((a: DataMap, b: DataMap) => (a.value.now - a.value.now));

      for (let i = 0; i < LRUMap.length; i++) {
        if (iterator) {
          iterator(LRUMap[i].value.value, LRUMap[i].key, i);
        }
      }

      return Promise.resolve(true);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private getItem(key: string): Promise<any> {
    return this.cacheInstance.getItem(key);
  }

  private async setItem<T>(key: string, value: T): Promise<T> {
    return this.cacheInstance.setItem(key, value);
  }
}

export default Persist; 