import * as localforage from 'localforage';
import * as utils from '../Utils/utils';

interface IPersistMetaConfig {
  name?: string;
}

const DEFAULT_CONFIG: IPersistMetaConfig = {
  name: 'persistMeta',
};

class PersistMeta {
  private cacheConfig: IPersistMetaConfig;
  private cacheInstance: any;

  constructor(config: IPersistMetaConfig = {}) {
    this.cacheConfig = utils.extend(DEFAULT_CONFIG, config);

    this.cacheInstance = localforage.createInstance({
      driver: localforage.LOCALSTORAGE,
      name: this.cacheConfig.name,
    });
  }

  public get(key: string): Promise<any> {
    return this.cacheInstance.getItem(key);
  }

  public set(key: string, value: string): Promise<string> {
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
