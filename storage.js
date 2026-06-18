const DB_NAME = 'langue_plus_db';
const DB_VERSION = 1;
const STORE_USER = 'user';
const STORE_MESSAGES = 'messages';
const STORE_STATE = 'state';

let db = null;

function initDB() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      console.warn("IndexedDB support missing, using localStorage fallback.");
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = (e) => {
        console.error("IndexedDB blocked or failed to open", e);
        resolve(null);
      };
      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };
      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(STORE_USER)) {
          database.createObjectStore(STORE_USER, { keyPath: 'key' });
        }
        if (!database.objectStoreNames.contains(STORE_MESSAGES)) {
          database.createObjectStore(STORE_MESSAGES, { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains(STORE_STATE)) {
          database.createObjectStore(STORE_STATE, { keyPath: 'key' });
        }
      };
    } catch (err) {
      console.error("Error setting up IndexedDB:", err);
      resolve(null);
    }
  });
}

export const Storage = {
  dbPromise: initDB(),

  async getUser() {
    const database = await this.dbPromise;
    if (database) {
      return new Promise((resolve) => {
        try {
          const tx = database.transaction(STORE_USER, 'readonly');
          const store = tx.objectStore(STORE_USER);
          const req = store.get('profile');
          req.onsuccess = () => resolve(req.result ? req.result.val : null);
          req.onerror = () => resolve(this.getLocalFallback('user_profile'));
        } catch (e) {
          resolve(this.getLocalFallback('user_profile'));
        }
      });
    } else {
      return this.getLocalFallback('user_profile');
    }
  },

  async saveUser(user) {
    const database = await this.dbPromise;
    if (database) {
      return new Promise((resolve) => {
        try {
          const tx = database.transaction(STORE_USER, 'readwrite');
          const store = tx.objectStore(STORE_USER);
          store.put({ key: 'profile', val: user });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => {
            this.setLocalFallback('user_profile', user);
            resolve(true);
          };
        } catch (e) {
          this.setLocalFallback('user_profile', user);
          resolve(true);
        }
      });
    } else {
      this.setLocalFallback('user_profile', user);
      return true;
    }
  },

  async clearUser() {
    const database = await this.dbPromise;
    if (database) {
      return new Promise((resolve) => {
        try {
          const tx = database.transaction([STORE_USER, STORE_MESSAGES, STORE_STATE], 'readwrite');
          tx.objectStore(STORE_USER).clear();
          tx.objectStore(STORE_MESSAGES).clear();
          tx.objectStore(STORE_STATE).clear();
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => {
            this.clearLocalFallback();
            resolve(true);
          };
        } catch (e) {
          this.clearLocalFallback();
          resolve(true);
        }
      });
    } else {
      this.clearLocalFallback();
      return true;
    }
  },

  async getMessages() {
    const database = await this.dbPromise;
    if (database) {
      return new Promise((resolve) => {
        try {
          const tx = database.transaction(STORE_MESSAGES, 'readonly');
          const store = tx.objectStore(STORE_MESSAGES);
          const req = store.getAll();
          req.onsuccess = () => {
            const list = req.result || [];
            list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            resolve(list);
          };
          req.onerror = () => resolve(this.getLocalFallback('chat_messages') || []);
        } catch (e) {
          resolve(this.getLocalFallback('chat_messages') || []);
        }
      });
    } else {
      return this.getLocalFallback('chat_messages') || [];
    }
  },

  async saveMessage(msg) {
    const database = await this.dbPromise;
    if (database) {
      return new Promise((resolve) => {
        try {
          const tx = database.transaction(STORE_MESSAGES, 'readwrite');
          const store = tx.objectStore(STORE_MESSAGES);
          store.put(msg);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => {
            this.appendLocalFallbackMessage(msg);
            resolve(true);
          };
        } catch (e) {
          this.appendLocalFallbackMessage(msg);
          resolve(true);
        }
      });
    } else {
      this.appendLocalFallbackMessage(msg);
      return true;
    }
  },

  async saveMessages(msgList) {
    const database = await this.dbPromise;
    if (database) {
      return new Promise((resolve) => {
        try {
          const tx = database.transaction(STORE_MESSAGES, 'readwrite');
          const store = tx.objectStore(STORE_MESSAGES);
          for (const msg of msgList) {
            store.put(msg);
          }
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => {
            this.saveLocalFallbackMessages(msgList);
            resolve(true);
          };
        } catch (e) {
          this.saveLocalFallbackMessages(msgList);
          resolve(true);
        }
      });
    } else {
      this.saveLocalFallbackMessages(msgList);
      return true;
    }
  },

  async getState(key, defaultVal = null) {
    const database = await this.dbPromise;
    if (database) {
      return new Promise((resolve) => {
        try {
          const tx = database.transaction(STORE_STATE, 'readonly');
          const store = tx.objectStore(STORE_STATE);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result ? req.result.val : defaultVal);
          req.onerror = () => resolve(this.getLocalFallback('state_' + key, defaultVal));
        } catch (e) {
          resolve(this.getLocalFallback('state_' + key, defaultVal));
        }
      });
    } else {
      return this.getLocalFallback('state_' + key, defaultVal);
    }
  },

  async saveState(key, val) {
    const database = await this.dbPromise;
    if (database) {
      return new Promise((resolve) => {
        try {
          const tx = database.transaction(STORE_STATE, 'readwrite');
          const store = tx.objectStore(STORE_STATE);
          store.put({ key: key, val: val });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => {
            this.setLocalFallback('state_' + key, val);
            resolve(true);
          };
        } catch (e) {
          this.setLocalFallback('state_' + key, val);
          resolve(true);
        }
      });
    } else {
      this.setLocalFallback('state_' + key, val);
      return true;
    }
  },

  // Fallback helper utilities
  getLocalFallback(key, defaultVal = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  },

  setLocalFallback(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error("localStorage failed for key:", key, e);
    }
  },

  appendLocalFallbackMessage(msg) {
    const msgs = this.getLocalFallback('chat_messages') || [];
    const idx = msgs.findIndex(m => m.id === msg.id);
    if (idx > -1) msgs[idx] = msg;
    else msgs.push(msg);
    this.setLocalFallback('chat_messages', msgs);
  },

  saveLocalFallbackMessages(msgList) {
    const msgs = this.getLocalFallback('chat_messages') || [];
    for (const msg of msgList) {
      const idx = msgs.findIndex(m => m.id === msg.id);
      if (idx > -1) msgs[idx] = msg;
      else msgs.push(msg);
    }
    this.setLocalFallback('chat_messages', msgs);
  },

  clearLocalFallback() {
    try {
      localStorage.removeItem('user_profile');
      localStorage.removeItem('chat_messages');
      // Keep state values like theme if appropriate, or delete everything
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('state_') || key === 'user_profile' || key === 'chat_messages') {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
  }
};
