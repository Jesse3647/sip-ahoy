/** IndexedDB persistence for the complete validated journal, with optimistic concurrency. */
import { dataSchema, emptyData, type Data } from "./model";

/** A journal and the revision required to safely save its next version. */
export type Snapshot = {
  /** Monotonically increasing save counter, checked atomically inside a write transaction. */
  revision: number;
  /** Full journal associated with this revision. */
  data: Data;
};

let databasePromise: Promise<IDBDatabase> | undefined;

/** Opens one shared connection; schema version 1 stores the journal under state/current. */
function openDatabase() {
  return (databasePromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("sipahoy", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("state");
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Close other SipAhoy tabs to update storage."));
  }));
}

/** Reads and validates the saved journal, or returns revision zero for a fresh installation. */
export async function read(): Promise<Snapshot> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("state", "readonly");
    const request = transaction.objectStore("state").get("current");
    transaction.oncomplete = () => {
      try {
        const stored = request.result;
        resolve(
          stored
            ? { revision: stored.revision, data: dataSchema.parse(stored.data) }
            : { revision: 0, data: emptyData() },
        );
      } catch {
        reject(
          new Error(
            "Saved data could not be read. Restore a backup before continuing.",
          ),
        );
      }
    };
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/**
 * Validates and atomically replaces the journal if the supplied revision is still current.
 * @param data Complete next journal state, not a partial update.
 * @param revision Revision returned by the caller's last read or successful write.
 * @returns The saved journal with its incremented revision, after the transaction commits.
 * @throws If validation fails, storage is unavailable, or another tab has already saved.
 */
export async function write(data: Data, revision: number): Promise<Snapshot> {
  dataSchema.parse(data);
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("state", "readwrite");
    const store = transaction.objectStore("state");
    const request = store.get("current");
    let conflict = false;
    request.onsuccess = () => {
      // Read/check/write must share one transaction; a separate read would allow lost updates.
      if ((request.result?.revision ?? 0) !== revision) {
        conflict = true;
        transaction.abort();
        return;
      }
      store.put({ data, revision: revision + 1 }, "current");
    };
    // A successful put request is not enough: acknowledge only a committed transaction.
    transaction.oncomplete = () => resolve({ data, revision: revision + 1 });
    transaction.onabort = () =>
      reject(
        new Error(
          conflict
            ? "Another tab saved changes. Reload to see them before trying again."
            : "Your changes could not be saved. Export a backup and check available storage.",
        ),
      );
    transaction.onerror = () => reject(transaction.error);
  });
}
