import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, get, child, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD9Rdk6hZqHMgodSXcEaaeXsOP7V0RDSA",
  authDomain: "remix-arh-ltc-mdro-hub.firebaseapp.com",
  databaseURL: "https://remix-arh-ltc-mdro-hub-default-rtdb.firebaseio.com",
  projectId: "remix-arh-ltc-mdro-hub",
  storageBucket: "remix-arh-ltc-mdro-hub.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

/**
 * دالة لتنظيف البيانات من قيم undefined التي لا يقبلها Firebase
 */
const sanitize = (data: any) => {
  return JSON.parse(JSON.stringify(data));
};

export const sendData = (path: string, data: any) => push(ref(db, path), sanitize({ ...data, date: new Date().toISOString() }));

/**
 * دالة لحذف بيان محدد من مسار معين
 */
export const deleteFromCloud = async (path: string, id: string) => {
  try {
    const dbRef = ref(db, `${path}/${id}`);
    await remove(dbRef);
    return true;
  } catch (error) {
    console.error("Firebase Delete Error:", error);
    return false;
  }
};

/**
 * دالة لمسح مسار كامل (للبدء من جديد)
 */
export const clearCloudPath = async (path: string) => {
  try {
    const dbRef = ref(db, path);
    await remove(dbRef);
    return true;
  } catch (error) {
    console.error("Firebase Clear Error:", error);
    return false;
  }
};

// دالة موحدة لكل الأزرار
export const sendToCloud = async (folderName: string, data: any) => {
  try {
    const dbRef = ref(db, folderName); // folderName سيكون 'audits' أو 'registries'
    await push(dbRef, sanitize({
      ...data,
      serverTime: new Date().toISOString()
    }));
    return true;
  } catch (error) {
    console.error("Cloud Error:", error);
    return false;
  }
};

/**
 * دالة عامة لحفظ أي بيان في أي مسار
 */
export const saveData = async (path: string, data: any) => {
  try {
    const dbRef = ref(db, path);
    return await push(dbRef, sanitize({
      ...data,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error("Firebase Save Error:", error);
    throw error;
  }
};

/**
 * دالة المزامنة اليدوية للمجموعات (Arrays)
 */
export const syncAllData = async (path: string, dataArray: any[]) => {
  const dbRef = ref(db, path);
  const promises = dataArray.map(item => push(dbRef, sanitize({
    ...item,
    syncTimestamp: new Date().toISOString()
  })));
  return Promise.all(promises);
};

// Vault Sync Functions (Replacing local server)
export const pushToVault = async (vaultId: string, data: any) => {
  try {
    const dbRef = ref(db, `vaults/${vaultId}`);
    await set(dbRef, sanitize({
      data,
      timestamp: new Date().toISOString()
    }));
    return true;
  } catch (error) {
    console.error("Vault Push Error:", error);
    return false;
  }
};

export const pullFromVault = async (vaultId: string) => {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `vaults/${vaultId}`));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Vault Pull Error:", error);
    return null;
  }
};
