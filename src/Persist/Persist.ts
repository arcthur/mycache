import * as localforage from 'localforage';
import * as typed from '../typed';
import LZString from '../Utils/LZString';
import * as utils from '../Utils/utils';
import PersistMeta from './PersistMeta';
import PersistValue from './PersistValue';

const DEFAULT_CONFIG: typed.IPersistConfig = {
  name: 'persist',
  isCompress: false,
  valueMaxLength: 20 * 1024,
  oldItemsCount: 0.2,
};

interface ITempCache {
  count: number;
  items: typed.IPersistMetaDataMap;
}

class Persist {
  private cacheConfig: typed.IPersistConfig;
  private metaCacheInstance: PersistMeta;
  private valueCacheInstance: PersistValue;

  constructor(config: typed.IPersistConfig = {}) {
    this.cacheConfig = utils.extend(DEFAULT_CONFIG, config);

    this.metaCacheInstance = new PersistMeta({
      name: this.cacheConfig.name,
    });

    this.valueCacheInstance = new PersistValue({
      name: this.cacheConfig.name,
    });
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
      const res = await this.getMeta(key);
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
      const res = await this.getMeta(key);

      if (res && res.expire) {
        return Promise.resolve(this.expiredVaule(res.expire));
      } else {
        return Promise.resolve(false);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async get(key: string): Promise<any> {
    try {
      const res = await this.getMeta(key);

      if (!res) { return Promise.resolve(null); }

      if (res.length !== undefined &&
          res.expire !== undefined &&
          res.now !== undefined &&
          res.count !== undefined) {
        const isExpired = this.expiredVaule(res.expire);

        if (isExpired) {
          this.remove(key);
          return Promise.resolve(null);
        }

        const newValue = await this.valueCacheInstance.get(key);
        // update meta info
        await this.setMeta(key);

        return Promise.resolve(newValue);
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

  public async set(key: string, value: any, expire: number | Date = -1): Promise<any> {
    try {
      const res = await this.getMeta(key);

      // If don't use mycache init, return value directly
      if (res && !res.length && !res.expire && !res.count && !res.now) {
        return this.metaCacheInstance.set(key, value);
      }

      await this.setMeta(key, value, expire);
      return this.valueCacheInstance.set(key, value);
    } catch (err) {
      if (err.name.toUpperCase().indexOf('QUOTA') >= 0) {
        await this.clearKeys();
        return Promise.resolve(null);
      }

      return Promise.reject(err);
    }
  }

  public async append(key: string, value: any, expire: number | Date = -1): Promise<any> {
    try {
      const res = await this.getMeta(key);

      if (!res) { return this.set(key, value, expire); }

      expire = expire ? expire : res.expire;

      const newValue = this.valueCacheInstance.append(key, value);
      await this.setMeta(key, newValue, expire);

      return Promise.resolve(newValue);
    } catch (err) {
      if (err.name.toUpperCase().indexOf('QUOTA') >= 0) {
        await this.clearKeys();
        return Promise.resolve(null);
      }

      return Promise.reject(err);
    }
  }

  public async has(key: string): Promise<boolean> {
    try {
      const res = await this.getMeta(key);

      if (res) {
        return Promise.resolve(true);
      } else {
        return Promise.resolve(false);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async remove(key: string): Promise<void> {
    try {
      await this.metaCacheInstance.remove(key);
      await this.valueCacheInstance.remove(key);

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async clear(): Promise<void> {
    try {
      await this.metaCacheInstance.clear();
      await this.valueCacheInstance.clear();

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public keys(): Promise<string[]> {
    return this.metaCacheInstance.keys();
  }

  public length(): Promise<number> {
    return this.metaCacheInstance.length();
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

  public async getSortedItems(): Promise<typed.IPersistMetaDataMap[]> {
    try {
      const keys = await this.keys();

      const cache: typed.IPersistMetaDataMap[] = [];
      for (const key of keys) {
        const value = await this.getMeta(key);
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
              (a: typed.IPersistMetaDataMap, b: typed.IPersistMetaDataMap) => b.now - a.now),
          });
        }
      }

      // sort by count desc
      sortCountSet = sortCountSet.sort((a: ITempCache, b: ITempCache) => b.count - a.count);

      let finalCache: typed.IPersistMetaDataMap[] = [];
      for (const res of sortCountSet) {
        finalCache = finalCache.concat(res.items);
      }

      return Promise.resolve(finalCache);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private expiredVaule(expire: number): boolean {
    const now = new Date().getTime();
    return expire && expire > 0 && expire < now;
  }

  private async setMeta(key: string, value: any = '', expire: number | Date = -1): Promise<string> {
    try {
      const res = await this.getMeta(key);
      const now = new Date().getTime();

      let expireTime;
      if (utils.isDate(expire)) {
        expireTime = (expire as Date).getTime();
      } else if (utils.isNumber(expire) && expire > 0) {
        // expire number is second
        expireTime = now + (expire as number) * 1000;
      } else {
        expireTime = -1;
      }

      let count = 0;
      if (res && res.count !== undefined) {
        count = res.count + 1;
      }

      let metaValue;
      if (value) {
        metaValue = {
          length: utils.utf16ByteLength(JSON.stringify(value)),
          now,
          count,
          expire: expireTime,
        };
      } else {
        metaValue = {
          ...res,
          now,
          count,
        };
      }

      const realValue = this.cacheConfig.isCompress ?
        LZString.compressToUTF16(JSON.stringify(metaValue)) : JSON.stringify(metaValue);

      return this.metaCacheInstance.set(key, realValue);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private async getMeta(key: string): Promise<any> {
    try {
      const res = await this.metaCacheInstance.get(key);

      let value = null;
      if (res !== undefined && res !== null) {
        value = this.cacheConfig.isCompress ?
          JSON.parse(LZString.decompressFromUTF16(res)) : JSON.parse(res);
      }

      return Promise.resolve(value);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private async clearKeys(): Promise<boolean> {
    try {
      let keys = await this.getExpiredKeys();
      keys.concat(await this.getOverLengthKeys());
      keys.concat(await this.getOldKeys());

      keys = keys.sort().filter((item, index, array) => {
        return !index || item !== array[index - 1];
      });

      for (const key of keys) {
        await this.remove(key);
      }

      return Promise.resolve(true);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

export default Persist;
