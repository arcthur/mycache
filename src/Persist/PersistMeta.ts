import * as localForage from 'localforage';
import * as utils from '../Utils/utils';

interface IPersistMetaConfig {
  name?: string;
}

const DEFAULT_CONFIG: IPersistMetaConfig = {
  name: 'persistMeta',
};

class PersistMeta {
  private cacheConfig: IPersistMetaConfig;
  private cacheInstance: LocalForage;

  constructor(config: IPersistMetaConfig = {}) {
    this.cacheConfig = utils.extend(DEFAULT_CONFIG, config);

    this.cacheInstance = localForage.createInstance({
      driver: localForage.LOCALSTORAGE,
      name: this.cacheConfig.name,
    });
  }

  public get(key: string): Promise<any> {
    return this.cacheInstance.getItem(key);
  }

  public set<T>(key: string, value: T): Promise<T> {
    return this.cacheInstance.setItem(key, value);
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
}

export default PersistMeta;
