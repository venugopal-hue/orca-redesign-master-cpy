import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

// Application Schema
export interface OfficerApplication {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  badgeId: string;
  rank: string;
  station: string;
  district: string;
  submittedAt: string;
  status: "pending" | "pending_verification" | "pending_documents" | "approved" | "active" | "suspended" | "inactive" | "transferred" | "retired" | "rejected" | "under_review" | "awaiting";
  priority: "HIGH" | "MEDIUM" | "LOW";
  mobile: string;
  govId: string;
  documents: string[];
  reason: string;
  experience: string;
  notes?: string;
  timeline: { status: string; date: string; remarks: string }[];
  remarks?: string;
  requestedAccess?: string;
  assignedReviewer?: string;
  securityClearance?: string;
  bgVerification?: string;
  deptVerification?: string;
  supervisorApproval?: string;
  internalRemarks?: string;
  clearanceLevel?: string;
  division?: string;
  stateUnit?: string;
  department?: string;
  reportingOfficer?: string;
  supervisor?: string;
  departmentHead?: string;
  commandingOfficer?: string;
  permissions?: Record<string, string>;
  permissionsHistory?: any[];
  stationHistory?: any[];
  assignedRole?: string;
  photoUrl?: string;
}

export const PERMISSION_TEMPLATES: Record<string, { role: string; permissions: Record<string, string> }> = {
  "Basic Officer": {
    role: "Read Only Officer",
    permissions: {
      "Dashboard": "View Only",
      "Reports": "View Only",
      "Case Management": "View Only",
      "FIR Analytics": "View Only",
      "Criminal Database": "No Access",
      "Evidence Vault": "No Access",
      "Crime Analytics": "No Access",
      "Relationship Mapping": "No Access",
      "Geospatial Heatmap": "No Access",
      "Document Verification": "No Access",
      "Officer Directory": "No Access",
      "Administration": "No Access",
      "Audit Logs": "No Access",
      "AI Chatbot": "View Only",
      "AI Intelligence Copilot": "No Access",
      "Notifications": "View Only",
      "System Settings": "No Access",
      "API Management": "No Access"
    }
  },
  "Investigation Officer": {
    role: "Investigation Officer",
    permissions: {
      "Dashboard": "View Only",
      "Reports": "Create",
      "Case Management": "Edit",
      "FIR Analytics": "Edit",
      "Criminal Database": "View Only",
      "Evidence Vault": "Create",
      "Crime Analytics": "View Only",
      "Relationship Mapping": "View Only",
      "Geospatial Heatmap": "View Only",
      "Document Verification": "View Only",
      "Officer Directory": "View Only",
      "Administration": "No Access",
      "Audit Logs": "No Access",
      "AI Chatbot": "Create",
      "AI Intelligence Copilot": "View Only",
      "Notifications": "Create",
      "System Settings": "No Access",
      "API Management": "No Access"
    }
  },
  "Cyber Crime Officer": {
    role: "Cyber Crime Analyst",
    permissions: {
      "Dashboard": "View Only",
      "Reports": "Create",
      "Case Management": "Manage",
      "FIR Analytics": "Manage",
      "Criminal Database": "Edit",
      "Evidence Vault": "Manage",
      "Crime Analytics": "Edit",
      "Relationship Mapping": "Manage",
      "Geospatial Heatmap": "Edit",
      "Document Verification": "Manage",
      "Officer Directory": "View Only",
      "Administration": "No Access",
      "Audit Logs": "No Access",
      "AI Chatbot": "Manage",
      "AI Intelligence Copilot": "Manage",
      "Notifications": "Create",
      "System Settings": "No Access",
      "API Management": "No Access"
    }
  },
  "Crime Analyst": {
    role: "SCRB Analyst",
    permissions: {
      "Dashboard": "View Only",
      "Reports": "Create",
      "Case Management": "View Only",
      "FIR Analytics": "View Only",
      "Criminal Database": "View Only",
      "Evidence Vault": "View Only",
      "Crime Analytics": "Manage",
      "Relationship Mapping": "Manage",
      "Geospatial Heatmap": "Manage",
      "Document Verification": "No Access",
      "Officer Directory": "View Only",
      "Administration": "No Access",
      "Audit Logs": "No Access",
      "AI Chatbot": "Manage",
      "AI Intelligence Copilot": "Manage",
      "Notifications": "Create",
      "System Settings": "No Access",
      "API Management": "No Access"
    }
  },
  "District Administrator": {
    role: "Administrator",
    permissions: {
      "Dashboard": "Manage",
      "Reports": "Manage",
      "Case Management": "Manage",
      "FIR Analytics": "Manage",
      "Criminal Database": "Manage",
      "Evidence Vault": "Manage",
      "Crime Analytics": "Manage",
      "Relationship Mapping": "Manage",
      "Geospatial Heatmap": "Manage",
      "Document Verification": "Manage",
      "Officer Directory": "Manage",
      "Administration": "View Only",
      "Audit Logs": "View Only",
      "AI Chatbot": "Manage",
      "AI Intelligence Copilot": "Manage",
      "Notifications": "Manage",
      "System Settings": "No Access",
      "API Management": "No Access"
    }
  },
  "State Administrator": {
    role: "Administrator",
    permissions: {
      "Dashboard": "Manage",
      "Reports": "Manage",
      "Case Management": "Manage",
      "FIR Analytics": "Manage",
      "Criminal Database": "Manage",
      "Evidence Vault": "Manage",
      "Crime Analytics": "Manage",
      "Relationship Mapping": "Manage",
      "Geospatial Heatmap": "Manage",
      "Document Verification": "Manage",
      "Officer Directory": "Manage",
      "Administration": "Manage",
      "Audit Logs": "Manage",
      "AI Chatbot": "Manage",
      "AI Intelligence Copilot": "Manage",
      "Notifications": "Manage",
      "System Settings": "View Only",
      "API Management": "No Access"
    }
  },
  "Super Administrator": {
    role: "Super Administrator",
    permissions: {
      "Dashboard": "Manage",
      "Reports": "Manage",
      "Case Management": "Manage",
      "FIR Analytics": "Manage",
      "Criminal Database": "Manage",
      "Evidence Vault": "Manage",
      "Crime Analytics": "Manage",
      "Relationship Mapping": "Manage",
      "Geospatial Heatmap": "Manage",
      "Document Verification": "Manage",
      "Officer Directory": "Manage",
      "Administration": "Manage",
      "Audit Logs": "Manage",
      "AI Chatbot": "Manage",
      "AI Intelligence Copilot": "Manage",
      "Notifications": "Manage",
      "System Settings": "Manage",
      "API Management": "Manage"
    }
  }
};

