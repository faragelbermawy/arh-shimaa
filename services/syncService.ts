
import { storageService } from "./storageService";
import { pushToVault, pullFromVault } from "./firebase";

export type SyncMode = 'lite' | 'full';

/**
 * Service to handle data synchronization with external systems like Google Sheets.
 */
export const syncService = {
  /**
   * Sends data to Google Sheets via a Google Apps Script Web App.
   * Uses no-cors mode to bypass CORS restrictions.
   */
  sendToGoogleSheets: async (data: any): Promise<boolean> => {
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyY_4W9r-RNPJzfgPvrE50bojFPIKOlDgfL3dh45xDYQo7o0pSc0EotHI9I6e8x8ag_/exec";
    
    try {
      // تجهيز البيانات لتطابق ما ينتظره السكريبت المطور
      const payload = {
        unit: data.unit || data.unitId || "N/A",
        auditorName: data.auditorName || data.clinicalAuditor || "System",
        personnelAudited: data.personnelAudited || data.personnel || "N/A",
        staffGroup: data.staffGroup || "Others",
        auditType: data.auditType || "General",
        compliance: data.compliance || (data.score === 1 ? "Compliant" : "Non-Compliant"),
        notes: data.notes || ""
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(payload),
      });
      
      return true;
    } catch (error) {
      console.error("Sync Service Error:", error);
      return false;
    }
  },

  /**
   * Pushes data to the central sync server.
   */
  pushToServer: async (id: string, mode: SyncMode): Promise<boolean> => {
    try {
      const reports = storageService.getReports();
      const audits = storageService.getAudits();
      const visitors = storageService.getVisitors();
      
      let dataToSync: any = { audits, visitors };
      
      if (mode === 'full') {
        dataToSync.reports = reports;
      } else {
        dataToSync.reports = reports.map(r => ({ ...r, fileData: undefined }));
      }

      return await pushToVault(id, dataToSync);
    } catch (error) {
      console.error("Push Error:", error);
      return false;
    }
  },

  /**
   * Pulls data from the central sync server and merges it.
   */
  pullFromServer: async (id: string): Promise<{ success: boolean; message: string; count?: any }> => {
    try {
      const record = await pullFromVault(id);
      if (!record) {
        return { success: false, message: "Sync record not found on server." };
      }

      const remoteData = record.data;
      
      if (!remoteData.audits && !remoteData.reports && !remoteData.visitors) {
        return { success: false, message: "Invalid data format from server." };
      }

      // Merge logic (reusing existing logic)
      const localAudits = storageService.getAudits();
      const newAudits = [...localAudits];
      remoteData.audits?.forEach((ra: any) => {
        if (!newAudits.find(la => la.id === ra.id)) {
          newAudits.push(ra);
        }
      });
      storageService.set('mdro_audits_v2', newAudits);

      const localVisitors = storageService.getVisitors();
      const newVisitors = [...localVisitors];
      remoteData.visitors?.forEach((rv: any) => {
        if (!newVisitors.find(lv => lv.id === rv.id)) {
          newVisitors.push(rv);
        }
      });
      storageService.set('mdro_visitors_v2', newVisitors);

      const localReports = storageService.getReports();
      const newReports = [...localReports];
      let mergedReportsCount = 0;
      if (remoteData.reports) {
        for (const rr of remoteData.reports) {
          if (!newReports.find(lr => lr.id === rr.id)) {
            newReports.push(rr);
            mergedReportsCount++;
          }
        }
      }
      storageService.set('mdro_reports_v2', newReports);

      return { 
        success: true, 
        message: "Data pulled and merged successfully.", 
        count: { reports: mergedReportsCount } 
      };
    } catch (e) {
      console.error("Pull Error:", e);
      return { success: false, message: "Failed to pull data from server." };
    }
  },

  /**
   * Generates a sync token (base64 encoded JSON) for manual transfer.
   */
  generateSyncToken: async (mode: SyncMode): Promise<string> => {
    const reports = storageService.getReports();
    const audits = storageService.getAudits();
    const visitors = storageService.getVisitors();
    
    let dataToSync: any = { audits, visitors };
    
    if (mode === 'full') {
      // For full sync, we try to include reports too
      dataToSync.reports = reports;
    } else {
      // For lite sync, we only include report metadata (no binary data)
      dataToSync.reports = reports.map(r => ({ ...r, fileData: undefined }));
    }

    const json = JSON.stringify(dataToSync);
    // Use btoa for a simple token. For very large data, this might hit limits.
    return btoa(unescape(encodeURIComponent(json)));
  },

  /**
   * Merges a sync token into the local state.
   */
  mergeState: async (token: string): Promise<{ success: boolean; message: string; count?: any }> => {
    try {
      const json = decodeURIComponent(escape(atob(token)));
      const remoteData = JSON.parse(json);
      
      if (!remoteData.audits && !remoteData.reports && !remoteData.visitors) {
        return { success: false, message: "Invalid sync token format." };
      }

      // Merge Audits
      const localAudits = storageService.getAudits();
      const newAudits = [...localAudits];
      remoteData.audits?.forEach((ra: any) => {
        if (!newAudits.find(la => la.id === ra.id)) {
          newAudits.push(ra);
        }
      });
      storageService.set('mdro_audits_v2', newAudits);

      // Merge Visitors
      const localVisitors = storageService.getVisitors();
      const newVisitors = [...localVisitors];
      remoteData.visitors?.forEach((rv: any) => {
        if (!newVisitors.find(lv => lv.id === rv.id)) {
          newVisitors.push(rv);
        }
      });
      storageService.set('mdro_visitors_v2', newVisitors);

      // Merge Reports
      const localReports = storageService.getReports();
      const newReports = [...localReports];
      let mergedReportsCount = 0;
      if (remoteData.reports) {
        for (const rr of remoteData.reports) {
          if (!newReports.find(lr => lr.id === rr.id)) {
            newReports.push(rr);
            mergedReportsCount++;
          }
        }
      }
      storageService.set('mdro_reports_v2', newReports);

      return { 
        success: true, 
        message: "Data merged successfully.", 
        count: { reports: mergedReportsCount } 
      };
    } catch (e) {
      console.error("Merge Error:", e);
      return { success: false, message: "Failed to parse sync token." };
    }
  }
};

