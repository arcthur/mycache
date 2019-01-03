interface IDBObjectStoreExtends extends IDBObjectStore {
  openKeyCursor(
    range?: IDBKeyRange | IDBValidKey,
    direction?: IDBCursorDirection
  ): IDBRequest;
}

export class IDB {
  public dbp: Promise<IDBDatabase>;

  constructor(dbName = 'keyval-store', readonly storeName = 'keyval') {
    this._createIDBDatabase(dbName, storeName);
  }

  public _withIDBStore(
    type: IDBTransactionMode,
    callback: ((store: IDBObjectStoreExtends) => void)
  ): Promise<void> {
    return this.dbp.then(
      db =>
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(this.storeName, type);
          transaction.oncomplete = () => resolve();
          transaction.onabort = transaction.onerror = () =>
            reject(transaction.error);
          callback(transaction.objectStore(this.storeName));
        })
    );
  }

  private _createIDBDatabase(dbName = 'mycache', storeName = 'keyval') {
    this.dbp = new Promise<IDBDatabase>((resolve, reject) => {
      const openreq = indexedDB.open(dbName, 1);
      openreq.onerror = () => reject(openreq.error);
      openreq.onsuccess = () => resolve(openreq.result);

      // First time setup: create an empty object store
      openreq.onupgradeneeded = () => {
        openreq.result.createObjectStore(storeName);
      };
    }).then(dbp => {
      dbp.onclose = () => this._createIDBDatabase(dbName, storeName);
      return dbp;
    });
  }
}