// System Settings Schema
export interface SystemSettings {
  groqKey: string;
  ocrEngine: "tesseract" | "cloud_vision";
  autoApproveConstables: boolean;
  mfaEnforced: boolean;
  sessionTimeout: number;
  backupFrequency: "daily" | "weekly" | "monthly";
}

// Seed Database helper for dev demonstration
export async function seedAdminDatabase(): Promise<void> {
  const batch = writeBatch(db);

  // 1. Seed Officer Applications
  const applications: OfficerApplication[] = [
    {
      id: "app-01",
      name: "Inspector Rajesh Kumar",
      email: "rajesh.k@ksp.gov.in",
      badgeId: "INSP_RAJESH_89",
      rank: "Inspector",
      station: "Whitefield Cyber Crime PS",
      district: "Bengaluru Urban",
      submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hrs ago
      status: "pending",
      priority: "HIGH",
      mobile: "+91 98450 11223",
      govId: "KSP-ID-89241",
      documents: ["Clearance Certificate.pdf", "Official CSIRT ID Card.jpg"],
      reason: "Requesting access for state cyber intrusion investigation grid.",
      experience: "12 years cyber forensics & digital packet intercept audit.",
      timeline: [
        { status: "applied", date: new Date(Date.now() - 3600000 * 4).toISOString(), remarks: "Application registered." }
      ]
    },
    {
      id: "app-02",
      name: "Sub-Inspector Kavitha Patil",
      email: "kavitha.p@ksp.gov.in",
      badgeId: "SI_KAVITHA_91",
      rank: "Sub Inspector",
      station: "Shivaji Nagar PS",
      district: "Hubballi-Dharwad",
      submittedAt: new Date(Date.now() - 3600000 * 28).toISOString(), // 28 hrs ago
      status: "pending",
      priority: "MEDIUM",
      mobile: "+91 99001 88776",
      govId: "KSP-ID-91024",
      documents: ["Police HQ Transfer Docket.pdf"],
      reason: "Assigned to regional illegal oil adulteration task force.",
      experience: "4 years digital logs mapping.",
      timeline: [
        { status: "applied", date: new Date(Date.now() - 3600000 * 28).toISOString(), remarks: "Application registered." }
      ]
    },
    {
      id: "app-03",
      name: "Constable Chethan Gowda",
      email: "chethan.g@ksp.gov.in",
      badgeId: "PC_CHETHAN_33",
      rank: "Constable",
      station: "Mysuru Cyber Cell",
      district: "Mysuru",
      submittedAt: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
      status: "pending",
      priority: "LOW",
      mobile: "+91 98800 22334",
      govId: "KSP-ID-33412",
      documents: ["Station Ingress Card.jpg"],
      reason: "Require terminal view access to generate daily reports.",
      experience: "2 years IT helpdesk administration.",
      timeline: [
        { status: "applied", date: new Date(Date.now() - 3600000 * 72).toISOString(), remarks: "Application registered." }
      ]
    }
  ];

  for (const app of applications) {
    const docRef = doc(db, "officer_applications", app.id);
    batch.set(docRef, app, { merge: true });
  }

  // 2. Seed Directory Officers
  const officers = [
    {
      uid: "off-admin-rks",
      name: "DSP R. K. Shastry, IPS",
      badgeId: "DSP_RKS_IPS_2026",
      email: "dsp_rks_ips_2026@orca.gov",
      rank: "Superintendent of Police",
      role: "ADMIN",
      district: "Bengaluru Urban",
      station: "State Intelligence Directorate",
      clearanceLevel: "ISD-LEVEL-I",
      active: true,
      lastLogin: new Date().toISOString()
    },
    {
      uid: "off-02",
      name: "Inspector Ananth Murthy",
      badgeId: "INSP_ANANTH_12",
      email: "ananth.m@orca.gov",
      rank: "Inspector of Police",
      role: "INTELLIGENCE",
      district: "Bengaluru Urban",
      station: "Cyber Crime Wing",
      clearanceLevel: "ISD-LEVEL-IV",
      active: true,
      lastLogin: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      uid: "off-03",
      name: "Officer Shruthi Rao",
      badgeId: "OFF_SHRUTHI_04",
      email: "shruthi.r@orca.gov",
      rank: "Sub Inspector",
      role: "ANALYST",
      district: "Mysuru",
      station: "State Crime Records Bureau",
      clearanceLevel: "ISD-LEVEL-IV",
      active: true,
      lastLogin: new Date(Date.now() - 3600000 * 8).toISOString()
    }
  ];

  for (const off of officers) {
    const docRef = doc(db, "officers", off.uid);
    batch.set(docRef, off, { merge: true });
  }

  // 3. Seed Audit Logs
  const auditLogs = [
    {
      timestamp: new Date(Date.now() - 60000 * 5).toISOString(),
      officer: "DSP R. K. Shastry, IPS",
      action: "Admin center login initialized",
      module: "Security Center",
      ipAddress: "10.0.12.94",
      status: "Success"
    },
    {
      timestamp: new Date(Date.now() - 60000 * 45).toISOString(),
      officer: "Officer Shruthi Rao",
      action: "Sealed cryptographically signed briefing compiled",
      module: "Reports",
      ipAddress: "10.4.19.82",
      status: "Success"
    },
    {
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      officer: "Inspector Ananth Murthy",
      action: "Verification checklist matching BNS 111 executed",
      module: "Verification",
      ipAddress: "10.0.91.104",
      status: "Success"
    },
    {
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      officer: "DSP R. K. Shastry, IPS",
      action: "Firewall proxy settings adjusted",
      module: "Settings",
      ipAddress: "10.0.12.94",
      status: "Success"
    },
    {
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      officer: "System Automated",
      action: "Statewise threat index telemetry synced",
      module: "Analytics",
      ipAddress: "127.0.0.1",
      status: "Success"
    }
  ];

  for (let i = 0; i < auditLogs.length; i++) {
    const docRef = doc(collection(db, "audit_logs"));
    batch.set(docRef, auditLogs[i]);
  }

  // 4. Seed Verified Documents Ledger
  const verifications = [
    {
      verificationId: "VID-9824-KSP",
      documentType: "FIR Dossier Scan",
      documentName: "FIR_442_smuggling.pdf",
      verificationDate: new Date(Date.now() - 3600000 * 2).toISOString(),
      verifiedBy: "Inspector Ananth Murthy",
      status: "verified",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      verificationId: "VID-1024-KSP",
      documentType: "Officer Registration Cert",
      documentName: "rajesh_kumar_clearance.pdf",
      verificationDate: new Date(Date.now() - 3600000 * 24).toISOString(),
      verifiedBy: "DSP R. K. Shastry, IPS",
      status: "verified",
      hash: "82a92a1012a9cbf4389a9e334ba99cfebf902422a1094fc123bc8912e34fa251"
    },
    {
      verificationId: "VID-3392-KSP",
      documentType: "Seizure Memo Record",
      documentName: "seizure_petroleum_tanker.pdf",
      verificationDate: new Date(Date.now() - 3600000 * 48).toISOString(),
      verifiedBy: "Officer Shruthi Rao",
      status: "failed",
      hash: "failed_hash_signature_mismatch_detected"
    }
  ];

  for (const v of verifications) {
    const docRef = doc(db, "verified_documents", v.verificationId);
    batch.set(docRef, v, { merge: true });
  }

  // 5. Seed System Settings
  const settingsDocRef = doc(db, "admin_settings", "canonical");
  batch.set(settingsDocRef, {
    groqKey: "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",
    ocrEngine: "tesseract",
    autoApproveConstables: false,
    mfaEnforced: true,
    sessionTimeout: 30,
    backupFrequency: "daily"
  });

  await batch.commit();
}

