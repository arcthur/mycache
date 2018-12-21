// Type definitions for Mycache
// Project: Mycache
// Definitions by:
// Arcthur https://github.com/arcthur

export as namespace mycache;

export interface IMycacheConfig {
  driver?: string | string[];
  valueMaxLength?: number;
  oldItemsCount?: number;
  name?: string;
  storeName?: string;
  isCompress?: boolean;
}

export interface IMycacheMetaDataMap {
  key: string;
  expire?: number;
  length?: number;
  now?: number;
  count?: number;
}

export interface IMycacheDataMapValue {
  key: string;
  expire?: number;
  length?: number;
  now?: number;
  value?: any;
  count?: number;
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
  getOldKeys(): Promise<string[]>;
  getSortedItems(): Promise<IMycacheMetaDataMap[]>;
}
