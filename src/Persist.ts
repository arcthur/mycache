import * as localforage from 'localforage';
import LZString from './LZString';
import * as utils from './utils';

export interface IConfig {
  driver?: string | string[];
  valueMaxLength?: number;
  name?: string;
  storeName?: string;
  isCompress?: boolean;
}

export interface IDataMap {
  key: string;
  value: IDataValue;
}

export interface IDataValue {
  expire: number | null;
  now: number | null;
  value: any;
}

const DEFAULT_CONFIG: IConfig = {
  driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
  isCompress: false,
  valueMaxLength: 500 * 1024,
};

class Persist {
  private cacheConfig: IConfig;
  private cacheInstance: any;

  constructor(config: IConfig = {}) {
    this.cacheConfig = utils.extend(config, DEFAULT_CONFIG);
    this.cacheInstance = localforage.createInstance(this.cacheConfig);
  }

  public clearExpired(): Promise<boolean> {
    return this.cacheInstance.iterate((value: IDataValue, key: string) => {
      this.isExpired(value).then((res: boolean) => {
        if (res) { this.remove(key); }
      });
    });
  }

  public isExpired(value: IDataValue): Promise<boolean> {
    if (value && value.expire && value.expire > 0 && value.expire < new Date().getTime()) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  public async isOverLength(value: IDataValue): Promise<boolean> {
    const valueMaxLength = this.cacheConfig.valueMaxLength;
    const serialize = await this.cacheInstance.getSerializer();

    return new Promise<boolean>((resolve, reject) => {
      serialize.serialize(value, (res: any, err: any) => {
        if (err) { reject(err); }
        resolve(res.lenth > (valueMaxLength || 0));
      });
    });
  }

  public dropInstance(config: IConfig = {}): Promise<void> {
    return this.cacheInstance.dropInstance(config);
  }

  public async get(key: string): Promise<any> {
    try {
      const res = await this.getItem(key);
      const isExpired = await this.isExpired(res);

      if (isExpired) {
        this.remove(key);
        return Promise.resolve(null);
      }

      if (!res || (res && !res.value)) {
        return Promise.resolve(null);
      }

      if (res.value && res.expire) {
        let value = res.value;
        if (this.cacheConfig.isCompress) {
          value = JSON.parse(LZString.decompress(res.value));
        }
        // update now time
        await this.set(key, res.value, res.expire);
        return Promise.resolve(value);
      }

      // If don't mycache init, return value directly
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async gets(keys: string[]): Promise<any> {
    try {
      const res = [];

      for (const key of keys) {
        res.push(await this.get(key));
      }

      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async set<T>(key: string, value: T, expire: number | Date = -1): Promise<T> {
    try {
      const res = await this.getItem(key);

      // If don't mycache init, return value directly
      if (res && !res.value && !res.expire) {
        this.setItem(key, value);
        return Promise.resolve(value);
      }

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

      const setVal = this.cacheConfig.isCompress ?
        JSON.parse(LZString.decompress(setRes.value as string)) : setRes.value;

      return Promise.resolve(setVal);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async append<T>(key: string, value: T, expire = -1): Promise<T> {
    try {
      let res;
      res = await this.getItem(key);
      if (!res) { return this.set(key, value, expire); }

      if (utils.isArray(value) && utils.isArray(res.value)) {
        value = res.value.concat(value);
      } else if (utils.isPlainObject(value) && utils.isPlainObject(res.value)) {
        value = utils.extend(res.value, value);
      }

      expire = expire ? expire : res.expire;
      return this.set(key, value, expire);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async has(key: string): Promise<boolean> {
    try {
      const value = await this.get(key);

      if (value) {
        return Promise.resolve(true);
      } else {
        return Promise.resolve(false);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public remove(key: string): Promise<void> {
    return this.cacheInstance.removeItem(key);
  }

  public keys(): Promise<string[]> {
    return this.cacheInstance.keys();
  }

  public clear(): Promise<void> {
    return this.cacheInstance.clear();
  }

  public length(): Promise<number> {
    return this.cacheInstance.length();
  }

  public async each<T>(iterator: (value: T, key: string, num: number) => void): Promise<boolean> {
    try {
      const cache: IDataMap[] = [];
      await this.cacheInstance.iterate((value: IDataValue, key: string, num: number) => {
        cache.push({ key, value });
      });

      const LRUMap = cache.sort((a: IDataMap, b: IDataMap) => (a.value.now - a.value.now));

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