// Helper functions for localStorage fallback when Firestore rules restrict access
export function getLocalData<T>(key: string, defaultMock: T): T {
  if (typeof window === "undefined") return defaultMock;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultMock));
    return defaultMock;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return defaultMock;
  }
}

export function setLocalData<T>(key: string, val: T): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(val));
    localStorage.setItem("orca_admin_demo_mode", "true");
  }
}

// Dev Demonstration Mock Data Configurations
export const MOCK_OFFICER_APPLICATIONS: OfficerApplication[] = [
  {
    id: "app-01",
    name: "Inspector Rajesh Kumar",
    email: "rajesh.k@ksp.gov.in",
    badgeId: "INSP_RAJESH_89",
    rank: "Inspector",
    station: "Whitefield Cyber Crime PS",
    district: "Bengaluru Urban",
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: "pending",
    priority: "HIGH",
    mobile: "+91 98450 11223",
    govId: "KSP-ID-89241",
    documents: ["Clearance Certificate.pdf", "Official CSIRT ID Card.jpg"],
    reason: "Requesting access for state cyber intrusion investigation grid.",
    experience: "12 years cyber forensics & digital packet intercept audit.",
    timeline: [
      { status: "applied", date: new Date(Date.now() - 3600000 * 4).toISOString(), remarks: "Application registered." }
    ]
  },
  {
    id: "app-02",
    name: "Sub-Inspector Kavitha Patil",
    email: "kavitha.p@ksp.gov.in",
    badgeId: "SI_KAVITHA_91",
    rank: "Sub Inspector",
    station: "Shivaji Nagar PS",
    district: "Hubballi-Dharwad",
    submittedAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    status: "pending",
    priority: "MEDIUM",
    mobile: "+91 99001 88776",
    govId: "KSP-ID-91024",
    documents: ["Police HQ Transfer Docket.pdf"],
    reason: "Assigned to regional illegal oil adulteration task force.",
    experience: "4 years digital logs mapping.",
    timeline: [
      { status: "applied", date: new Date(Date.now() - 3600000 * 28).toISOString(), remarks: "Application registered." }
    ]
  },
  {
    id: "app-03",
    name: "Constable Chethan Gowda",
    email: "chethan.g@ksp.gov.in",
    badgeId: "PC_CHETHAN_33",
    rank: "Constable",
    station: "Mysuru Cyber Cell",
    district: "Mysuru",
    submittedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    status: "pending",
    priority: "LOW",
    mobile: "+91 98800 22334",
    govId: "KSP-ID-33412",
    documents: ["Station Ingress Card.jpg"],
    reason: "Require terminal view access to generate daily reports.",
    experience: "2 years IT helpdesk administration.",
    timeline: [
      { status: "applied", date: new Date(Date.now() - 3600000 * 72).toISOString(), remarks: "Application registered." }
    ]
  }
];

