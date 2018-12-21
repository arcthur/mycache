// import * as localForage from 'localforage';
import { StorageStore } from './StorageStore';
import * as typed from './typings';
import * as utils from './Utils/utils';

const DEFAULT_CONFIG: typed.IMycacheConfig = {
  oldItemsCount: 0.2,
};

interface ITempCache {
  count: number;
  items: typed.IMycacheMetaDataMap;
}

class Mycache {
  private cacheConfig: typed.IMycacheConfig;
  private cacheInstance: StorageStore;

  constructor(config: typed.IMycacheConfig = {}) {
    this.cacheConfig = utils.extend(DEFAULT_CONFIG, config);

    const stores = ['indexedDB', 'localStorage'];
    this.cacheInstance = new StorageStore(stores, {
      prefix: this.cacheConfig.name,
    });
  }

  public async getOldKeys(): Promise<string[]> {
    try {
      const length = await this.length();
      const oldItemsCount = this.cacheConfig.oldItemsCount;
      const oldCount =
        oldItemsCount < 1
          ? Math.floor(length * oldItemsCount)
          : Math.floor(oldItemsCount);

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

  public async isExpired(
    key: string,
    currentTime: number = new Date().getTime()
  ): Promise<boolean> {
    try {
      const res = await this.get(key);

      if (res && res.expire) {
        return Promise.resolve(this.expiredVaule(res.expire, currentTime));
      } else {
        return Promise.resolve(false);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async get(
    key: string,
    currentTime: number = new Date().getTime()
  ): Promise<any> {
    try {
      const res: typed.IMycacheDataMapValue = await this.cacheInstance.get(key);

      if (!res) {
        return Promise.resolve(null);
      }

      if (
        res.expire !== undefined &&
        res.now !== undefined &&
        res.count !== undefined
      ) {
        const isExpired = this.expiredVaule(res.expire, currentTime);

        if (isExpired) {
          await this.remove(key);
          return Promise.resolve(null);
        }

        return Promise.resolve(res.value);
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

  public async set<T>(
    key: string,
    value: T,
    expire: number | Date = -1
  ): Promise<T> {
    try {
      const res = await this.get(key);

      // If don't use mycache init, return value directly
      if (res && !res.expire && !res.count && !res.now) {
        return this.cacheInstance.set(key, value);
      }

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

      let realValue;
      if (value) {
        realValue = {
          value,
          now,
          count,
          expire: expireTime,
        };
      } else {
        realValue = {
          ...res,
          now,
          count,
        };
      }

      return this.cacheInstance.set(key, realValue);
    } catch (err) {
      if (err.name.toUpperCase().indexOf('QUOTA') >= 0) {
        await this.clearKeys();
        return Promise.resolve(null);
      }

      return Promise.reject(err);
    }
  }

  public async append<T>(
    key: string,
    value: T,
    expire: number | Date = -1
  ): Promise<T> {
    try {
      const res = await this.get(key);

      if (!res) {
        return this.set(key, value, expire);
      }

      expire = expire ? expire : res.expire;

      if (utils.isArray(value) && utils.isArray(res)) {
        value = (res as any).concat(value);
      } else if (utils.isPlainObject(value) && utils.isPlainObject(res)) {
        value = utils.extend(res, value);
      }

      return this.set(key, value, expire);
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

  public async remove(key: string): Promise<void> {
    try {
      await this.cacheInstance.remove(key);

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async clear(): Promise<void> {
    try {
      await this.cacheInstance.clear();

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public keys(): Promise<string[]> {
    return this.cacheInstance.keys();
  }

  public length(): Promise<number> {
    return this.cacheInstance.length();
  }

  public async each(
    iterator: (value: any, key: string, num: number) => void
  ): Promise<boolean> {
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

  public async getSortedItems(): Promise<typed.IMycacheMetaDataMap[]> {
    try {
      const keys = await this.keys();

      const cache: typed.IMycacheMetaDataMap[] = [];
      for (const key of keys) {
        const value = await this.get(key);
        cache.push({ ...value, key });
      }

      const countGroup: any = {};
      for (const item of cache) {
        if (!countGroup[item.count]) {
          countGroup[item.count] = [];
        }
        countGroup[item.count].push(item);
      }

      let sortCountSet: ITempCache[] = [];
      for (const i in countGroup) {
        if (countGroup.hasOwnProperty(i)) {
          // sort by now desc
          sortCountSet.push({
            count: parseInt(i, 10),
            items: countGroup[i].sort(
              (a: typed.IMycacheMetaDataMap, b: typed.IMycacheMetaDataMap) =>
                b.now - a.now
            ),
          });
        }
      }

      // sort by count desc
      sortCountSet = sortCountSet.sort(
        (a: ITempCache, b: ITempCache) => b.count - a.count
      );

      let finalCache: typed.IMycacheMetaDataMap[] = [];
      for (const res of sortCountSet) {
        finalCache = finalCache.concat(res.items);
      }

      return Promise.resolve(finalCache);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private expiredVaule(expire: number, currentTime: number): boolean {
    return expire && expire > 0 && expire < currentTime;
  }

  private async clearKeys(): Promise<boolean> {
    try {
      let keys = await this.getExpiredKeys();
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

module.exports = Mycache;
