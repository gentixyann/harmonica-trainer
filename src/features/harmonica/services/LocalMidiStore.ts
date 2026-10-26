const DATABASE_NAME = "harmonica-trainer-local-midi";
const STORE_NAME = "files";
const SONG_KEY = "million-i-love-you";

/** Keeps the user's MIDI in this browser; it is never sent to the server. */
export class LocalMidiStore {
  async load(): Promise<ArrayBuffer | null> {
    const database = await this.open();
    try {
      return await new Promise<ArrayBuffer | null>((resolve, reject) => {
        const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(SONG_KEY);
        request.onsuccess = () => resolve(request.result instanceof ArrayBuffer ? request.result : null);
        request.onerror = () => reject(request.error);
      });
    } finally {
      database.close();
    }
  }

  async save(buffer: ArrayBuffer): Promise<void> {
    const database = await this.open();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put(buffer, SONG_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      database.close();
    }
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