export const MOCK_OFFICERS = [
  {
    uid: "off-admin-rks",
    name: "DSP R. K. Shastry, IPS",
    badgeId: "DSP_RKS_IPS_2026",
    email: "dsp_rks_ips_2026@orca.gov",
    rank: "Superintendent of Police",
    role: "ADMIN",
    district: "Bengaluru Urban",
    station: "State Intelligence Directorate",
    clearanceLevel: "ISD-LEVEL-I",
    active: true,
    lastLogin: new Date().toISOString()
  },
  {
    uid: "off-02",
    name: "Inspector Ananth Murthy",
    badgeId: "INSP_ANANTH_12",
    email: "ananth.m@orca.gov",
    rank: "Inspector of Police",
    role: "INTELLIGENCE",
    district: "Bengaluru Urban",
    station: "Cyber Crime Wing",
    clearanceLevel: "ISD-LEVEL-IV",
    active: true,
    lastLogin: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    uid: "off-03",
    name: "Officer Shruthi Rao",
    badgeId: "OFF_SHRUTHI_04",
    email: "shruthi.r@orca.gov",
    rank: "Sub Inspector",
    role: "ANALYST",
    district: "Mysuru",
    station: "State Crime Records Bureau",
    clearanceLevel: "ISD-LEVEL-IV",
    active: true,
    lastLogin: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

export const MOCK_AUDIT_LOGS = [
  {
    timestamp: new Date(Date.now() - 60000 * 5).toISOString(),
    officer: "DSP R. K. Shastry, IPS",
    action: "Admin center login initialized",
    module: "Security Center",
    ipAddress: "10.0.12.94",
    status: "Success"
  },
  {
    timestamp: new Date(Date.now() - 60000 * 45).toISOString(),
    officer: "Officer Shruthi Rao",
    action: "Sealed cryptographically signed briefing compiled",
    module: "Reports",
    ipAddress: "10.4.19.82",
    status: "Success"
  },
  {
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    officer: "Inspector Ananth Murthy",
    action: "Verification checklist matching BNS 111 executed",
    module: "Verification",
    ipAddress: "10.0.91.104",
    status: "Success"
  },
  {
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    officer: "DSP R. K. Shastry, IPS",
    action: "Firewall proxy settings adjusted",
    module: "Settings",
    ipAddress: "10.0.12.94",
    status: "Success"
  },
  {
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    officer: "System Automated",
    action: "Statewise threat index telemetry synced",
    module: "Analytics",
    ipAddress: "127.0.0.1",
    status: "Success"
  }
];

export const MOCK_VERIFICATIONS = [
  {
    verificationId: "VID-9824-KSP",
    documentType: "FIR Dossier Scan",
    documentName: "FIR_442_smuggling.pdf",
    verificationDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    verifiedBy: "Inspector Ananth Murthy",
    status: "verified",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    verificationId: "VID-1024-KSP",
    documentType: "Officer Registration Cert",
    documentName: "rajesh_kumar_clearance.pdf",
    verificationDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    verifiedBy: "DSP R. K. Shastry, IPS",
    status: "verified",
    hash: "82a92a1012a9cbf4389a9e334ba99cfebf902422a1094fc123bc8912e34fa251"
  },
  {
    verificationId: "VID-3392-KSP",
    documentType: "Seizure Memo Record",
    documentName: "seizure_petroleum_tanker.pdf",
    verificationDate: new Date(Date.now() - 3600000 * 48).toISOString(),
    verifiedBy: "Officer Shruthi Rao",
    status: "failed",
    hash: "failed_hash_signature_mismatch_detected"
  }
];

export const MOCK_SETTINGS: SystemSettings = {
  groqKey: "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",
  ocrEngine: "tesseract",
  autoApproveConstables: false,
  mfaEnforced: true,
  sessionTimeout: 30,
  backupFrequency: "daily"
};

// Fetch helper functions
export async function fetchOfficerApplications(): Promise<OfficerApplication[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "officer_applications"));
    const list: OfficerApplication[] = [];
    querySnapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() } as OfficerApplication);
    });
    const sorted = list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    setLocalData("orca_applications", sorted);
    return sorted;
  } catch (error) {
    console.warn("[O.C.R.A Admin] Firestore applications read failed. Falling back to browser sandbox.", error);
    return getLocalData("orca_applications", MOCK_OFFICER_APPLICATIONS);
  }
}

