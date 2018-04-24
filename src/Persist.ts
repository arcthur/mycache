import * as localforage from 'localforage';
import LZString from './LZString';
import * as typed from './typed';
import * as utils from './utils';

const DEFAULT_CONFIG: typed.IPersistConfig = {
  driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
  name: 'persist',
  isCompress: false,
  valueMaxLength: 20 * 1024,
  oldItemsCount: 0.2,
};

interface ITempCache {
  count: number;
  items: typed.IPersistDataMap;
}

class Persist {
  private cacheConfig: typed.IPersistConfig;
  private cacheInstance: any;

  constructor(config: typed.IPersistConfig = {}) {
    this.cacheConfig = utils.extend(DEFAULT_CONFIG, config);
    this.cacheInstance = localforage.createInstance(this.cacheConfig);
  }

  public dropInstance(config: typed.IPersistConfig = {}): Promise<void> {
    return this.cacheInstance.dropInstance(config);
  }

  public async getOldKeys(): Promise<string[]> {
    try {
      const length = await this.length();
      const oldItemsCount = this.cacheConfig.oldItemsCount;
      const oldCount = oldItemsCount < 1 ?
        Math.floor(length * oldItemsCount) : Math.floor(oldItemsCount);

      const getkeys: string[] = [];
      const cacheSorted = await this.getSortedItems();
      const sortedCache = cacheSorted.reverse();

      for (let i = 0; i < sortedCache.length; i++) {
        const value = sortedCache[i];

        if (i < oldCount) {
          getkeys.push(value.key);
        }
      }

      return Promise.resolve(getkeys);
    } catch (err) {
      return Promise.reject(err);
    }
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

  public async getOverLengthKeys(): Promise<string[]> {
    try {
      const getkeys: string[] = [];
      const keys = await this.keys();

      for (const key of keys) {
        const isOverLength = await this.isOverLength(key);
        if (isOverLength) {
          getkeys.push(key);
        }
      }

      return Promise.resolve(getkeys);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async isOverLength(key: string): Promise<boolean> {
    try {
      const res = await this.getItem(key);
      const valueMaxLength = this.cacheConfig.valueMaxLength;

      if (res && res.length && res.length > valueMaxLength) {
        return Promise.resolve(true);
      } else {
        return Promise.resolve(false);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async isExpired(key: string): Promise<boolean> {
    try {
      const res = await this.getItem(key);
      const now = new Date().getTime();
      if (res && res.expire && res.expire > 0 && res.expire < now) {
        return Promise.resolve(true);
      } else {
        return Promise.resolve(false);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async get(key: string): Promise<any> {
    try {
      const res = await this.getItem(key);
      const isExpired = await this.isExpired(key);

      if (isExpired) {
        this.remove(key);
        return Promise.resolve(null);
      }

      if (!res || (res && !res.value)) {
        return Promise.resolve(null);
      }

      if (res.value && res.expire) {
        const value = this.cacheConfig.isCompress ?
          JSON.parse(LZString.decompressFromUTF16(res.value)) : JSON.parse(res.value);

        // update queue info
        this.set(key, res.value, res.expire);
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
      const now = new Date().getTime();

      // If don't use mycache init, return value directly
      if (res && !res.value && !res.expire) {
        return this.setItem(key, value);
      }

      let setRes;
      let setVal;

      if (res && res.value === value && res.expire === expire) {
        setRes = await this.setItem(key, { ...res, now, count: ++res.count });
        setVal = this.cacheConfig.isCompress ?
          JSON.parse(LZString.decompressFromUTF16(setRes.value as string)) : setRes.value;
        return Promise.resolve(setVal);
      }

      let expireTime;
      if (utils.isDate(expire)) {
        expireTime = (expire as Date).getTime();
      } else if (utils.isNumber(expire) && expire > 0) {
        // expire number is second
        expireTime = now + (expire as number) * 1000;
      } else {
        expireTime = -1;
      }

      let realValue: any;
      const stringifyValue = JSON.stringify(value);
      if (res && value === res.value) {
        realValue = value;
      } else if (this.cacheConfig.isCompress) {
        realValue = LZString.compressToUTF16(stringifyValue);
      } else {
        realValue = stringifyValue;
      }

      setRes = await this.setItem(key, {
        now,
        count: res && res.count ? ++res.count : 0,
        length: utils.utf16ByteLength(realValue),
        value: realValue,
        expire: expireTime,
      });

      setVal = this.cacheConfig.isCompress ?
        JSON.parse(LZString.decompressFromUTF16(setRes.value as string)) : setRes.value;

      return Promise.resolve(setVal);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async append<T>(key: string, value: T, expire = -1): Promise<T> {
    try {
      const res = await this.getItem(key);
      if (!res) { return this.set(key, value, expire); }

      const realValue = this.cacheConfig.isCompress ?
        JSON.parse(LZString.decompressFromUTF16(res.value)) : JSON.parse(res.value);

      if (utils.isArray(value) && utils.isArray(realValue)) {
        value = (realValue as any).concat(value);
      } else if (utils.isPlainObject(value) && utils.isPlainObject(realValue)) {
        value = utils.extend(realValue, value);
      }

      expire = expire ? expire : res.expire;
      return this.set(key, value, expire);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async has(key: string): Promise<boolean> {
    try {
      const res = await this.get(key);

      if (res) {
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

  public clear(): Promise<void> {
    return this.cacheInstance.clear();
  }

  public keys(): Promise<string[]> {
    return this.cacheInstance.keys();
  }

  public length(): Promise<number> {
    return this.cacheInstance.length();
  }

  public async each(iterator: (value: any, key: string, num: number) => void): Promise<boolean> {
    try {
      const cache = await this.keys();

      for (let i = 0; i < cache.length; i++) {
        const key = cache[i];
        const value = await this.get(key);

        if (iterator) {
          await iterator(value, key, i);
        }
      }

      return Promise.resolve(true);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async getSortedItems(): Promise<typed.IPersistDataMap[]> {
    try {
      const keys = await this.keys();

      const cache: typed.IPersistDataMap[] = [];
      for (const key of keys) {
        const value = await this.getItem(key);
        cache.push({ ...value, key });
      }

      const countGroup: any = {};
      for (const item of cache) {
        if (!countGroup[item.count]) { countGroup[item.count] = []; }
        countGroup[item.count].push(item);
      }

      let sortCountSet: ITempCache[] = [];
      for (const i in countGroup) {
        if (countGroup.hasOwnProperty(i)) {
          // sort by now desc
          sortCountSet.push({
            count: parseInt(i, 10),
            items: countGroup[i].sort(
              (a: typed.IPersistDataMap, b: typed.IPersistDataMap) => b.now - a.now),
          });
        }
      }

      // sort by count desc
      sortCountSet = sortCountSet.sort((a: ITempCache, b: ITempCache) => b.count - a.count);

      let finalCache: typed.IPersistDataMap[] = [];
      for (const res of sortCountSet) {
        finalCache = finalCache.concat(res.items);
      }

      return Promise.resolve(finalCache);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private getItem(key: string): Promise<any> {
    return this.cacheInstance.getItem(key);
  }

  private setItem<T>(key: string, value: T): Promise<T> {
    return this.cacheInstance.setItem(key, value);
  }
}

export default Persist;
