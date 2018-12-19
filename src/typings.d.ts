// Type definitions for Mycache
// Project: Mycache
// Definitions by:
// Arcthur https://github.com/arcthur

export as namespace mycache;

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

export interface Mycache {
  get(key: string, currentTime?: number): Promise<any>;
  gets(): Promise<any>;
  set<T>(key: string, value: T, expire?: number | Date): Promise<T>;
  append<T>(key: string, value: T, expire?: number | Date): Promise<T>;
  has(key: string): Promise<boolean>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
  length(): Promise<number>;
  each(
    iterator: (value: any, key: string, iterationNumber: number) => void
  ): Promise<boolean>;
  isExpired(key: string, currentTime?: number): Promise<boolean>;
  getExpiredKeys(): Promise<string[]>;
  isOverLength(key: string): Promise<boolean>;
  getOverLengthKeys(): Promise<string[]>;
  getOldKeys(): Promise<string[]>;
  getSortedItems(): Promise<IPersistMetaDataMap[]>;
}