export async function fetchOfficers(): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "officers"));
    const list: any[] = [];
    querySnapshot.forEach(doc => {
      list.push({ uid: doc.id, ...doc.data() });
    });
    setLocalData("orca_officers", list);
    return list;
  } catch (error) {
    console.warn("[O.C.R.A Admin] Firestore officers read failed. Falling back to browser sandbox.", error);
    return getLocalData("orca_officers", MOCK_OFFICERS);
  }
}

export async function fetchAuditLogs(): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "audit_logs"));
    const list: any[] = [];
    querySnapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    const sorted = list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLocalData("orca_audit_logs", sorted);
    return sorted;
  } catch (error) {
    console.warn("[O.C.R.A Admin] Firestore audit logs read failed. Falling back to browser sandbox.", error);
    return getLocalData("orca_audit_logs", MOCK_AUDIT_LOGS);
  }
}

export async function fetchVerificationOversight(): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "verified_documents"));
    const list: any[] = [];
    querySnapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    const sorted = list.sort((a, b) => new Date(b.verificationDate).getTime() - new Date(a.verificationDate).getTime());
    setLocalData("orca_verifications", sorted);
    return sorted;
  } catch (error) {
    console.warn("[O.C.R.A Admin] Firestore verification records read failed. Falling back to browser sandbox.", error);
    return getLocalData("orca_verifications", MOCK_VERIFICATIONS);
  }
}

export async function fetchSystemSettings(): Promise<SystemSettings> {
  try {
    const querySnapshot = await getDocs(collection(db, "admin_settings"));
    let config: SystemSettings = {
      groqKey: "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",
      ocrEngine: "tesseract",
      autoApproveConstables: false,
      mfaEnforced: true,
      sessionTimeout: 30,
      backupFrequency: "daily"
    };
    querySnapshot.forEach(doc => {
      if (doc.id === "canonical") {
        config = { ...config, ...doc.data() };
      }
    });
    setLocalData("orca_settings", config);
    return config;
  } catch (error) {
    console.warn("[O.C.R.A Admin] Firestore settings read failed. Falling back to browser sandbox.", error);
    return getLocalData("orca_settings", MOCK_SETTINGS);
  }
}

export async function saveSystemSettings(settings: SystemSettings): Promise<void> {
  try {
    const settingsDocRef = doc(db, "admin_settings", "canonical");
    await setDoc(settingsDocRef, settings, { merge: true });
    setLocalData("orca_settings", settings);
  } catch (error) {
    console.warn("[O.C.R.A Admin] Firestore settings write failed. Saving to browser sandbox.", error);
    setLocalData("orca_settings", settings);
  }
}
