export interface IPersistConfig {
  driver?: string | string[];
  valueMaxLength?: number;
  oldItemsRatio?: number;
  name?: string;
  storeName?: string;
  isCompress?: boolean;
}

export interface IPersistDataMap {
  key: string;
  value: IPersistDataMapValue;
}

export interface IPersistDataMapValue {
  expire: number | null;
  now: number | null;
  value: any;
}

export interface IMemCacheConfig {
  name?: string;
}

export interface IMemCacheDataValue {
  expire: number | null;
  value: any;
}
