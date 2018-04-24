export interface IPersistConfig {
  driver?: string | string[];
  valueMaxLength?: number;
  oldItemsCount?: number;
  name?: string;
  storeName?: string;
  isCompress?: boolean;
}

export interface IPersistDataMap {
  key: string;
  expire?: number | null;
  value?: any;
  length?: number;
  now?: number;
  count?: number;
}

export interface IPersistDataMapValue {
  expire?: number | null;
  value?: any;
  length?: number;
  now?: number;
  count?: number;
}

export interface IMemCacheConfig {
  name?: string;
}

export interface IMemCacheDataValue {
  expire?: number | null;
  value?: any;
}
