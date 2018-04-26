import * as localforage from 'localforage';
import * as utils from '../Utils/utils';

interface IPersistValueConfig {
  name?: string;
}

const DEFAULT_CONFIG: IPersistValueConfig = {
  name: 'persistValue',
};

class PersistValue {
  private cacheConfig: IPersistValueConfig;
  private cacheInstance: any;

  constructor(config: IPersistValueConfig = {}) {
    this.cacheConfig = utils.extend(DEFAULT_CONFIG, config);

    this.cacheInstance = localforage.createInstance({
      driver: localforage.INDEXEDDB,
      name: this.cacheConfig.name,
      storeName: 'store' + this.cacheConfig.name,
    });
  }

  public get(key: string): Promise<any> {
    return this.cacheInstance.getItem(key);
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

  public set<T>(key: string, value: T): Promise<T> {
    return this.cacheInstance.setItem(key, value);
  }

  public async append<T>(key: string, value: T): Promise<T> {
    try {
      const res = await this.cacheInstance.getItem(key);
      if (!res) { return this.set(key, value); }

      if (utils.isArray(value) && utils.isArray(res)) {
        value = (res as any).concat(value);
      } else if (utils.isPlainObject(value) && utils.isPlainObject(res)) {
        value = utils.extend(res, value);
      }

      return this.set(key, value);
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
}

export default PersistValue;
