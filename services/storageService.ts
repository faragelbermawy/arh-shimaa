import { ClinicalReport, AuditRecord, Visitor, UserProgress, GoldenFile } from '../types';

const KEYS = {
  REPORTS: 'mdro_reports_v2', 
  AUDITS: 'mdro_audits_v2',
  VISITORS: 'mdro_visitors_v2',
  PROGRESS: 'mdro_user_progress_v2',
  SYNC: 'mdro_last_global_sync_v2',
  THEME: 'mdro_theme_v2',
  GOLDEN_FILES: 'mdro_golden_files_v2'
};

const DB_NAME = 'MDRO_LTC_BLOBS';
const STORE_NAME = 'blobs';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const storageService = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return defaultValue;
      return JSON.parse(saved) as T;
    } catch (e) {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Storage Error: Failed to save ${key}. LocalStorage may be full.`, e);
      // If it's the reports or golden files, we already moved blobs to IndexedDB.
      // If it still fails, the metadata itself is too large (rare).
    }
  },

  // Binary Storage Logic (IndexedDB)
  saveBlob: async (id: string, data: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(data, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  getBlob: async (id: string): Promise<string | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  deleteBlob: async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  getReports: () => storageService.get<ClinicalReport[]>(KEYS.REPORTS, []),
  getAudits: () => storageService.get<AuditRecord[]>(KEYS.AUDITS, []),
  getVisitors: () => storageService.get<Visitor[]>(KEYS.VISITORS, []),
  getGoldenFiles: () => storageService.get<GoldenFile[]>(KEYS.GOLDEN_FILES, []),
  
  getProgress: () => storageService.get<UserProgress>(KEYS.PROGRESS, {
    completedModules: [],
    quizScores: {},
    handWashStreak: 0,
    lastHandWash: '',
    totalHandWashes: 0,
    ppeDonningCount: 0,
    ppeDoffingCount: 0
  }),

  saveReport: async (report: ClinicalReport) => {
    const existing = storageService.getReports();
    if (existing.find(r => r.id === report.id)) return;
    
    // Move heavy data to IndexedDB
    if (report.fileData) {
      await storageService.saveBlob(report.id, report.fileData);
      report.fileData = "__STORED_IN_IDB__"; 
    }
    
    storageService.set(KEYS.REPORTS, [report, ...existing]);
  },

  saveGoldenFile: async (file: GoldenFile) => {
    const existing = storageService.getGoldenFiles();
    if (existing.find(f => f.id === file.id)) return;

    if (file.data) {
      await storageService.saveBlob(file.id, file.data);
      file.data = "__STORED_IN_IDB__";
    }

    storageService.set(KEYS.GOLDEN_FILES, [file, ...existing]);
  },

  // Fix: Added missing saveAudit method for WeeklyAudit.tsx
  saveAudit: (audit: AuditRecord) => {
    const existing = storageService.getAudits();
    storageService.set(KEYS.AUDITS, [audit, ...existing]);
  },

  // Fix: Added missing saveVisitor method for VisitorRegistry.tsx
  saveVisitor: (visitor: Visitor) => {
    const existing = storageService.getVisitors();
    storageService.set(KEYS.VISITORS, [visitor, ...existing]);
  },

  // Helper to get full object including binary data
  getReportWithData: async (id: string): Promise<ClinicalReport | null> => {
    const reports = storageService.getReports();
    const report = reports.find(r => r.id === id);
    if (!report) return null;
    
    if (report.fileData === "__STORED_IN_IDB__") {
      const data = await storageService.getBlob(id);
      return { ...report, fileData: data || undefined };
    }
    return report;
  },

  getGoldenFileWithData: async (id: string): Promise<GoldenFile | null> => {
    const files = storageService.getGoldenFiles();
    const file = files.find(f => f.id === id);
    if (!file) return null;

    if (file.data === "__STORED_IN_IDB__") {
      const data = await storageService.getBlob(id);
      return { ...file, data: data || "" };
    }
    return file;
  },

  updateProgress: (updater: (prev: UserProgress) => UserProgress) => {
    const current = storageService.getProgress();
    const updated = updater(current);
    storageService.set(KEYS.PROGRESS, updated);
  },

  deleteReport: async (id: string) => {
    const existing = storageService.getReports();
    storageService.set(KEYS.REPORTS, existing.filter(r => r.id !== id));
    await storageService.deleteBlob(id);
  },

  updateReport: async (report: ClinicalReport) => {
    const existing = storageService.getReports();
    const index = existing.findIndex(r => r.id === report.id);
    if (index === -1) return;
    
    if (report.fileData && report.fileData !== "__STORED_IN_IDB__") {
      await storageService.saveBlob(report.id, report.fileData);
      report.fileData = "__STORED_IN_IDB__";
    }
    
    const updated = [...existing];
    updated[index] = report;
    storageService.set(KEYS.REPORTS, updated);
  },

  updateAudit: (audit: AuditRecord) => {
    const existing = storageService.getAudits();
    const index = existing.findIndex(a => a.id === audit.id);
    if (index === -1) return;
    
    const updated = [...existing];
    updated[index] = audit;
    storageService.set(KEYS.AUDITS, updated);
  },

  deleteAudit: (id: string) => {
    const existing = storageService.getAudits();
    storageService.set(KEYS.AUDITS, existing.filter(a => a.id !== id));
  },

  deleteVisitor: (id: string) => {
    const existing = storageService.getVisitors();
    storageService.set(KEYS.VISITORS, existing.filter(v => v.id !== id));
  },

  deleteGoldenFile: async (id: string) => {
    const existing = storageService.getGoldenFiles();
    storageService.set(KEYS.GOLDEN_FILES, existing.filter(f => f.id !== id));
    await storageService.deleteBlob(id);
  },

  clearAllData: async () => {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  },

  exportAllData: async () => {
    // Note: Exporting all data might still hit memory limits for very large archives
    const reports = storageService.getReports();
    const fullReports = await Promise.all(reports.map(async r => {
      if (r.fileData === "__STORED_IN_IDB__") {
        const data = await storageService.getBlob(r.id);
        return { ...r, fileData: data || undefined };
      }
      return r;
    }));

    const goldFiles = storageService.getGoldenFiles();
    const fullGoldFiles = await Promise.all(goldFiles.map(async f => {
      if (f.data === "__STORED_IN_IDB__") {
        const data = await storageService.getBlob(f.id);
        return { ...f, data: data || "" };
      }
      return f;
    }));

    const data = {
      reports: fullReports,
      audits: storageService.getAudits(),
      visitors: storageService.getVisitors(),
      goldenFiles: fullGoldFiles,
      progress: storageService.getProgress(),
      exportDate: new Date().toISOString(),
      app: 'MDRO_LTC_CONTROL_HUB'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MDRO_HUB_MASTER_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  migrate: () => {
    const oldKeys = ['mdro_reports', 'mdro_audits', 'mdro_visitors', 'mdro_user_progress'];
    oldKeys.forEach(ok => {
      const oldData = localStorage.getItem(ok);
      if (oldData) {
        const newKey = ok + '_v2';
        if (!localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, oldData);
        }
      }
    });
  }
};