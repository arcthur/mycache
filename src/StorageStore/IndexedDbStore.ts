import { IDB } from '../Utils/IDB';

class IndexedDbStore {
  public store: IDB;

  constructor() {
    this.store = new IDB();
  }

  public async onReady() {
    // Safari throws a SecurityError if IndexedDB.open() is called in a
    // cross-origin iframe.
    //
    //   SecurityError: IDBFactory.open() called in an invalid security context
    //
    // Catch such and fail gracefully.
    try {
      await this.store.dbp;
    } catch (err) {
      if (err.name === 'SecurityError') {
        return null; // Failed to open an IndexedDB database.
      } else {
        throw err;
      }
    }

    return this;
  }

  public async get<T>(key: IDBValidKey): Promise<T> {
    let req: IDBRequest;
    return this.store
      ._withIDBStore('readonly', s => {
        req = s.get(key);
      })
      .then(() => req.result);
  }

  public async set(key: string, value: any) {
    return this.store._withIDBStore('readwrite', s => {
      s.put(value, key);
    });
  }

  public async remove(key: string) {
    return this.store._withIDBStore('readwrite', s => {
      s.delete(key);
    });
  }

  public async clear() {
    return this.store._withIDBStore('readwrite', s => {
      s.clear();
    });
  }

  public async keys() {
    // tslint:disable-next-line:no-shadowed-variable
    const keys: IDBValidKey[] = [];

    return this.store
      ._withIDBStore('readonly', s => {
        // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
        // And openKeyCursor isn't supported by Safari.
        (s.openKeyCursor || s.openCursor).call(s).onsuccess = function() {
          if (!this.result) {
            return;
          }
          keys.push(this.result.key);
          this.result.continue();
        };
      })
      .then(() => keys);
  }

  public async length() {
    // tslint:disable-next-line:no-shadowed-variable
    let res: any;

    return this.store
      ._withIDBStore('readwrite', s => {
        res = s.count();
      })
      .then(() => res.result);
  }
}

export { IndexedDbStore };
