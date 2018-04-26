export interface IPersistConfig {
  driver?: string | string[];
  valueMaxLength?: number;
  oldItemsCount?: number;
  name?: string;
  storeName?: string;
  isCompress?: boolean;
}

export interface IPersistMetaDataMap {
  key: string;
  expire?: number;
  length?: number;
  now?: number;
  count?: number;
}

export interface IPersistMetaDataMapValue {
  expire?: number;
  length?: number;
  now?: number;
  count?: number;
}

export interface IPersistValueDataMap {
  key: string;
  value?: any;
}

export interface IPersistValueDataMapValue {
  value?: any;
}

export interface IMemCacheConfig {
  name?: string;
}

export interface IMemCacheDataValue {
  expire?: number | null;
  value?: any;
}
