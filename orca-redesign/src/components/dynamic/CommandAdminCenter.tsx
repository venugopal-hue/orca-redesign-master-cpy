"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useIntelligence } from "@/context/IntelligenceContext";
import { 
  seedAdminDatabase, 
  fetchOfficerApplications, 
  fetchOfficers, 
  fetchAuditLogs, 
  fetchVerificationOversight, 
  fetchSystemSettings, 
  saveSystemSettings,
  OfficerApplication,
  SystemSettings,
  getLocalData,
  setLocalData,
  PERMISSION_TEMPLATES,
  MOCK_OFFICER_APPLICATIONS,
  MOCK_OFFICERS,
  MOCK_AUDIT_LOGS,
  MOCK_VERIFICATIONS,
  MOCK_SETTINGS
} from "@/lib/adminService";
import { 
  UserCheck, 
  Settings, 
  ShieldAlert, 
  Award, 
  FileCheck, 
  History, 
  AlertTriangle, 
  Home, 
  Bot, 
  Search, 
  Download, 
  ChevronRight, 
  X, 
  Check, 
  FileText,
  User, 
  Shield, 
  Activity, 
  Lock, 
  Database, 
  Server,
  CloudLightning,
  Sparkles,
  Info,
  Clock,
  Loader2
} from "lucide-react";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

// O.C.R.A Admin Style Tokens
const ADMIN_THEME = {
  bg: "#f8fafc",
  cardBg: "#ffffff",
  border: "#cbd5e1",
  accentGold: "#FF9933",
  accentGoldLight: "#ffb05c",
  green: "#10b981",
  red: "#ef4444",
  blue: "#001f3f",
  textPrimary: "#001f3f",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  shadow: "0 1px 3px rgba(0,0,0,0.05)",
  shadowMd: "0 4px 6px -1px rgba(0,0,0,0.08)"
};

const getCleanInitials = (fullName: string) => {
  if (!fullName) return "";
  const cleanName = fullName
    .replace(/^(Sub-Inspector|Inspector|Constable|Deputy Superintendent|Superintendent|DSP|SP|PSI|ASI|ADGP|DGP|IGP|DIG|Head Constable|Police Constable)\s+/i, "")
    .trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0] ? parts[0].slice(0, 2).toUpperCase() : "";
};

const RANKS = [
  "Director General of Police (DGP)",
  "Additional Director General of Police (ADGP)",
  "Inspector General of Police (IGP)",
  "Deputy Inspector General of Police (DIGP)",
  "Superintendent of Police (SP)",
  "Deputy Superintendent of Police (DSP)",
  "Inspector of Police",
  "Sub-Inspector of Police (SI)",
  "Assistant Sub-Inspector of Police (ASI)",
  "Head Constable",
  "Police Constable"
];

const KARNATAKA_DISTRICTS = [
  "Bagalkote",
  "Ballari",
  "Belagavi",
  "Bengaluru Rural",
  "Bengaluru Urban",
  "Bidar",
  "Chamarajanagar",
  "Chikkaballapura",
  "Chikkamagaluru",
  "Chitradurga",
  "Dakshina Kannada",
  "Davanagere",
  "Dharwad",
  "Gadag",
  "Hassan",
  "Haveri",
  "Kalaburagi",
  "Kodagu",
  "Kolar",
  "Koppal",
  "Mandya",
  "Mysuru",
  "Raichur",
  "Ramanagara",
  "Shivamogga",
  "Tumakuru",
  "Udupi",
  "Uttara Kannada",
  "Vijayapura",
  "Yadgir"
];

const ACCESS_MODULES = [
  "Crime Intelligence Dashboard",
  "FIR Analytics",
  "Criminal Database Search",
  "Cyber Crime Intelligence",
  "Suspect Relationship Mapping",
  "Full Investigator Access"
];

const PERMISSION_CATEGORIES = [
  {
    id: "user-admin",
    name: "User & Officer Administration",
    icon: UserCheck,
    permissions: ["Manage Officers", "Approve Officers", "Delete Officers"]
  },
  {
    id: "core-ops",
    name: "Core Police Operations",
    icon: Home,
    permissions: ["Manage Cases", "Generate Reports", "Document Verification"]
  },
  {
    id: "analytics-ai",
    name: "Analytics & AI Clearance",
    icon: Sparkles,
    permissions: ["AI Access", "Dashboard Access", "Analytics"]
  },
  {
    id: "system-security",
    name: "System Security & Configuration",
    icon: Shield,
    permissions: ["Audit Logs", "System Settings", "Verification Management"]
  }
];


interface CommandAdminCenterProps {
  adminTab: string;
}

export const CommandAdminCenter: React.FC<CommandAdminCenterProps> = ({ adminTab }) => {
  const { officerProfile } = useAuth();
  const { activeFirId } = useIntelligence();

  // Firestore retrieved state arrays
  const [applications, setApplications] = useState<OfficerApplication[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  // UI state managers
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<OfficerApplication | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeOfficerProfile, setActiveOfficerProfile] = useState<any | null>(null);
  
  // Search & Filter state variables
  const [appSearch, setAppSearch] = useState("");
  const [dirSearch, setDirSearch] = useState("");
  const [dirDistrictFilter, setDirDistrictFilter] = useState("ALL");
  const [dirRankFilter, setDirRankFilter] = useState("ALL");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditModuleFilter, setAuditModuleFilter] = useState("ALL");
  const [verSearch, setVerSearch] = useState("");
  const [verStatusFilter, setVerStatusFilter] = useState("ALL");

  // State hooks for inline profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileRank, setEditProfileRank] = useState("");
  const [editProfileEmail, setEditProfileEmail] = useState("");
  const [editProfileDistrict, setEditProfileDistrict] = useState("");
  const [editProfileStation, setEditProfileStation] = useState("");
  const [editProfileClearance, setEditProfileClearance] = useState("");
  const [editProfileMobile, setEditProfileMobile] = useState("");
  const [editProfileActive, setEditProfileActive] = useState(true);

  // Extended state variables for drawer modifications
  const [modFirstName, setModFirstName] = useState("");
  const [modLastName, setModLastName] = useState("");
  const [modRank, setModRank] = useState("");
  const [modStation, setModStation] = useState("");
  const [modDistrict, setModDistrict] = useState("");
  const [modMobile, setModMobile] = useState("");
  const [modEmail, setModEmail] = useState("");
  const [modRequestedAccess, setModRequestedAccess] = useState("");
  const [modInternalRemarks, setModInternalRemarks] = useState("");
  const [modPriority, setModPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [modAssignedReviewer, setModAssignedReviewer] = useState("");
  const [modSecurityClearance, setModSecurityClearance] = useState("ISD-LEVEL-IV");
  const [modBgVerification, setModBgVerification] = useState("pending");
  const [modDeptVerification, setModDeptVerification] = useState("pending");
  const [modSupervisorApproval, setModSupervisorApproval] = useState("pending");
  const [modStatus, setModStatus] = useState("pending");

  const [modRole, setModRole] = useState("Investigation Officer");
  const [modDivision, setModDivision] = useState("");
  const [modStateUnit, setModStateUnit] = useState("");
  const [modDepartment, setModDepartment] = useState("Cyber Crime");
  const [modReportingOfficer, setModReportingOfficer] = useState("");
  const [modSupervisor, setModSupervisor] = useState("");
  const [modDepartmentHead, setModDepartmentHead] = useState("");
  const [modCommandingOfficer, setModCommandingOfficer] = useState("");
  const [modPermissions, setModPermissions] = useState<Record<string, string>>({});
  const [isConfirmingApproval, setIsConfirmingApproval] = useState(false);

  // Application search, filters, sorting and pagination states
  const [appRankFilter, setAppRankFilter] = useState("ALL");
  const [appDistrictFilter, setAppDistrictFilter] = useState("ALL");
  const [appStationFilter, setAppStationFilter] = useState("ALL");
  const [appStatusFilter, setAppStatusFilter] = useState("ALL");
  const [appAccessFilter, setAppAccessFilter] = useState("ALL");
  const [appReviewerFilter, setAppReviewerFilter] = useState("ALL");
  const [appSortBy, setAppSortBy] = useState("newest");
  const [appPage, setAppPage] = useState(1);
  const itemsPerPage = 6;

  // Interaction feedback states
  const [actionLoading, setActionLoading] = useState(false);
  const [internalRemarks, setInternalRemarks] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // RBAC Configurable permissions configuration
  const [rbacPermissions, setRbacPermissions] = useState<Record<string, string[]>>({
    "Super Administrator": ["Manage Officers", "Approve Officers", "Delete Officers", "Manage Cases", "Generate Reports", "Document Verification", "AI Access", "Dashboard Access", "Audit Logs", "System Settings", "Verification Management", "Analytics"],
    "Administrator": ["Manage Officers", "Approve Officers", "Manage Cases", "Generate Reports", "Document Verification", "AI Access", "Dashboard Access", "Audit Logs", "System Settings", "Verification Management", "Analytics"],
    "DSP": ["Manage Cases", "Generate Reports", "Document Verification", "AI Access", "Dashboard Access", "Analytics"],
    "SP": ["Manage Cases", "Generate Reports", "Document Verification", "AI Access", "Dashboard Access", "Analytics"],
    "Inspector": ["Manage Cases", "Generate Reports", "Document Verification", "AI Access", "Dashboard Access"],
    "Sub Inspector": ["Manage Cases", "Generate Reports", "Document Verification", "AI Access"],
    "Constable": ["Generate Reports", "AI Access"],
    "Analyst": ["AI Access", "Dashboard Access", "Analytics"],
    "Operator": ["Document Verification", "AI Access"]
  });

  const availablePermissions = [
    "Manage Officers",
    "Approve Officers",
    "Delete Officers",
    "Manage Cases",
    "Generate Reports",
    "Document Verification",
    "AI Access",
    "Dashboard Access",
    "Audit Logs",
    "System Settings",
    "Verification Management",
    "Analytics"
  ];

  // Reload admin data from firestore
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const appsList = await fetchOfficerApplications();
      const officersList = await fetchOfficers();
      const logsList = await fetchAuditLogs();
      const verList = await fetchVerificationOversight();
      const settingsObj = await fetchSystemSettings();
      
      setApplications(appsList);
      setOfficers(officersList);
      setAuditLogs(logsList);
      setVerifications(verList);
      setSystemSettings(settingsObj);
    } catch (err) {
      console.error("[O.C.R.A Admin Fetch Error]:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [adminTab]);

  useEffect(() => {
    if (selectedApp) {
      setModFirstName(selectedApp.firstName || selectedApp.name.split(" ")[0] || "");
      setModLastName(selectedApp.lastName || selectedApp.name.split(" ").slice(1).join(" ") || "");
      setModRank(selectedApp.rank || "");
      setModStation(selectedApp.station || "");
      setModDistrict(selectedApp.district || "");
      setModMobile(selectedApp.mobile || "");
      setModEmail(selectedApp.email || "");
      setModRequestedAccess(selectedApp.requestedAccess || "");
      setModInternalRemarks(selectedApp.internalRemarks || selectedApp.remarks || "");
      setModPriority(selectedApp.priority || "MEDIUM");
      setModAssignedReviewer(selectedApp.assignedReviewer || "");
      setModSecurityClearance(selectedApp.securityClearance || selectedApp.clearanceLevel || "ISD-LEVEL-IV");
      setModBgVerification(selectedApp.bgVerification || "pending");
      setModDeptVerification(selectedApp.deptVerification || "pending");
      setModSupervisorApproval(selectedApp.supervisorApproval || "pending");
      setModReportingOfficer(selectedApp.reportingOfficer || "");
      setModSupervisor(selectedApp.supervisor || "");
      setModDepartmentHead(selectedApp.departmentHead || "");
      setModCommandingOfficer(selectedApp.commandingOfficer || "");
      setModPermissions(selectedApp.permissions || {});
      setModRole(selectedApp.assignedRole || "Investigation Officer");
      setModDivision(selectedApp.division || "");
      setModStateUnit(selectedApp.stateUnit || "");
      setModDepartment(selectedApp.department || "Cyber Crime");
      setIsConfirmingApproval(false);
      setModStatus(selectedApp.status || "pending");
    }
  }, [selectedApp]);

  // Seeding trigger
  const handleSeedDatabase = async () => {
    setActionLoading(true);
    try {
      await seedAdminDatabase();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      await loadAdminData();
    } catch (err) {
      console.warn("Firestore seeding failed due to permissions. Initializing in-memory browser sandbox.", err);
      // Seed locally in localStorage
      setLocalData("orca_applications", MOCK_OFFICER_APPLICATIONS);
      setLocalData("orca_officers", MOCK_OFFICERS);
      setLocalData("orca_audit_logs", MOCK_AUDIT_LOGS);
      setLocalData("orca_verifications", MOCK_VERIFICATIONS);
      setLocalData("orca_settings", MOCK_SETTINGS);
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      await loadAdminData();
    } finally {
      setActionLoading(false);
    }
  };

  const applyPermissionTemplate = (templateName: string) => {
    const template = PERMISSION_TEMPLATES[templateName];
    if (template) {
      setModPermissions({ ...template.permissions });
      setModRole(template.role);
    }
  };

  // Approval flow handler
  const handleApproveApp = async (app: OfficerApplication) => {
    setIsConfirmingApproval(true);
  };

  const executeApproveApp = async (app: OfficerApplication) => {
    const approvedName = `${modFirstName} ${modLastName}`.trim() || app.name;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/approve-officer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: app.id,
          email: modEmail.trim() || app.email,
          name: approvedName,
          rank: modRank || app.rank,
          district: modDistrict || app.district,
          station: modStation || app.station,
          badgeId: app.badgeId,
          mobile: modMobile || app.mobile,
          requestedAccess: app.requestedAccess,
          adminName: officerProfile?.name || "DSP R. K. Shastry, IPS",
          
          assignedRole: modRole,
          permissions: modPermissions,
          division: modDivision,
          stateUnit: modStateUnit,
          department: modDepartment,
          reportingOfficer: modReportingOfficer,
          supervisor: modSupervisor,
          departmentHead: modDepartmentHead,
          commandingOfficer: modCommandingOfficer,
          status: modStatus === "pending" ? "active" : modStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval API returned error");

      // Also update application status in Firestore
      const appDocRef = doc(db, "officer_applications", app.id);
      await setDoc(appDocRef, {
        status: modStatus === "pending" ? "active" : modStatus,
        approvedAt: new Date().toISOString(),
        firstName: modFirstName,
        lastName: modLastName,
        name: approvedName,
        rank: modRank,
        district: modDistrict,
        station: modStation,
        mobile: modMobile,
        email: modEmail,
        
        assignedRole: modRole,
        permissions: modPermissions,
        division: modDivision,
        stateUnit: modStateUnit,
        department: modDepartment,
        reportingOfficer: modReportingOfficer,
        supervisor: modSupervisor,
        departmentHead: modDepartmentHead,
        commandingOfficer: modCommandingOfficer,
        securityClearance: modSecurityClearance,
        timeline: [
          ...(app.timeline || []),
          { status: modStatus === "pending" ? "active" : modStatus, date: new Date().toISOString(), remarks: `Application approved by ${officerProfile?.name || "DSP R. K. Shastry, IPS"}.` }
        ]
      }, { merge: true });

      // Add to officer collection
      const officerDocRef = doc(db, "officers", app.id);
      await setDoc(officerDocRef, {
        uid: app.id,
        name: approvedName,
        badgeId: app.badgeId,
        email: modEmail || app.email,
        rank: modRank || app.rank,
        role: modRole,
        district: modDistrict || app.district,
        station: modStation || app.station,
        clearanceLevel: modSecurityClearance || "ISD-LEVEL-IV",
        active: modStatus === "suspended" || modStatus === "inactive" || modStatus === "rejected" ? false : true,
        lastLogin: new Date().toISOString(),
        mobile: modMobile || app.mobile,
        approvedAt: new Date().toISOString(),
        photoUrl: app.photoUrl || "",
        
        division: modDivision,
        stateUnit: modStateUnit,
        department: modDepartment,
        reportingOfficer: modReportingOfficer,
        supervisor: modSupervisor,
        departmentHead: modDepartmentHead,
        commandingOfficer: modCommandingOfficer,
        permissions: modPermissions,
        status: modStatus === "pending" ? "active" : modStatus
      }, { merge: true });

      alert(data.message || "Officer approved and credentials registered.");
      setIsDrawerOpen(false);
      await loadAdminData();
    } catch (err: any) {
      console.warn("Approval API failed. Applying to local sandbox instead.", err);
      
      const currentApps = getLocalData<OfficerApplication[]>("orca_applications", MOCK_OFFICER_APPLICATIONS);
      const updatedApps = currentApps.map(a => a.id === app.id ? { 
        ...a, 
        status: (modStatus === "pending" ? "active" : modStatus) as any, 
        firstName: modFirstName,
        lastName: modLastName,
        name: approvedName,
        rank: modRank,
        district: modDistrict,
        station: modStation,
        mobile: modMobile,
        email: modEmail,
        requestedAccess: modRequestedAccess,
        securityClearance: modSecurityClearance,
        assignedRole: modRole,
        permissions: modPermissions,
        division: modDivision,
        stateUnit: modStateUnit,
        department: modDepartment,
        reportingOfficer: modReportingOfficer,
        supervisor: modSupervisor,
        departmentHead: modDepartmentHead,
        commandingOfficer: modCommandingOfficer,
        timeline: [
          ...(a.timeline || []),
          { status: modStatus === "pending" ? "active" : modStatus, date: new Date().toISOString(), remarks: `Application approved by ${officerProfile?.name || "DSP R. K. Shastry, IPS"} (Sandbox).` }
        ]
      } : a);
      setLocalData("orca_applications", updatedApps);
      
      const currentOfficers = getLocalData<any[]>("orca_officers", MOCK_OFFICERS);
      const existingIndex = currentOfficers.findIndex(o => o.uid === app.id);
      const newOfficer = {
        uid: app.id,
        name: approvedName,
        badgeId: app.badgeId,
        email: modEmail || app.email,
        rank: modRank || app.rank,
        role: modRole,
        district: modDistrict || app.district,
        station: modStation || app.station,
        clearanceLevel: modSecurityClearance || "ISD-LEVEL-IV",
        active: modStatus === "suspended" || modStatus === "inactive" || modStatus === "rejected" ? false : true,
        lastLogin: new Date().toISOString(),
        mobile: modMobile || app.mobile,
        approvedAt: new Date().toISOString(),
        photoUrl: app.photoUrl || "",
        
        division: modDivision,
        stateUnit: modStateUnit,
        department: modDepartment,
        reportingOfficer: modReportingOfficer,
        supervisor: modSupervisor,
        departmentHead: modDepartmentHead,
        commandingOfficer: modCommandingOfficer,
        permissions: modPermissions,
        status: modStatus === "pending" ? "active" : modStatus
      };
      
      if (existingIndex > -1) {
        currentOfficers[existingIndex] = newOfficer;
      } else {
        currentOfficers.push(newOfficer);
      }
      setLocalData("orca_officers", currentOfficers);
      
      const currentLogs = getLocalData<any[]>("orca_audit_logs", MOCK_AUDIT_LOGS);
      currentLogs.unshift({
        timestamp: new Date().toISOString(),
        officer: officerProfile?.name || "DSP R. K. Shastry, IPS",
        action: `[Sandbox] Approved and registered officer: ${approvedName} (${app.badgeId}) under Role: ${modRole}`,
        module: "Officer Applications",
        ipAddress: "127.0.0.1 (Local)",
        status: "Success"
      });
      setLocalData("orca_audit_logs", currentLogs);
      
      alert(`Officer ${approvedName} successfully approved and provisioned in local sandbox mode.`);
      setIsDrawerOpen(false);
      await loadAdminData();
    } finally {
      setActionLoading(false);
    }
  };

  // Rejection flow handler
  const handleRejectApp = async (app: OfficerApplication) => {
    const reason = prompt(`Enter rejection reason for ${app.name}:`, "Incomplete police station verification record.");
    if (reason === null) return; // cancel
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/reject-officer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: app.id,
          email: app.email,
          name: app.name,
          reason: reason,
          adminName: officerProfile?.name || "DSP R. K. Shastry, IPS"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection API returned error");

      alert(data.message || "Officer application status marked as rejected.");
      setIsDrawerOpen(false);
      await loadAdminData();
    } catch (err: any) {
      console.warn("Rejection API failed. Applying to local sandbox instead.", err);
      
      const currentApps = getLocalData<OfficerApplication[]>("orca_applications", MOCK_OFFICER_APPLICATIONS);
      const updatedApps = currentApps.map(a => a.id === app.id ? { ...a, status: "rejected" as const, remarks: reason } : a);
      setLocalData("orca_applications", updatedApps);
      
      const currentLogs = getLocalData<any[]>("orca_audit_logs", MOCK_AUDIT_LOGS);
      currentLogs.unshift({
        timestamp: new Date().toISOString(),
        officer: officerProfile?.name || "DSP R. K. Shastry, IPS",
        action: `[Sandbox] Rejected officer application: ${app.name} (${app.badgeId}). Reason: ${reason}`,
        module: "Officer Applications",
        ipAddress: "127.0.0.1 (Local)",
        status: "Success"
      });
      setLocalData("orca_audit_logs", currentLogs);
      
      alert(`Officer application status marked as rejected in local sandbox mode.`);
      setIsDrawerOpen(false);
      await loadAdminData();
    } finally {
      setActionLoading(false);
    }
  };

  // Save progress of the review details
  const handleSaveReview = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    
    // Construct updated application object with modified fields
    const updatedApp = {
      ...selectedApp,
      firstName: modFirstName,
      lastName: modLastName,
      name: `${modFirstName} ${modLastName}`.trim(),
      rank: modRank,
      station: modStation,
      district: modDistrict,
      mobile: modMobile,
      email: modEmail,
      requestedAccess: modRequestedAccess,
      internalRemarks: modInternalRemarks,
      remarks: modInternalRemarks, // keep compatible
      priority: modPriority,
      assignedReviewer: modAssignedReviewer,
      securityClearance: modSecurityClearance,
      clearanceLevel: modSecurityClearance, // keep compatible
      bgVerification: modBgVerification,
      deptVerification: modDeptVerification,
      supervisorApproval: modSupervisorApproval,
      status: modStatus as any,
      timeline: [
        ...(selectedApp.timeline || []),
        { status: modStatus, date: new Date().toISOString(), remarks: `Review checkpoints updated by ${officerProfile?.name || "DSP R. K. Shastry, IPS"}.` }
      ]
    };

    try {
      // Try Firestore write
      const appDocRef = doc(db, "officer_applications", selectedApp.id);
      await setDoc(appDocRef, updatedApp, { merge: true });
      
      // Also update the officers table status if status changed in save
      const officerDocRef = doc(db, "officers", selectedApp.id);
      await setDoc(officerDocRef, {
        name: `${modFirstName} ${modLastName}`.trim(),
        rank: modRank,
        station: modStation,
        district: modDistrict,
        mobile: modMobile,
        email: modEmail,
        requestedAccess: modRequestedAccess,
        clearanceLevel: modSecurityClearance,
        active: modStatus === "approved"
      }, { merge: true });

      await addDoc(collection(db, "audit_logs"), {
        timestamp: new Date().toISOString(),
        officer: officerProfile?.name || "DSP R. K. Shastry, IPS",
        action: `Saved review parameters for applicant: ${selectedApp.name}`,
        module: "Officer Applications",
        ipAddress: "10.0.12.94",
        status: "Success"
      });

      alert("Application review progress saved successfully.");
      await loadAdminData();
    } catch (err: any) {
      console.warn("Firestore save review failed. Saving locally.", err);
      // Fallback local storage update
      const currentApps = getLocalData<OfficerApplication[]>("orca_applications", MOCK_OFFICER_APPLICATIONS);
      const updatedApps = currentApps.map(a => a.id === selectedApp.id ? updatedApp : a);
      setLocalData("orca_applications", updatedApps);

      const currentOfficers = getLocalData<any[]>("orca_officers", MOCK_OFFICERS);
      const updatedOfficers = currentOfficers.map(o => o.uid === selectedApp.id ? {
        ...o,
        name: `${modFirstName} ${modLastName}`.trim(),
        rank: modRank,
        station: modStation,
        district: modDistrict,
        mobile: modMobile,
        email: modEmail,
        requestedAccess: modRequestedAccess,
        clearanceLevel: modSecurityClearance,
        active: modStatus === "approved"
      } : o);
      setLocalData("orca_officers", updatedOfficers);
      
      alert("Application review progress saved successfully in local browser sandbox.");
      await loadAdminData();
    } finally {
      setActionLoading(false);
    }
  };

  // Request additional verification document information
  const handleRequestInfo = async () => {
    if (!selectedApp) return;
    const reqRemarks = prompt("Enter description of documents or information requested from the officer:", "Require certified service book extract or command verification note.");
    if (reqRemarks === null) return;
    setActionLoading(true);

    const updatedApp = {
      ...selectedApp,
      status: "awaiting" as const,
      internalRemarks: modInternalRemarks + `\n[Info Request]: ${reqRemarks}`,
      timeline: [
        ...(selectedApp.timeline || []),
        { status: "awaiting", date: new Date().toISOString(), remarks: `Additional Info Requested: ${reqRemarks}` }
      ]
    };

    try {
      const appDocRef = doc(db, "officer_applications", selectedApp.id);
      await setDoc(appDocRef, updatedApp, { merge: true });

      await addDoc(collection(db, "audit_logs"), {
        timestamp: new Date().toISOString(),
        officer: officerProfile?.name || "DSP R. K. Shastry, IPS",
        action: `Requested additional info for applicant: ${selectedApp.name}`,
        module: "Officer Applications",
        ipAddress: "10.0.12.94",
        status: "Success"
      });
      alert("Application marked as 'Awaiting Documents' and applicant notified.");
      setIsDrawerOpen(false);
      await loadAdminData();
    } catch (err) {
      console.warn("Firestore request info failed. Saving locally.", err);
      const currentApps = getLocalData<OfficerApplication[]>("orca_applications", MOCK_OFFICER_APPLICATIONS);
      const updatedApps = currentApps.map(a => a.id === selectedApp.id ? updatedApp : a);
      setLocalData("orca_applications", updatedApps);

      alert("Application marked as 'Awaiting Documents' in local sandbox.");
      setIsDrawerOpen(false);
      await loadAdminData();
    } finally {
      setActionLoading(false);
    }
  };

  // Download raw application docket
  const handleDownloadApplication = () => {
    if (!selectedApp) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      ...selectedApp,
      firstName: modFirstName,
      lastName: modLastName,
      rank: modRank,
      station: modStation,
      district: modDistrict,
      mobile: modMobile,
      email: modEmail,
      requestedAccess: modRequestedAccess,
      internalRemarks: modInternalRemarks,
      priority: modPriority,
      assignedReviewer: modAssignedReviewer,
      securityClearance: modSecurityClearance,
      bgVerification: modBgVerification,
      deptVerification: modDeptVerification,
      supervisorApproval: modSupervisorApproval
    }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ORCA_Application_${selectedApp.badgeId || selectedApp.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print full officer application panel
  const handlePrintApplication = () => {
    if (!selectedApp) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const adminName = officerProfile?.name || "DSP R. K. Shastry, IPS";
    const dateStr = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Application - ${selectedApp.name}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: black; line-height: 1.6; }
            h2 { border-bottom: 2px solid black; padding-bottom: 10px; text-align: center; }
            .section { margin-bottom: 20px; border: 1px solid #000; padding: 15px; }
            .section-title { font-weight: bold; text-transform: uppercase; background: #eee; padding: 4px 8px; margin-bottom: 10px; border-bottom: 1px solid #000; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>ORCA OFFICER REGISTRATION DOCKET</h2>
          <div class="section">
            <div class="section-title">1. Personal Information</div>
            <div class="grid">
              <div><span class="label">First Name:</span> ${modFirstName || selectedApp.name.split(" ")[0]}</div>
              <div><span class="label">Last Name:</span> ${modLastName || selectedApp.name.split(" ").slice(1).join(" ")}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">2. Officer Designation</div>
            <div class="grid">
              <div><span class="label">Badge ID / Officer ID:</span> ${selectedApp.badgeId}</div>
              <div><span class="label">Rank / Designation:</span> ${modRank}</div>
              <div><span class="label">Police Station / Unit:</span> ${modStation}</div>
              <div><span class="label">District:</span> ${modDistrict}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">3. Contact & Security Checks</div>
            <div class="grid">
              <div><span class="label">Official Email:</span> ${modEmail}</div>
              <div><span class="label">Mobile Number:</span> ${modMobile || "N/A"}</div>
              <div><span class="label">Password Status:</span> ✅ Created</div>
              <div><span class="label">Requested Access Level:</span> ${modRequestedAccess}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">4. Administrative Review Parameters</div>
            <div class="grid">
              <div><span class="label">Priority Clearance:</span> ${modPriority}</div>
              <div><span class="label">Security Clearance:</span> ${modSecurityClearance}</div>
              <div><span class="label">Background Check:</span> ${modBgVerification.toUpperCase()}</div>
              <div><span class="label">Department Check:</span> ${modDeptVerification.toUpperCase()}</div>
              <div><span class="label">Supervisor Signoff:</span> ${modSupervisorApproval.toUpperCase()}</div>
              <div><span class="label">Assigned Reviewer:</span> ${modAssignedReviewer || "Unassigned"}</div>
            </div>
            <div style="margin-top: 10px;">
              <span class="label">Internal Remarks:</span><br/>
              <p style="white-space: pre-wrap; font-style: italic;">${modInternalRemarks || "No administrative remarks recorded."}</p>
            </div>
          </div>
          <div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div>
              Date Printed: ${dateStr}
            </div>
            <div style="text-align: center;">
              ___________________________<br/>
              ${adminName}<br/>
              ORCA Authority Representative
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Generate official approval/rejection printable letter window
  const generateDossierLetter = (app: OfficerApplication, type: "approval" | "rejection") => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const adminName = officerProfile?.name || "DSP R. K. Shastry, IPS";
    const dateStr = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();

    printWindow.document.write(`
      <html>
        <head>
          <title>OFFICIAL_BRIEF_${type.toUpperCase()}_${app.badgeId}</title>
          <style>
            body { font-family: 'Georgia', serif; padding: 50px; color: #111; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px double #333; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
            .subtitle { font-size: 12px; letter-spacing: 1px; color: #555; }
            .metadata { margin-bottom: 30px; font-size: 13px; font-family: 'Courier New', monospace; }
            .content { margin-bottom: 40px; text-align: justify; }
            .sign { float: right; text-align: center; margin-top: 50px; font-size: 14px; }
            .footer { border-top: 1px solid #ccc; padding-top: 10px; margin-top: 80px; font-size: 10px; color: #777; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Internal Security Division (ISD)</div>
            <div class="subtitle">STATE INTELLIGENCE DIRECTORATE • GOVERNMENT OF KARNATAKA</div>
          </div>
          <div class="metadata">
            <strong>OFFICIAL BRIEF IDENTIFIER:</strong> ISD-BRIEF-${app.badgeId}-${Date.now().toString().slice(-4)}<br/>
            <strong>DATE:</strong> ${dateStr} IST<br/>
            <strong>TO:</strong> ${app.name} (${app.rank})<br/>
            <strong>STATION:</strong> ${app.station}, ${app.district}
          </div>
          <div class="content">
            <p>
              ${type === "approval" ? `
                We are pleased to inform you that your application for registration onto the <strong>Organized Crime Analysis Authority (O.C.R.A) AI platform</strong> has been officially <strong>APPROVED</strong> under active administrative clearance. 
                Your assigned credentials have been securely provisioned in our directory database ledger. 
                You are authorized to log in using your Badge ID (<strong>${app.badgeId}</strong>) and your custom password.
              ` : `
                Your application for access to the <strong>Organized Crime Analysis Authority (O.C.R.A) AI platform</strong> has been <strong>REJECTED</strong> following security review. 
                Remarks: <em>${app.remarks || "Registration details failed police verification check."}</em>
                You may resubmit an application with corrected station verification parameters if applicable.
              `}
            </p>
            <p>
              Please note that your access and queries on this intelligence node are actively audited under cryptographic signatures. Any unauthorized publication, distribution, or duplication of Sealed Dossiers generated by the platform constitutes a severe state offense.
            </p>
          </div>
          <div class="sign">
            ________________________<br/>
            <strong>${adminName}</strong><br/>
            Commanding Authority / Security Directorate
          </div>
          <div class="footer">
            CONFIDENTIAL LAW ENFORCEMENT INTERNAL DOCUMENT. STATE POLICE SECURE NETWORK.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleStartEditProfile = (off: any) => {
    setEditProfileName(off.name || "");
    setEditProfileRank(off.rank || "");
    setEditProfileEmail(off.email || "");
    setEditProfileDistrict(off.district || "");
    setEditProfileStation(off.station || "");
    setEditProfileClearance(off.clearanceLevel || "ISD-LEVEL-IV");
    setEditProfileMobile(off.mobile || off.phone || "");
    setEditProfileActive(off.active ?? true);
    setIsEditingProfile(true);
  };

  const handleSaveProfileEdit = async () => {
    if (!activeOfficerProfile) return;
    setActionLoading(true);
    try {
      const docRef = doc(db, "officers", activeOfficerProfile.uid);
      const updateData = {
        name: editProfileName,
        rank: editProfileRank,
        email: editProfileEmail,
        district: editProfileDistrict,
        station: editProfileStation,
        clearanceLevel: editProfileClearance,
        mobile: editProfileMobile,
        phone: editProfileMobile,
        active: editProfileActive
      };
      await setDoc(docRef, updateData, { merge: true });
      
      // Update local state lists instantly
      setOfficers((prev: any[]) => prev.map(o => o.uid === activeOfficerProfile.uid ? { ...o, ...updateData } : o));
      setActiveOfficerProfile((prev: any) => prev ? { ...prev, ...updateData } : null);
      
      // Audit log
      await addDoc(collection(db, "audit_logs"), {
        timestamp: new Date().toISOString(),
        officer: officerProfile?.name || "DSP R. K. Shastry, IPS",
        action: `Edited profile credentials for Officer: ${editProfileName} (Badge: ${activeOfficerProfile.badgeId})`,
        module: "Officer Directory",
        status: "success",
        ip: "10.10.42.1"
      });
      
      setIsEditingProfile(false);
      loadAdminData(); // Refresh complete list
    } catch (err) {
      console.error(err);
      alert("Error saving profile details.");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Toggle-Status for Officer Directory Entries
  const handleToggleOfficerStatus = async (off: any) => {
    const nextActiveState = !off.active;
    if (!confirm(`Are you sure you want to ${nextActiveState ? "Activate" : "Suspend"} Officer ${off.name}?`)) return;
    setActionLoading(true);
    try {
      await setDoc(doc(db, "officers", off.uid), { active: nextActiveState }, { merge: true });
      await addDoc(collection(db, "audit_logs"), {
        timestamp: new Date().toISOString(),
        officer: officerProfile?.name || "DSP R. K. Shastry, IPS",
        action: `${nextActiveState ? "Activated" : "Suspended"} account: ${off.name} (${off.badgeId})`,
        module: "Officer Directory",
        ipAddress: "10.0.12.94",
        status: "Success"
      });
      alert(`Officer ${off.name} successfully ${nextActiveState ? "activated" : "suspended"}.`);
      await loadAdminData();
    } catch (err: any) {
      alert("Failed to adjust officer status: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // RBAC Permission change toggling
  const handlePermissionToggle = (role: string, permission: string) => {
    setRbacPermissions(prev => {
      const activePerms = prev[role] || [];
      const updatedPerms = activePerms.includes(permission)
        ? activePerms.filter(p => p !== permission)
        : [...activePerms, permission];
      return { ...prev, [role]: updatedPerms };
    });
  };

  // Save Settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemSettings) return;
    setActionLoading(true);
    try {
      await saveSystemSettings(systemSettings);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
      
      // Log Settings Change
      await addDoc(collection(db, "audit_logs"), {
        timestamp: new Date().toISOString(),
        officer: officerProfile?.name || "DSP R. K. Shastry, IPS",
        action: "Updated O.C.R.A Admin System Settings",
        module: "Settings",
        ipAddress: "10.0.12.94",
        status: "Success"
      });
    } catch (err: any) {
      console.warn("Firestore save settings failed due to permissions. Saving to sandbox.", err);
      setLocalData("orca_settings", systemSettings);
      
      const currentLogs = getLocalData<any[]>("orca_audit_logs", MOCK_AUDIT_LOGS);
      currentLogs.unshift({
        timestamp: new Date().toISOString(),
        officer: officerProfile?.name || "DSP R. K. Shastry, IPS",
        action: "[Sandbox] Updated O.C.R.A Admin System Settings",
        module: "Settings",
        ipAddress: "127.0.0.1 (Local)",
        status: "Success"
      });
      setLocalData("orca_audit_logs", currentLogs);
      
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter application arrays
  const filteredApps = applications.filter(app => {
    const nameToUse = app.name || "";
    const badgeToUse = app.badgeId || "";
    const emailToUse = app.email || "";
    const rankToUse = app.rank || "";
    const districtToUse = app.district || "";
    const stationToUse = app.station || "";
    const reviewerToUse = app.assignedReviewer || "";
    const accessToUse = app.requestedAccess || "";
    const statusToUse = app.status || "";

    const matchesSearch = nameToUse.toLowerCase().includes(appSearch.toLowerCase()) ||
                          badgeToUse.toLowerCase().includes(appSearch.toLowerCase()) ||
                          emailToUse.toLowerCase().includes(appSearch.toLowerCase()) ||
                          rankToUse.toLowerCase().includes(appSearch.toLowerCase()) ||
                          districtToUse.toLowerCase().includes(appSearch.toLowerCase()) ||
                          stationToUse.toLowerCase().includes(appSearch.toLowerCase());

    const matchesRank = appRankFilter === "ALL" || rankToUse === appRankFilter;
    const matchesDistrict = appDistrictFilter === "ALL" || districtToUse === appDistrictFilter;
    const matchesStation = appStationFilter === "ALL" || stationToUse.toLowerCase().includes(appStationFilter.toLowerCase());
    const matchesStatus = appStatusFilter === "ALL" || statusToUse === appStatusFilter;
    const matchesAccess = appAccessFilter === "ALL" || accessToUse === appAccessFilter;
    const matchesReviewer = appReviewerFilter === "ALL" || reviewerToUse.toLowerCase().includes(appReviewerFilter.toLowerCase());

    return matchesSearch && matchesRank && matchesDistrict && matchesStation && matchesStatus && matchesAccess && matchesReviewer;
  });

  // Sort application arrays
  const sortedApps = [...filteredApps].sort((a, b) => {
    if (appSortBy === "newest") {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    }
    if (appSortBy === "oldest") {
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    }
    if (appSortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (appSortBy === "priority") {
      const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const wA = priorityWeight[a.priority as "HIGH" | "MEDIUM" | "LOW"] || 0;
      const wB = priorityWeight[b.priority as "HIGH" | "MEDIUM" | "LOW"] || 0;
      return wB - wA;
    }
    return 0;
  });

  // Paginated applications list
  const totalPages = Math.ceil(sortedApps.length / itemsPerPage) || 1;
  const paginatedApps = sortedApps.slice((appPage - 1) * itemsPerPage, appPage * itemsPerPage);

  // Filter officer directories
  const filteredOfficers = officers.filter(off => {
    const matchesSearch = off.name.toLowerCase().includes(dirSearch.toLowerCase()) || 
                          off.badgeId.toLowerCase().includes(dirSearch.toLowerCase()) ||
                          off.email.toLowerCase().includes(dirSearch.toLowerCase());
    const matchesDistrict = dirDistrictFilter === "ALL" || off.district === dirDistrictFilter;
    const matchesRank = dirRankFilter === "ALL" || off.rank?.toLowerCase().includes(dirRankFilter.toLowerCase());
    return matchesSearch && matchesDistrict && matchesRank;
  });

  // Filter Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.officer.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          log.action.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesModule = auditModuleFilter === "ALL" || log.module === auditModuleFilter;
    return matchesSearch && matchesModule;
  });

  // Filter Verifications
  const filteredVerifications = verifications.filter(v => {
    const matchesSearch = v.documentName.toLowerCase().includes(verSearch.toLowerCase()) ||
                          v.verificationId.toLowerCase().includes(verSearch.toLowerCase()) ||
                          (v.verifiedBy && v.verifiedBy.toLowerCase().includes(verSearch.toLowerCase()));
    const matchesStatus = verStatusFilter === "ALL" || v.status === verStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Unique lists for dropdowns
  const uniqueDistricts = Array.from(new Set(officers.map(o => o.district).filter(Boolean)));
  const uniqueModules = Array.from(new Set(auditLogs.map(l => l.module).filter(Boolean)));

  // Show Loading Skeleton
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", color: ADMIN_THEME.textSecondary }}>
        <Loader2 style={{ width: 40, height: 40, animation: "spin 1s linear infinite", color: ADMIN_THEME.accentGold, marginBottom: 12 }} />
        <span style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace" }}>SYNCHRONIZING WITH IS SECURE LEDGER NODE...</span>
      </div>
    );
  }

  return (
    <div style={{ color: ADMIN_THEME.textPrimary, animation: "fadeIn 0.3s ease" }}>
      
      {/* 1. ADMIN DASHBOARD */}
      {adminTab === "admin-dashboard" && (
        <div>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: ADMIN_THEME.textPrimary, letterSpacing: "-0.02em" }}>Command Operations Console</h1>
              <p style={{ fontSize: 13, color: ADMIN_THEME.textSecondary }}>Administrative Security Core & Directory Management Panel</p>
            </div>
            <button
              onClick={handleSeedDatabase}
              disabled={actionLoading}
              style={{
                background: ADMIN_THEME.blue,
                color: "white",
                padding: "6px 14px",
                borderRadius: 4,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: ADMIN_THEME.shadow
              }}
            >
              <Database style={{ width: 14, height: 14 }} />
              {seedSuccess ? "Database Initialized!" : "Seed Security Data"}
            </button>
          </div>

          {/* KPI CARDS GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16, marginBottom: 24 }}>
            
            {/* Row 1 */}
            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: ADMIN_THEME.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                <span>Pending Applications</span>
                <UserCheck style={{ width: 14, height: 14, color: ADMIN_THEME.accentGold }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ADMIN_THEME.accentGold }}>
                {applications.filter(a => a.status === "pending").length}
              </div>
              <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Awaiting Administrative Review</div>
            </div>

            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: ADMIN_THEME.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                <span>Approved Officers</span>
                <Shield style={{ width: 14, height: 14, color: ADMIN_THEME.green }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ADMIN_THEME.textPrimary }}>
                {officers.filter(o => o.active).length}
              </div>
              <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Active Database Credentials</div>
            </div>

            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: ADMIN_THEME.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                <span>Rejected Applications</span>
                <X style={{ width: 14, height: 14, color: ADMIN_THEME.red }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ADMIN_THEME.textPrimary }}>
                {applications.filter(a => a.status === "rejected").length}
              </div>
              <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Security Review Denied Cases</div>
            </div>

            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: ADMIN_THEME.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                <span>Online Officers</span>
                <Activity style={{ width: 14, height: 14, color: ADMIN_THEME.green }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ADMIN_THEME.green }}>
                {officers.filter(o => o.active).length > 0 ? Math.max(1, Math.round(officers.filter(o => o.active).length * 0.4)) : 0}
              </div>
              <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Active Session Tokens</div>
            </div>

            {/* Row 2 */}
            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: ADMIN_THEME.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                <span>Today's Logins</span>
                <Clock style={{ width: 14, height: 14, color: ADMIN_THEME.blue }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ADMIN_THEME.textPrimary }}>14</div>
              <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Secure terminal sessions</div>
            </div>

            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: ADMIN_THEME.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                <span>Reports Generated Today</span>
                <FileText style={{ width: 14, height: 14, color: ADMIN_THEME.accentGold }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ADMIN_THEME.textPrimary }}>9</div>
              <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>A4 sealed PDF briefs printed</div>
            </div>

            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: ADMIN_THEME.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                <span>AI Conversations Today</span>
                <Bot style={{ width: 14, height: 14, color: ADMIN_THEME.accentGold }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ADMIN_THEME.textPrimary }}>32</div>
              <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Groq model API invocations</div>
            </div>

            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: ADMIN_THEME.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                <span>Verification Requests</span>
                <FileCheck style={{ width: 14, height: 14, color: ADMIN_THEME.green }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ADMIN_THEME.textPrimary }}>
                {verifications.length}
              </div>
              <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Cryptographic document checks</div>
            </div>

            {/* Row 3 */}
            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: ADMIN_THEME.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                <span>Failed Logins</span>
                <AlertTriangle style={{ width: 14, height: 14, color: ADMIN_THEME.red }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ADMIN_THEME.red }}>2</div>
              <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Alert blocks under security watch</div>
            </div>

            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: ADMIN_THEME.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                <span>System Health</span>
                <Server style={{ width: 14, height: 14, color: ADMIN_THEME.green }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ADMIN_THEME.green }}>99.8%</div>
              <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Server cluster online index</div>
            </div>

            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: ADMIN_THEME.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                <span>Storage Usage</span>
                <Database style={{ width: 14, height: 14, color: ADMIN_THEME.blue }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ADMIN_THEME.textPrimary }}>4.2 GB</div>
              <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Firestore document weights</div>
            </div>

            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: ADMIN_THEME.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                <span>API Status</span>
                <CloudLightning style={{ width: 14, height: 14, color: ADMIN_THEME.green }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ADMIN_THEME.green }}>ONLINE</div>
              <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Groq language gateway sync</div>
            </div>

          </div>

          {/* LOWER FEEDS SUMMARY */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
            {/* Audit Logs */}
            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "JetBrains Mono" }}>Recent Security Audit Trail</span>
                <History style={{ width: 14, height: 14, color: ADMIN_THEME.textSecondary }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {auditLogs.slice(0, 5).map((log, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", borderBottom: idx !== 4 ? `1px solid ${ADMIN_THEME.border}` : "none", paddingBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{log.action}</div>
                      <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary }}>{log.officer} • {log.module}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: ADMIN_THEME.textMuted }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                      <span style={{ fontSize: 9, background: "rgba(16,185,129,0.1)", color: ADMIN_THEME.green, padding: "1px 4px", borderRadius: 3, fontWeight: 600 }}>SUCCESS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Health alerts */}
            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "JetBrains Mono" }}>State Server Cluster Status</span>
                <Server style={{ width: 14, height: 14, color: ADMIN_THEME.green }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: ADMIN_THEME.textSecondary }}>Firebase DB Node</span>
                  <span style={{ color: ADMIN_THEME.green, fontWeight: 600 }}>● Connected (12ms)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: ADMIN_THEME.textSecondary }}>Groq AI API Node</span>
                  <span style={{ color: ADMIN_THEME.green, fontWeight: 600 }}>● Online (244ms)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: ADMIN_THEME.textSecondary }}>Sealed Document Ledger</span>
                  <span style={{ color: ADMIN_THEME.green, fontWeight: 600 }}>● Locked & Audited</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: ADMIN_THEME.textSecondary }}>Proxy Security Firewall</span>
                  <span style={{ color: ADMIN_THEME.green, fontWeight: 600 }}>● active</span>
                </div>
                <div style={{ background: "rgba(255,153,51,0.06)", border: "1px solid rgba(255,153,51,0.2)", borderRadius: 6, padding: 10, marginTop: 12, display: "flex", gap: 8, color: ADMIN_THEME.accentGold }}>
                  <Info style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 10.5, lineHeight: 1.4 }}>
                    <strong>Notice:</strong> MFA configuration active for all administration accounts. Sessions automatically terminate after 30 minutes of terminal inactivity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. OFFICER APPLICATIONS */}
      {adminTab === "admin-applications" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Officer Ingress Applications</h1>
              <p style={{ fontSize: 12, color: ADMIN_THEME.textSecondary }}>Approve or reject credentials and station clearances for applying police officers</p>
            </div>
            <div style={{ position: "relative" }}>
              <Search style={{ width: 14, height: 14, color: ADMIN_THEME.textSecondary, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search name, badge ID, station..."
                value={appSearch}
                onChange={e => { setAppSearch(e.target.value); setAppPage(1); }}
                style={{
                  background: ADMIN_THEME.cardBg,
                  border: `1px solid ${ADMIN_THEME.border}`,
                  borderRadius: 6,
                  padding: "6px 12px 6px 32px",
                  fontSize: 12,
                  color: ADMIN_THEME.textPrimary,
                  outline: "none",
                  width: "250px"
                }}
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{
            background: ADMIN_THEME.cardBg,
            border: `1px solid ${ADMIN_THEME.border}`,
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12
          }}>
            <div>
              <label style={{ display: "block", fontSize: 9, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Rank Filter</label>
              <select
                value={appRankFilter}
                onChange={e => { setAppRankFilter(e.target.value); setAppPage(1); }}
                style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, color: ADMIN_THEME.textPrimary, cursor: "pointer" }}
              >
                <option value="ALL">All Ranks</option>
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 9, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>District Jurisdiction</label>
              <select
                value={appDistrictFilter}
                onChange={e => { setAppDistrictFilter(e.target.value); setAppPage(1); }}
                style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, color: ADMIN_THEME.textPrimary, cursor: "pointer" }}
              >
                <option value="ALL">All Districts</option>
                {KARNATAKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 9, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Application Status</label>
              <select
                value={appStatusFilter}
                onChange={e => { setAppStatusFilter(e.target.value); setAppPage(1); }}
                style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, color: ADMIN_THEME.textPrimary, cursor: "pointer" }}
              >
                <option value="ALL">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="under_review">Under Review</option>
                <option value="awaiting">Awaiting Documents</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 9, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Sort By</label>
              <select
                value={appSortBy}
                onChange={e => { setAppSortBy(e.target.value); setAppPage(1); }}
                style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, color: ADMIN_THEME.textPrimary, cursor: "pointer" }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="priority">Priority Level</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 9, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Requested Access</label>
              <select
                value={appAccessFilter}
                onChange={e => { setAppAccessFilter(e.target.value); setAppPage(1); }}
                style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, color: ADMIN_THEME.textPrimary, cursor: "pointer" }}
              >
                <option value="ALL">All Access Levels</option>
                {ACCESS_MODULES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {paginatedApps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: ADMIN_THEME.textSecondary, background: ADMIN_THEME.cardBg, borderRadius: 8, border: `1px solid ${ADMIN_THEME.border}` }}>
              <UserCheck style={{ width: 48, height: 48, margin: "0 auto 12px", opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>No applications registered matching filters</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Awaiting new officer registrations or dev seeding.</div>
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {paginatedApps.map(app => (
                  <div 
                    key={app.id}
                    style={{
                      background: ADMIN_THEME.cardBg,
                      border: `1px solid ${app.status === "pending" && app.priority === "HIGH" ? "rgba(255, 153, 51, 0.4)" : ADMIN_THEME.border}`,
                      borderRadius: 8,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                      overflow: "hidden"
                    }}
                  >
                    {/* Priority Tag */}
                    {(app.status === "pending" || app.status === "under_review") && (
                      <span style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        fontSize: 9,
                        fontWeight: 800,
                        background: app.priority === "HIGH" ? `${ADMIN_THEME.red}20` : `${ADMIN_THEME.accentGold}20`,
                        color: app.priority === "HIGH" ? ADMIN_THEME.red : ADMIN_THEME.accentGold,
                        padding: "2px 6px",
                        borderRadius: 4
                      }}>
                        {app.priority} PRIORITY
                      </span>
                    )}

                    {/* Body */}
                    <div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: "rgba(0,31,63,0.08)",
                          border: `1.5px solid ${app.status === "approved" ? ADMIN_THEME.green : ADMIN_THEME.accentGold}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          fontWeight: 900,
                          color: ADMIN_THEME.textPrimary
                        }}>
                          {getCleanInitials(app.name)}
                        </div>
                        <div>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>{app.name}</h3>
                          <p style={{ fontSize: 11, color: ADMIN_THEME.textSecondary, margin: 0 }}>{app.rank} • ID: {app.badgeId}</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11, color: ADMIN_THEME.textSecondary, marginBottom: 16 }}>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>District:</strong> {app.district}</div>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Station:</strong> {app.station}</div>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Email:</strong> {app.email}</div>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Mobile:</strong> {app.mobile || "N/A"}</div>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Access Level:</strong> <span style={{ color: ADMIN_THEME.accentGold, fontWeight: 600 }}>{app.requestedAccess}</span></div>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Submitted:</strong> {new Date(app.submittedAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${ADMIN_THEME.border}`, paddingTop: 12 }}>
                      <div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: app.status === "approved" ? ADMIN_THEME.green : (app.status === "rejected" ? ADMIN_THEME.red : ADMIN_THEME.accentGold)
                        }}>
                          ● {app.status === "pending" ? "Pending Review" : app.status.replace("_", " ")}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setIsDrawerOpen(true);
                        }}
                        style={{
                          background: ADMIN_THEME.cardBg,
                          border: `1px solid ${ADMIN_THEME.border}`,
                          color: ADMIN_THEME.textSecondary,
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        Review <ChevronRight style={{ width: 12, height: 12 }} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 24, borderTop: `1px solid ${ADMIN_THEME.border}`, paddingTop: 16 }}>
                  <button
                    disabled={appPage === 1}
                    onClick={() => setAppPage(p => Math.max(1, p - 1))}
                    style={{
                      background: appPage === 1 ? "rgba(0,0,0,0.02)" : ADMIN_THEME.cardBg,
                      border: `1px solid ${ADMIN_THEME.border}`,
                      color: appPage === 1 ? ADMIN_THEME.textMuted : ADMIN_THEME.textPrimary,
                      padding: "6px 12px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: appPage === 1 ? "not-allowed" : "pointer"
                    }}
                  >
                    ◀ Previous Page
                  </button>
                  <span style={{ fontSize: 12, color: ADMIN_THEME.textSecondary, fontFamily: "JetBrains Mono" }}>
                    Page {appPage} of {totalPages} ({filteredApps.length} Applications)
                  </span>
                  <button
                    disabled={appPage === totalPages}
                    onClick={() => setAppPage(p => Math.min(totalPages, p + 1))}
                    style={{
                      background: appPage === totalPages ? "rgba(0,0,0,0.02)" : ADMIN_THEME.cardBg,
                      border: `1px solid ${ADMIN_THEME.border}`,
                      color: appPage === totalPages ? ADMIN_THEME.textMuted : ADMIN_THEME.textPrimary,
                      padding: "6px 12px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: appPage === totalPages ? "not-allowed" : "pointer"
                    }}
                  >
                    Next Page ▶
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. OFFICER DIRECTORY */}
      {adminTab === "admin-directory" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Approved Officer Directory</h1>
              <p style={{ fontSize: 12, color: ADMIN_THEME.textSecondary }}>View profiles, adjust station assignments, and manage access parameters</p>
            </div>
            
            {/* Filters */}
            <div style={{ display: "flex", gap: 10 }}>
              <select
                value={dirDistrictFilter}
                onChange={e => setDirDistrictFilter(e.target.value)}
                style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: ADMIN_THEME.textPrimary }}
              >
                <option value="ALL">All Districts</option>
                {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={dirRankFilter}
                onChange={e => setDirRankFilter(e.target.value)}
                style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: ADMIN_THEME.textPrimary }}
              >
                <option value="ALL">All Ranks</option>
                <option value="Superintendent">Superintendent</option>
                <option value="Inspector">Inspector</option>
                <option value="Sub Inspector">Sub Inspector</option>
                <option value="Constable">Constable</option>
              </select>
              <div style={{ position: "relative" }}>
                <Search style={{ width: 12, height: 12, color: ADMIN_THEME.textSecondary, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search officers..."
                  value={dirSearch}
                  onChange={e => setDirSearch(e.target.value)}
                  style={{
                    background: ADMIN_THEME.cardBg,
                    border: `1px solid ${ADMIN_THEME.border}`,
                    borderRadius: 6,
                    padding: "4px 10px 4px 28px",
                    fontSize: 12,
                    color: ADMIN_THEME.textPrimary,
                    width: "180px",
                    outline: "none"
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
            {/* Officers Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filteredOfficers.map(off => (
                <div 
                  key={off.uid}
                  style={{
                    background: ADMIN_THEME.cardBg,
                    border: `1px solid ${ADMIN_THEME.border}`,
                    borderRadius: 8,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "rgba(0,31,63,0.08)",
                        border: `1.5px solid ${off.active ? ADMIN_THEME.green : ADMIN_THEME.red}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: ADMIN_THEME.textPrimary
                      }}>
                        {getCleanInitials(off.name)}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 13.5, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>{off.name}</h4>
                        <p style={{ fontSize: 10.5, color: ADMIN_THEME.textSecondary }}>{off.rank} • Badge: {off.badgeId}</p>
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: ADMIN_THEME.textSecondary, display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
                      <div><strong style={{ color: ADMIN_THEME.textPrimary }}>District:</strong> {off.district}</div>
                      <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Station:</strong> {off.station}</div>
                      <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Email:</strong> {off.email}</div>
                      <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Phone:</strong> {off.mobile || off.phone || "N/A"}</div>
                      <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Access Level:</strong> <span style={{ color: ADMIN_THEME.accentGold, fontWeight: 600 }}>{off.requestedAccess || "Full Investigator Access"}</span></div>
                      <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Clearance:</strong> <span style={{ color: ADMIN_THEME.accentGold, fontWeight: 600 }}>{off.clearanceLevel || "ISD-LEVEL-IV"}</span></div>
                      <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Last Login:</strong> {off.lastLogin ? new Date(off.lastLogin).toLocaleString() : "Never"}</div>
                      <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Status:</strong> <span style={{ color: off.active ? ADMIN_THEME.green : ADMIN_THEME.red, fontWeight: 700 }}>{off.active ? "ACTIVE" : "INACTIVE / SUSPENDED"}</span></div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${ADMIN_THEME.border}`, paddingTop: 10 }}>
                    <button
                      onClick={() => setActiveOfficerProfile(off)}
                      style={{
                        flex: 1,
                        background: ADMIN_THEME.cardBg,
                        border: `1px solid ${ADMIN_THEME.border}`,
                        borderRadius: 4,
                        color: ADMIN_THEME.textSecondary,
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: "4px 8px",
                        cursor: "pointer"
                      }}
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleToggleOfficerStatus(off)}
                      disabled={actionLoading}
                      style={{
                        background: off.active ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)",
                        border: `1px solid ${off.active ? ADMIN_THEME.red : ADMIN_THEME.green}`,
                        borderRadius: 4,
                        color: off.active ? ADMIN_THEME.red : ADMIN_THEME.green,
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: "4px 8px",
                        cursor: "pointer"
                      }}
                    >
                      {off.active ? "Suspend" : "Activate"}
                    </button>
                  </div>

                </div>
              ))}
            </div>

            {/* Profile Detail Panel Popup */}
            {activeOfficerProfile && (
              <div 
                style={{ 
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  backgroundColor: "rgba(2, 8, 19, 0.4)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 99999
                }}
                onClick={() => { setActiveOfficerProfile(null); setIsEditingProfile(false); }}
              >
                <div 
                  style={{ 
                    background: ADMIN_THEME.cardBg, 
                    border: `1px solid ${ADMIN_THEME.border}`, 
                    borderRadius: 12, 
                    padding: 24, 
                    width: "420px", 
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
                    display: "flex", 
                    flexDirection: "column",
                    animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 12, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>{isEditingProfile ? "Edit Officer Profile" : "Officer Ingress Card"}</h3>
                    <button onClick={() => { setActiveOfficerProfile(null); setIsEditingProfile(false); }} style={{ background: "none", border: "none", color: ADMIN_THEME.textSecondary, cursor: "pointer" }}><X style={{ width: 16, height: 16 }} /></button>
                  </div>

                  {isEditingProfile ? (
                    /* Edit Form View */
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Full Name</label>
                        <input 
                          type="text" 
                          value={editProfileName} 
                          onChange={e => setEditProfileName(e.target.value)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                        />
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Rank / Designation</label>
                          <select 
                            value={editProfileRank} 
                            onChange={e => setEditProfileRank(e.target.value)} 
                            style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, cursor: "pointer" }}
                          >
                            {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Clearance Level</label>
                          <select 
                            value={editProfileClearance} 
                            onChange={e => setEditProfileClearance(e.target.value)} 
                            style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, cursor: "pointer" }}
                          >
                            <option value="ISD-LEVEL-I">ISD-LEVEL-I</option>
                            <option value="ISD-LEVEL-II">ISD-LEVEL-II</option>
                            <option value="ISD-LEVEL-III">ISD-LEVEL-III</option>
                            <option value="ISD-LEVEL-IV">ISD-LEVEL-IV</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Email Address</label>
                        <input 
                          type="email" 
                          value={editProfileEmail} 
                          onChange={e => setEditProfileEmail(e.target.value)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>District</label>
                          <select 
                            value={editProfileDistrict} 
                            onChange={e => setEditProfileDistrict(e.target.value)} 
                            style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, cursor: "pointer" }}
                          >
                            {KARNATAKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Account Status</label>
                          <select 
                            value={editProfileActive ? "active" : "suspended"} 
                            onChange={e => setEditProfileActive(e.target.value === "active")} 
                            style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, cursor: "pointer" }}
                          >
                            <option value="active">Active Clearance</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Station Assignment</label>
                        <input 
                          type="text" 
                          value={editProfileStation} 
                          onChange={e => setEditProfileStation(e.target.value)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Contact Phone</label>
                        <input 
                          type="text" 
                          value={editProfileMobile} 
                          onChange={e => setEditProfileMobile(e.target.value)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                        />
                      </div>

                      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          style={{ flex: 1, background: "none", border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "10px 0", fontSize: 11, color: ADMIN_THEME.textSecondary, fontWeight: 700, cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveProfileEdit}
                          disabled={actionLoading}
                          style={{ flex: 1, background: ADMIN_THEME.green, border: "none", borderRadius: 6, padding: "10px 0", fontSize: 11, color: "white", fontWeight: 800, cursor: "pointer" }}
                        >
                          {actionLoading ? "Saving..." : "Save Details"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Read-Only Details View */
                    <>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
                        <div style={{
                          width: 68,
                          height: 68,
                          borderRadius: "50%",
                          background: "rgba(0,31,63,0.08)",
                          border: `2px solid ${ADMIN_THEME.accentGold}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 22,
                          fontWeight: 800,
                          color: ADMIN_THEME.textPrimary,
                          marginBottom: 10
                        }}>
                          {getCleanInitials(activeOfficerProfile.name)}
                        </div>
                        <h4 style={{ fontSize: 16, fontWeight: 700, color: ADMIN_THEME.textPrimary, textAlign: "center" }}>{activeOfficerProfile.name}</h4>
                        <p style={{ fontSize: 11, color: ADMIN_THEME.textSecondary }}>{activeOfficerProfile.rank}</p>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, borderTop: `1px solid ${ADMIN_THEME.border}`, paddingTop: 16, color: ADMIN_THEME.textSecondary }}>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Badge Number:</strong> {activeOfficerProfile.badgeId}</div>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Email Address:</strong> {activeOfficerProfile.email}</div>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Department:</strong> Cyber Crime Cell Division</div>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Clearance Level:</strong> {activeOfficerProfile.clearanceLevel || "ISD-LEVEL-IV"}</div>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>State District:</strong> {activeOfficerProfile.district}</div>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Station Hub:</strong> {activeOfficerProfile.station}</div>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Status Code:</strong> <span style={{ color: activeOfficerProfile.active ? ADMIN_THEME.green : ADMIN_THEME.red, fontWeight: 600 }}>● {activeOfficerProfile.active ? "ACTIVE CLEARANCE" : "SUSPENDED"}</span></div>
                        <div><strong style={{ color: ADMIN_THEME.textPrimary }}>Last Terminal Sync:</strong> {new Date(activeOfficerProfile.lastLogin || Date.now()).toLocaleString()}</div>
                      </div>

                      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                        <button 
                          onClick={() => handleStartEditProfile(activeOfficerProfile)}
                          style={{ flex: 1, background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 0", fontSize: 11, color: ADMIN_THEME.textSecondary, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                        >
                          Edit Profile
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm("Reset account credentials security key pin?")) {
                              alert("Password reset trigger initialized. System notification queued.");
                            }
                          }}
                          style={{ flex: 1, background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 0", fontSize: 11, color: ADMIN_THEME.textSecondary, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                        >
                          Reset PIN
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ROLES & PERMISSIONS */}
      {adminTab === "admin-roles" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Role-Based Access Controls (RBAC)</h1>
            <p style={{ fontSize: 12, color: ADMIN_THEME.textSecondary }}>Configure individually binded module clearances and operation clearances across active rank roles</p>
          </div>

          {PERMISSION_CATEGORIES.map(category => {
            const Icon = category.icon;
            return (
              <div 
                key={category.id} 
                style={{ 
                  background: ADMIN_THEME.cardBg, 
                  border: `1px solid ${ADMIN_THEME.border}`, 
                  borderRadius: 8, 
                  overflow: "hidden", 
                  marginBottom: 20, 
                  boxShadow: ADMIN_THEME.shadow 
                }}
              >
                {/* Section Header */}
                <div style={{ 
                  background: "rgba(0,31,63,0.02)", 
                  borderBottom: `1px solid ${ADMIN_THEME.border}`, 
                  padding: "12px 16px", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8 
                }}>
                  <Icon style={{ width: 15, height: 15, color: ADMIN_THEME.accentGold }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: ADMIN_THEME.textPrimary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {category.name}
                  </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: "800px" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.01)", borderBottom: `1px solid ${ADMIN_THEME.border}` }}>
                        <th style={{ padding: "10px 16px", textAlign: "left", color: ADMIN_THEME.textSecondary, fontWeight: 700, width: "25%" }}>Operation Permission</th>
                        {Object.keys(rbacPermissions).map(role => (
                          <th key={role} style={{ padding: "10px 12px", textAlign: "center", color: ADMIN_THEME.textPrimary, fontWeight: 600, fontSize: 11 }}>
                            {role}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {category.permissions.map((perm, pIdx) => (
                        <tr 
                          key={perm} 
                          style={{ 
                            borderBottom: pIdx !== category.permissions.length - 1 ? `1px solid ${ADMIN_THEME.border}` : "none",
                            transition: "background-color 0.15s ease"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(0,31,63,0.015)"; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: ADMIN_THEME.textPrimary }}>{perm}</td>
                          {Object.keys(rbacPermissions).map(role => {
                            const hasPerm = rbacPermissions[role].includes(perm);
                            return (
                              <td 
                                key={role} 
                                style={{ padding: "12px 12px", textAlign: "center" }}
                              >
                                <div 
                                  onClick={() => handlePermissionToggle(role, perm)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 24,
                                    height: 24,
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    transition: "background-color 0.2s"
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,153,51,0.08)"; }}
                                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={hasPerm}
                                    onChange={() => {}} // Handled by outer div click to prevent double triggering
                                    style={{
                                      accentColor: ADMIN_THEME.accentGold,
                                      width: 15,
                                      height: 15,
                                      cursor: "pointer",
                                      margin: 0
                                    }}
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => alert("RBAC matrix updated locally in memory layer.")}
              style={{
                background: ADMIN_THEME.blue,
                color: "white",
                padding: "6px 14px",
                borderRadius: 4,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                border: "none"
              }}
            >
              Apply RBAC Configurations
            </button>
          </div>
        </div>
      )}

      {/* 5. VERIFICATION OVERSIGHT */}
      {adminTab === "admin-verification" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Document Verification Ledger Oversight</h1>
              <p style={{ fontSize: 12, color: ADMIN_THEME.textSecondary }}>Monitor cryptographically sealed and verified legal dossiers</p>
            </div>
            
            {/* Search */}
            <div style={{ display: "flex", gap: 10 }}>
              <select
                value={verStatusFilter}
                onChange={e => setVerStatusFilter(e.target.value)}
                style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: ADMIN_THEME.textPrimary }}
              >
                <option value="ALL">All Statuses</option>
                <option value="verified">Verified (Sealed)</option>
                <option value="failed">Failed Verification</option>
              </select>
              <div style={{ position: "relative" }}>
                <Search style={{ width: 12, height: 12, color: ADMIN_THEME.textSecondary, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={verSearch}
                  onChange={e => setVerSearch(e.target.value)}
                  style={{
                    background: ADMIN_THEME.cardBg,
                    border: `1px solid ${ADMIN_THEME.border}`,
                    borderRadius: 6,
                    padding: "4px 10px 4px 28px",
                    fontSize: 12,
                    color: ADMIN_THEME.textPrimary,
                    width: "180px",
                    outline: "none"
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.01)", borderBottom: `2px solid ${ADMIN_THEME.border}` }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: ADMIN_THEME.textSecondary }}>Ledger ID</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: ADMIN_THEME.textSecondary }}>Document Name / Category</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: ADMIN_THEME.textSecondary }}>Verification Date</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: ADMIN_THEME.textSecondary }}>Executing Officer</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: ADMIN_THEME.textSecondary }}>SHA-256 Checksum Signature</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: ADMIN_THEME.textSecondary }}>Ledger Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredVerifications.map((v, idx) => (
                  <tr key={v.verificationId} style={{ borderBottom: idx !== filteredVerifications.length - 1 ? `1px solid ${ADMIN_THEME.border}` : "none" }}>
                    <td style={{ padding: "14px 16px", fontFamily: "JetBrains Mono, monospace", color: ADMIN_THEME.accentGold }}>{v.verificationId}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{v.documentName}</div>
                      <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary }}>{v.documentType}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>{new Date(v.verificationDate).toLocaleDateString()} {new Date(v.verificationDate).toLocaleTimeString()}</td>
                    <td style={{ padding: "14px 16px" }}>{v.verifiedBy || "System Automated"}</td>
                    <td style={{ padding: "14px 16px", fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: ADMIN_THEME.textSecondary }}>
                      {v.hash ? `${v.hash.slice(0, 8)}...${v.hash.slice(-8)}` : "No signature"}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: v.status === "verified" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: v.status === "verified" ? ADMIN_THEME.green : ADMIN_THEME.red,
                        padding: "3px 8px",
                        borderRadius: 4,
                        textTransform: "uppercase"
                      }}>
                        {v.status === "verified" ? "VALID SIGNATURE" : "SIG MISMATCH"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. INTELLIGENCE ANALYTICS */}
      {adminTab === "admin-analytics" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Intelligence Analytics Directorate</h1>
            <p style={{ fontSize: 12, color: ADMIN_THEME.textSecondary }}>Monitor daily logins, document signatures, and platform activity metrics</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            
            {/* Chart 1 */}
            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Secure User Logins Frequency (Last 7 Days)</h3>
              <div style={{ height: "180px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 10 }}>
                {[12, 18, 9, 14, 28, 22, 32].map((val, idx) => (
                  <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: "32px",
                      height: `${val * 4}px`,
                      background: ADMIN_THEME.blue,
                      borderRadius: "4px 4px 0 0",
                      marginBottom: 8,
                      position: "relative"
                    }}>
                      <span style={{ fontSize: 9, position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontWeight: 700 }}>{val}</span>
                    </div>
                    <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary }}>Day {idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2 */}
            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Cryptographic Document Signatures Issued</h3>
              <div style={{ height: "180px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 10 }}>
                {[4, 8, 3, 11, 7, 5, 9].map((val, idx) => (
                  <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: "32px",
                      height: `${val * 14}px`,
                      background: ADMIN_THEME.green,
                      borderRadius: "4px 4px 0 0",
                      marginBottom: 8,
                      position: "relative"
                    }}>
                      <span style={{ fontSize: 9, position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontWeight: 700 }}>{val}</span>
                    </div>
                    <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary }}>Day {idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. AI USAGE */}
      {adminTab === "admin-ai" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>AI Core Usage & Token Auditing</h1>
            <p style={{ fontSize: 12, color: ADMIN_THEME.textSecondary }}>Monitor Groq language gateway pings, token volume, and response time metrics</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
            
            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: ADMIN_THEME.textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Total Tokens Consumed</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: ADMIN_THEME.accentGold, marginTop: 8 }}>1,492,028</div>
              <p style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Across all active state police terminals</p>
            </div>

            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: ADMIN_THEME.textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Average API Response Time</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: ADMIN_THEME.green, marginTop: 8 }}>0.48 Seconds</div>
              <p style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Fast edge compilation at Groq node</p>
            </div>

            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: ADMIN_THEME.textSecondary, fontWeight: 700, textTransform: "uppercase" }}>Most Active Intelligence Terminal</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: ADMIN_THEME.textPrimary, marginTop: 8 }}>MYS-CYB Cell</div>
              <p style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>Mysuru sector generating 14 requests</p>
            </div>

          </div>

          <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Most Frequently Queried Directives</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { topic: "BNS Section mapping and code audits", count: "18 Invocations", weight: "85%" },
                { topic: "Criminal Network graph analysis", count: "12 Invocations", weight: "62%" },
                { topic: "Seizure memos generation & print briefing", count: "9 Invocations", weight: "40%" },
                { topic: "Geospatial coordinate logs parsing", count: "4 Invocations", weight: "18%" }
              ].map((row, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>{row.topic}</span>
                    <span style={{ color: ADMIN_THEME.accentGold }}>{row.count}</span>
                  </div>
                  <div style={{ height: "6px", width: "100%", background: "rgba(0,0,0,0.05)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: row.weight, background: ADMIN_THEME.accentGold, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. AUDIT LOGS */}
      {adminTab === "admin-audit" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Security Audit Ledger (Immutable)</h1>
              <p style={{ fontSize: 12, color: ADMIN_THEME.textSecondary }}>Immutable security transaction log reporting all access activities and modifications</p>
            </div>
            
            {/* Search */}
            <div style={{ display: "flex", gap: 10 }}>
              <select
                value={auditModuleFilter}
                onChange={e => setAuditModuleFilter(e.target.value)}
                style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: ADMIN_THEME.textPrimary }}
              >
                <option value="ALL">All Modules</option>
                {uniqueModules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div style={{ position: "relative" }}>
                <Search style={{ width: 12, height: 12, color: ADMIN_THEME.textSecondary, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  style={{
                    background: ADMIN_THEME.cardBg,
                    border: `1px solid ${ADMIN_THEME.border}`,
                    borderRadius: 6,
                    padding: "4px 10px 4px 28px",
                    fontSize: 12,
                    color: ADMIN_THEME.textPrimary,
                    width: "180px",
                    outline: "none"
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.01)", borderBottom: `2px solid ${ADMIN_THEME.border}` }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: ADMIN_THEME.textSecondary }}>Timestamp Signature</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: ADMIN_THEME.textSecondary }}>Officer Node</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: ADMIN_THEME.textSecondary }}>Action Log Message</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: ADMIN_THEME.textSecondary }}>Operational Module</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: ADMIN_THEME.textSecondary }}>Ingress IP Address</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: ADMIN_THEME.textSecondary }}>Security Token</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: idx !== filteredAuditLogs.length - 1 ? `1px solid ${ADMIN_THEME.border}` : "none" }}>
                    <td style={{ padding: "14px 16px", fontFamily: "JetBrains Mono, monospace", color: ADMIN_THEME.textSecondary }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600 }}>{log.officer}</td>
                    <td style={{ padding: "14px 16px" }}>{log.action}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: "rgba(255,153,51,0.08)", color: ADMIN_THEME.accentGold, padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                        {log.module}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>{log.ipAddress}</td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span style={{ fontSize: 9, background: "rgba(16,185,129,0.1)", color: ADMIN_THEME.green, padding: "2px 5px", borderRadius: 3, fontWeight: 800 }}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. SYSTEM SETTINGS */}
      {adminTab === "admin-settings" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>O.C.R.A Admin System Settings</h1>
            <p style={{ fontSize: 12, color: ADMIN_THEME.textSecondary }}>Adjust branding guidelines, credentials verification rules, and Groq engine bindings</p>
          </div>

          {systemSettings ? (
            <form onSubmit={handleSaveSettings} style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 24, maxWidth: "680px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                
                {/* Groq Key */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>Groq API Secret Key</label>
                  <input
                    type="password"
                    value={systemSettings.groqKey}
                    onChange={e => setSystemSettings(prev => prev ? { ...prev, groqKey: e.target.value } : null)}
                    style={{
                      background: ADMIN_THEME.cardBg,
                      border: `1px solid ${ADMIN_THEME.border}`,
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontSize: 13,
                      color: ADMIN_THEME.textPrimary,
                      outline: "none"
                    }}
                  />
                  <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary }}>Used to connect O.C.R.A with the Groq Llama-3 compiler gateway</span>
                </div>

                {/* OCR Engine */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>OCR Extraction Engine</label>
                  <select
                    value={systemSettings.ocrEngine}
                    onChange={e => setSystemSettings(prev => prev ? { ...prev, ocrEngine: e.target.value as any } : null)}
                    style={{
                      background: ADMIN_THEME.cardBg,
                      border: `1px solid ${ADMIN_THEME.border}`,
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontSize: 13,
                      color: ADMIN_THEME.textPrimary
                    }}
                  >
                    <option value="tesseract">Tesseract local binary scan (Secure Offline)</option>
                    <option value="cloud_vision">Google Cloud Vision API (Encrypted Gateway)</option>
                  </select>
                </div>

                {/* MFA Enforced */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    id="mfa"
                    checked={systemSettings.mfaEnforced}
                    onChange={e => setSystemSettings(prev => prev ? { ...prev, mfaEnforced: e.target.checked } : null)}
                    style={{ accentColor: ADMIN_THEME.accentGold, width: 16, height: 16 }}
                  />
                  <label htmlFor="mfa" style={{ fontSize: 12, fontWeight: 700, color: ADMIN_THEME.textPrimary, cursor: "pointer" }}>
                    Enforce Multi-Factor Authentication (MFA) across all terminals
                  </label>
                </div>

                {/* Session Timeout */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>Terminal Inactivity Lockout Timeout (Minutes)</label>
                  <input
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={e => setSystemSettings(prev => prev ? { ...prev, sessionTimeout: parseInt(e.target.value) || 30 } : null)}
                    style={{
                      background: ADMIN_THEME.cardBg,
                      border: `1px solid ${ADMIN_THEME.border}`,
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontSize: 13,
                      color: ADMIN_THEME.textPrimary,
                      outline: "none",
                      width: "120px"
                    }}
                  />
                </div>

                {/* Backup Frequency */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>Firestore Security Backup Cycle</label>
                  <select
                    value={systemSettings.backupFrequency}
                    onChange={e => setSystemSettings(prev => prev ? { ...prev, backupFrequency: e.target.value as any } : null)}
                    style={{
                      background: ADMIN_THEME.cardBg,
                      border: `1px solid ${ADMIN_THEME.border}`,
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontSize: 13,
                      color: ADMIN_THEME.textPrimary
                    }}
                  >
                    <option value="daily">Daily Cron Job (2:00 AM IST)</option>
                    <option value="weekly">Weekly Cron Job (Sundays)</option>
                    <option value="monthly">Monthly Cron Job (1st of month)</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: `1px solid ${ADMIN_THEME.border}`, paddingTop: 20, marginTop: 12 }}>
                  {settingsSuccess && (
                    <span style={{ color: ADMIN_THEME.green, alignSelf: "center", fontSize: 12, fontWeight: 600 }}>
                      ✓ Settings committed to database successfully.
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      background: ADMIN_THEME.blue,
                      color: "white",
                      padding: "6px 14px",
                      borderRadius: 4,
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                      border: "none"
                    }}
                  >
                    Save Configuration Settings
                  </button>
                </div>

              </div>
            </form>
          ) : (
            <div style={{ color: ADMIN_THEME.textSecondary }}>System settings payload unavailable.</div>
          )}
        </div>
      )}

      {/* 10. SECURITY CENTER */}
      {adminTab === "admin-security" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Centralized Security Operations Center</h1>
            <p style={{ fontSize: 12, color: ADMIN_THEME.textSecondary }}>Monitor security warnings, locked accounts, and block metrics</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            
            {/* Security Alerts Feed */}
            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "JetBrains Mono" }}>Critical Security Alerts</span>
                <ShieldAlert style={{ width: 14, height: 14, color: ADMIN_THEME.red }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ borderLeft: `3px solid ${ADMIN_THEME.red}`, paddingLeft: 12, paddingBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: ADMIN_THEME.red }}>FAILED LOGIN ATTACK BLOCKED</div>
                  <p style={{ fontSize: 11.5, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>
                    Terminal at 10.0.91.104 attempted 3 consecutive incorrect PIN inputs for user `INSP_ANANTH_12`. Terminal geofenced temporarily.
                  </p>
                  <span style={{ fontSize: 10, color: ADMIN_THEME.textMuted }}>July 3, 2026 23:44:12 IST</span>
                </div>
                <div style={{ borderLeft: `3px solid ${ADMIN_THEME.accentGold}`, paddingLeft: 12, paddingBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: ADMIN_THEME.accentGold }}>PROXY BACKUP NODE DEVIATION</div>
                  <p style={{ fontSize: 11.5, color: ADMIN_THEME.textSecondary, marginTop: 4 }}>
                    Secondary cloud ledger reported 0.02% latency drift matching statewide database replication rules.
                  </p>
                  <span style={{ fontSize: 10, color: ADMIN_THEME.textMuted }}>July 2, 2026 12:12:04 IST</span>
                </div>
              </div>
            </div>

            {/* Ingress Terminals whitelist */}
            <div style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "JetBrains Mono" }}>Active Whitelisted Terminals</span>
                <Lock style={{ width: 14, height: 14, color: ADMIN_THEME.green }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8 }}>
                  <span>State Command HQ Console (10.0.12.94)</span>
                  <span style={{ color: ADMIN_THEME.green, fontWeight: 700 }}>● SECURE</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8 }}>
                  <span>Bengaluru City Cyber Cell (10.0.91.104)</span>
                  <span style={{ color: ADMIN_THEME.green, fontWeight: 700 }}>● SECURE</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8 }}>
                  <span>Mysuru SCRB Center (10.4.19.82)</span>
                  <span style={{ color: ADMIN_THEME.green, fontWeight: 700 }}>● SECURE</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Coastal Smuggling Guard post (10.12.44.11)</span>
                  <span style={{ color: ADMIN_THEME.accentGold, fontWeight: 700 }}>● STANDBY</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 11. APPLICATION REVIEW DRAWERS (SIDE PANEL) */}
      {isDrawerOpen && selectedApp && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "680px",
          height: "100vh",
          background: ADMIN_THEME.cardBg,
          borderLeft: `1px solid ${ADMIN_THEME.border}`,
          boxShadow: "-10px 0 50px rgba(0,0,0,0.08)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          {/* Header */}
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${ADMIN_THEME.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: ADMIN_THEME.bg }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: ADMIN_THEME.textPrimary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {isConfirmingApproval ? "Review Approval Summary" : "Review Officer Application"}
              </h2>
              <p style={{ fontSize: 11, color: ADMIN_THEME.accentGold, fontFamily: "JetBrains Mono, monospace" }}>File Node Reference: {selectedApp.id}</p>
            </div>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              style={{ background: "rgba(0,0,0,0.05)", border: "none", color: ADMIN_THEME.textSecondary, borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Drawer Body Scroll Container */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
            
            {isConfirmingApproval ? (
              /* ============================================================ */
              /* APPROVAL SUMMARY CONFIRMATION PAGE                          */
              /* ============================================================ */
              <div style={{ background: "rgba(255,153,51,0.02)", border: `1.5px solid ${ADMIN_THEME.accentGold}`, borderRadius: 10, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ textAlign: "center", borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 16, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontFamily: "JetBrains Mono", color: ADMIN_THEME.accentGold, letterSpacing: "0.15em", textTransform: "uppercase" }}>Internal Security Division</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: ADMIN_THEME.textPrimary, marginTop: 4, textTransform: "uppercase" }}>Officer Access Provisioning Docket</h3>
                  <div style={{ fontSize: 11, color: ADMIN_THEME.textSecondary, marginTop: 2 }}>Command Center Registry: STATE OF KARNATAKA</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13, color: ADMIN_THEME.textPrimary }}>
                  <div style={{ borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8 }}>
                    <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block" }}>Officer Name</span>
                    <strong>{modFirstName} {modLastName}</strong>
                  </div>
                  <div style={{ borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8 }}>
                    <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block" }}>Badge / ID Number</span>
                    <strong style={{ fontFamily: "JetBrains Mono" }}>{selectedApp.badgeId}</strong>
                  </div>
                  <div style={{ borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8 }}>
                    <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block" }}>Assigned Rank</span>
                    <strong>{modRank || selectedApp.rank}</strong>
                  </div>
                  <div style={{ borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8 }}>
                    <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block" }}>Assigned Role</span>
                    <strong style={{ color: ADMIN_THEME.accentGold }}>{modRole}</strong>
                  </div>
                  <div style={{ borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8 }}>
                    <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block" }}>Security Clearance Level</span>
                    <strong>{modSecurityClearance}</strong>
                  </div>
                  <div style={{ borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8 }}>
                    <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block" }}>Department / Unit</span>
                    <strong>{modDepartment}</strong>
                  </div>
                  <div style={{ borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8 }}>
                    <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block" }}>Station Assignment</span>
                    <strong>{modStation || "State Cyber Crime PS"} ({modDistrict || "Bengaluru Urban"})</strong>
                  </div>
                  <div style={{ borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8 }}>
                    <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block" }}>Division & State Unit</span>
                    <strong>{modDivision || "N/A"} / {modStateUnit || "ISD Core"}</strong>
                  </div>
                </div>

                <div style={{ borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8, color: ADMIN_THEME.textPrimary }}>
                  <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block", marginBottom: 2 }}>Reporting Supervisors</span>
                  <div style={{ fontSize: 12 }}>
                    Supervisor: <strong>{modSupervisor || "N/A"}</strong> • Reporting Officer: <strong>{modReportingOfficer || "N/A"}</strong><br/>
                    Dept Head: <strong>{modDepartmentHead || "N/A"}</strong> • Commanding Officer: <strong>{modCommandingOfficer || "N/A"}</strong>
                  </div>
                </div>

                <div style={{ borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8 }}>
                  <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block", marginBottom: 6 }}>Provisioned Module Permissions</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {Object.entries(modPermissions).filter(([_, val]) => val !== "No Access").map(([mod, val]) => (
                      <span key={mod} style={{ fontSize: 10, background: "rgba(0,31,63,0.05)", border: `1px solid ${ADMIN_THEME.border}`, color: ADMIN_THEME.textSecondary, padding: "3px 8px", borderRadius: 4 }}>
                        {mod}: <strong style={{ color: val === "Manage" ? ADMIN_THEME.accentGold : ADMIN_THEME.textSecondary }}>{val}</strong>
                      </span>
                    ))}
                    {Object.entries(modPermissions).filter(([_, val]) => val !== "No Access").length === 0 && (
                      <span style={{ fontSize: 11, color: ADMIN_THEME.red }}>⚠️ No modules allowed (Read-only dashboard default)</span>
                    )}
                  </div>
                </div>

                <div style={{ borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 8, color: ADMIN_THEME.textPrimary }}>
                  <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block" }}>Administrative Remarks</span>
                  <p style={{ fontSize: 12, fontStyle: "italic", margin: "4px 0 0", color: ADMIN_THEME.textPrimary }}>
                    {modInternalRemarks || "No approval remarks specified."}
                  </p>
                </div>

                <div style={{ background: "rgba(0,0,0,0.02)", border: `1px solid ${ADMIN_THEME.border}`, padding: 12, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: ADMIN_THEME.textSecondary, fontFamily: "JetBrains Mono" }}>
                  <div>Approver: {officerProfile?.name || "DSP R. K. Shastry, IPS"}</div>
                  <div>Timestamp: {new Date().toLocaleString()}</div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <button
                    onClick={() => setIsConfirmingApproval(false)}
                    style={{ flex: 1, background: "none", border: `1.5px solid ${ADMIN_THEME.border}`, color: ADMIN_THEME.textPrimary, borderRadius: 6, padding: "12px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    ◀ Back to Editing
                  </button>
                  <button
                    onClick={() => executeApproveApp(selectedApp)}
                    disabled={actionLoading}
                    style={{ flex: 1, background: ADMIN_THEME.green, border: "none", color: "white", borderRadius: 6, padding: "12px 0", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
                  >
                    {actionLoading ? "Processing Ingress Activation..." : "Confirm Final Activation"}
                  </button>
                </div>
              </div>
            ) : (
              /* ============================================================ */
              /* APPLICATION AND ASSIGNMENT FORM                             */
              /* ============================================================ */
              <>
                {/* 1. REQUESTED ACCESS (READ-ONLY SCREEN) */}
                <div style={{ background: "rgba(255,153,51,0.04)", border: "1px solid rgba(255,153,51,0.2)", borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ADMIN_THEME.accentGold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Info style={{ width: 14, height: 14 }} /> Applicant Requested Access
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 12, fontSize: 12, color: ADMIN_THEME.textPrimary }}>
                    <div>
                      <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block" }}>Requested Scope</span>
                      <strong>{selectedApp.requestedAccess || "Not specified (Basic)"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: ADMIN_THEME.textSecondary, display: "block" }}>Justification / Reason</span>
                      <strong style={{ fontWeight: 500 }}>{selectedApp.reason || selectedApp.experience || "No reason submitted."}</strong>
                    </div>
                  </div>
                </div>

                {/* Identity Segment */}
                <div style={{ display: "flex", gap: 16, alignItems: "center", background: "rgba(0,31,63,0.03)", padding: 16, borderRadius: 10, border: `1px solid ${ADMIN_THEME.border}` }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(0,31,63,0.08)",
                    border: `1.5px solid ${ADMIN_THEME.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 900,
                    color: ADMIN_THEME.textPrimary,
                    boxShadow: ADMIN_THEME.shadow
                  }}>
                    {getCleanInitials(selectedApp.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>{modFirstName} {modLastName}</h3>
                    <p style={{ fontSize: 12, color: ADMIN_THEME.textSecondary, margin: "2px 0 0" }}>{modRank || selectedApp.rank} • ID: {selectedApp.badgeId}</p>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 800,
                        background: selectedApp.status === "approved" ? "rgba(16,185,129,0.15)" : (selectedApp.status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(255,153,51,0.15)"),
                        color: selectedApp.status === "approved" ? ADMIN_THEME.green : (selectedApp.status === "rejected" ? ADMIN_THEME.red : ADMIN_THEME.accentGold),
                        padding: "2px 8px",
                        borderRadius: 4,
                        textTransform: "uppercase"
                      }}>
                        {selectedApp.status}
                      </span>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 800,
                        background: "rgba(0,0,0,0.04)",
                        color: ADMIN_THEME.textSecondary,
                        padding: "2px 8px",
                        borderRadius: 4,
                        textTransform: "uppercase"
                      }}>
                        Priority: {modPriority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1. PERSONAL INFORMATION SECTION */}
                <div style={{ background: "rgba(0,0,0,0.01)", border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ADMIN_THEME.accentGold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <User style={{ width: 14, height: 14 }} /> Personal Information
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>First Name</label>
                      <input 
                        type="text" 
                        value={modFirstName} 
                        onChange={e => setModFirstName(e.target.value)} 
                        style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Last Name</label>
                      <input 
                        type="text" 
                        value={modLastName} 
                        onChange={e => setModLastName(e.target.value)} 
                        style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ADMINISTRATOR DESIGNATION ASSIGNMENT */}
                <div style={{ background: "rgba(0,0,0,0.01)", border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ADMIN_THEME.accentGold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Shield style={{ width: 14, height: 14 }} /> Administrator Designation Assignment
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Assigned Rank</label>
                        <select 
                          value={modRank} 
                          onChange={e => setModRank(e.target.value)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, cursor: "pointer" }}
                        >
                          {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Assigned System Role</label>
                        <select 
                          value={modRole} 
                          onChange={e => setModRole(e.target.value)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, cursor: "pointer" }}
                        >
                          {[
                            "Super Administrator",
                            "Administrator",
                            "Director",
                            "Additional Director",
                            "IGP",
                            "DIG",
                            "Commissioner",
                            "SP",
                            "Additional SP",
                            "DSP",
                            "ACP",
                            "Inspector",
                            "PSI",
                            "ASI",
                            "Head Constable",
                            "Police Constable",
                            "SCRB Analyst",
                            "Cyber Crime Analyst",
                            "Crime Intelligence Officer",
                            "Forensic Analyst",
                            "Investigation Officer",
                            "Read Only Officer",
                            "Operator",
                            "Custom Role"
                          ].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Clearance Level</label>
                        <select 
                          value={modSecurityClearance} 
                          onChange={e => setModSecurityClearance(e.target.value)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, cursor: "pointer" }}
                        >
                          <option value="ISD-LEVEL-I">ISD-LEVEL-I (Command Center)</option>
                          <option value="ISD-LEVEL-II">ISD-LEVEL-II (Directorate)</option>
                          <option value="ISD-LEVEL-III">ISD-LEVEL-III (Cyber cell / forensics)</option>
                          <option value="ISD-LEVEL-IV">ISD-LEVEL-IV (Field Officer)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Assigned Department</label>
                        <select 
                          value={modDepartment} 
                          onChange={e => setModDepartment(e.target.value)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, cursor: "pointer" }}
                        >
                          {["SCRB", "CID", "Cyber Crime", "Traffic", "Law & Order", "Internal Security", "Special Task Force", "Crime Branch"].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Provisioning Account Status</label>
                      <select 
                        value={modStatus} 
                        onChange={e => setModStatus(e.target.value)} 
                        style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, cursor: "pointer" }}
                      >
                        <option value="pending">Pending Review</option>
                        <option value="pending_verification">Pending Verification Checks</option>
                        <option value="pending_documents">Pending Document Submissions</option>
                        <option value="approved">Approved (Provisioned)</option>
                        <option value="active">Active (Permitted)</option>
                        <option value="suspended">Suspended (Locked)</option>
                        <option value="inactive">Inactive</option>
                        <option value="transferred">Transferred</option>
                        <option value="retired">Retired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. STATION ASSIGNMENT DETAILS */}
                <div style={{ background: "rgba(0,0,0,0.01)", border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ADMIN_THEME.accentGold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Home style={{ width: 14, height: 14 }} /> Station & Location Placement
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Assigned Police Station</label>
                        <input 
                          type="text" 
                          value={modStation} 
                          onChange={e => setModStation(e.target.value)} 
                          placeholder="e.g. Whitefield Cyber Crime PS"
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Jurisdiction District</label>
                        <select 
                          value={modDistrict} 
                          onChange={e => setModDistrict(e.target.value)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, cursor: "pointer" }}
                        >
                          {KARNATAKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Zone / Division</label>
                        <input 
                          type="text" 
                          value={modDivision} 
                          onChange={e => setModDivision(e.target.value)} 
                          placeholder="e.g. East Division"
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>State Command Unit</label>
                        <input 
                          type="text" 
                          value={modStateUnit} 
                          onChange={e => setModStateUnit(e.target.value)} 
                          placeholder="e.g. Cyber Security wing"
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. COMMAND SUPERVISORS ASSIGNMENT */}
                <div style={{ background: "rgba(0,0,0,0.01)", border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ADMIN_THEME.accentGold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <UserCheck style={{ width: 14, height: 14 }} /> Command & Supervising Officers
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Reporting Officer</label>
                        <input 
                          type="text" 
                          value={modReportingOfficer} 
                          onChange={e => setModReportingOfficer(e.target.value)} 
                          placeholder="e.g. Inspector G. Murthy"
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Immediate Supervisor</label>
                        <input 
                          type="text" 
                          value={modSupervisor} 
                          onChange={e => setModSupervisor(e.target.value)} 
                          placeholder="e.g. DSP R. K. Shastry, IPS"
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Department Head</label>
                        <input 
                          type="text" 
                          value={modDepartmentHead} 
                          onChange={e => setModDepartmentHead(e.target.value)} 
                          placeholder="e.g. Additional Director General ADGP"
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Commanding Officer</label>
                        <input 
                          type="text" 
                          value={modCommandingOfficer} 
                          onChange={e => setModCommandingOfficer(e.target.value)} 
                          placeholder="e.g. Director General of Police (DGP)"
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. GRANULAR MODULE PERMISSIONS SECTION */}
                <div style={{ background: "rgba(0,0,0,0.01)", border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: ADMIN_THEME.accentGold, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
                      <Award style={{ width: 14, height: 14 }} /> Granular Module Permissions
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => {
                          const allManage: Record<string, string> = {};
                          [
                            "Dashboard",
                            "Reports",
                            "Case Management",
                            "FIR Analytics",
                            "Criminal Database",
                            "Evidence Vault",
                            "Crime Analytics",
                            "Relationship Mapping",
                            "Geospatial Heatmap",
                            "Document Verification",
                            "Officer Directory",
                            "Administration",
                            "Audit Logs",
                            "AI Chatbot",
                            "AI Intelligence Copilot",
                            "Notifications",
                            "System Settings",
                            "API Management"
                          ].forEach(m => { allManage[m] = "Manage"; });
                          setModPermissions(allManage);
                        }}
                        style={{ background: "rgba(0,31,63,0.05)", border: "none", color: ADMIN_THEME.textSecondary, fontSize: 9, padding: "2px 6px", borderRadius: 4, cursor: "pointer" }}
                      >
                        Select All (Manage)
                      </button>
                      <button
                        onClick={() => {
                          setModPermissions({});
                        }}
                        style={{ background: "rgba(0,31,63,0.05)", border: "none", color: ADMIN_THEME.textSecondary, fontSize: 9, padding: "2px 6px", borderRadius: 4, cursor: "pointer" }}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Quick Permission Templates</label>
                    <select
                      onChange={e => {
                        if (e.target.value) {
                          applyPermissionTemplate(e.target.value);
                        }
                      }}
                      defaultValue=""
                      style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, cursor: "pointer" }}
                    >
                      <option value="" disabled>-- Select Template to Auto-Fill Permissions --</option>
                      {Object.keys(PERMISSION_TEMPLATES).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "300px", overflowY: "auto", paddingRight: 4 }}>
                    {[
                      "Dashboard",
                      "Reports",
                      "Case Management",
                      "FIR Analytics",
                      "Criminal Database",
                      "Evidence Vault",
                      "Crime Analytics",
                      "Relationship Mapping",
                      "Geospatial Heatmap",
                      "Document Verification",
                      "Officer Directory",
                      "Administration",
                      "Audit Logs",
                      "AI Chatbot",
                      "AI Intelligence Copilot",
                      "Notifications",
                      "System Settings",
                      "API Management"
                    ].map(modName => {
                      const currentVal = modPermissions[modName] || "No Access";
                      return (
                        <div key={modName} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${ADMIN_THEME.border}`, paddingBottom: 6 }}>
                          <span style={{ fontSize: 12, color: ADMIN_THEME.textPrimary, fontWeight: 500 }}>{modName}</span>
                          <select
                            value={currentVal}
                            onChange={e => {
                              setModPermissions({
                                ...modPermissions,
                                [modName]: e.target.value
                              });
                            }}
                            style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 4, padding: "4px 8px", color: currentVal === "No Access" ? ADMIN_THEME.textMuted : ADMIN_THEME.accentGold, fontSize: 11, cursor: "pointer" }}
                          >
                            <option value="No Access">No Access</option>
                            <option value="View Only">View Only</option>
                            <option value="Create">Create</option>
                            <option value="Edit">Edit</option>
                            <option value="Delete">Delete</option>
                            <option value="Approve">Approve</option>
                            <option value="Manage">Manage</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. OFFICIAL CONTACT */}
                <div style={{ background: "rgba(0,0,0,0.01)", border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ADMIN_THEME.accentGold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Activity style={{ width: 14, height: 14 }} /> Official Contact Information
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Government Email</label>
                      <input 
                        type="email" 
                        value={modEmail} 
                        onChange={e => setModEmail(e.target.value)} 
                        style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Official Mobile Number</label>
                      <input 
                        type="tel" 
                        value={modMobile} 
                        onChange={e => setModMobile(e.target.value)} 
                        style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                      />
                    </div>
                  </div>
                </div>

                {/* 5. ADDITIONAL ADMIN REVIEW FIELDS */}
                <div style={{ background: "rgba(255,153,51,0.02)", border: `1px solid rgba(255,153,51,0.15)`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ADMIN_THEME.accentGold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Settings style={{ width: 14, height: 14 }} /> Restricted Administrative Parameters
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Application Priority</label>
                        <select 
                          value={modPriority} 
                          onChange={e => setModPriority(e.target.value as any)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, cursor: "pointer" }}
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Assigned Reviewer</label>
                        <input 
                          type="text" 
                          value={modAssignedReviewer} 
                          onChange={e => setModAssignedReviewer(e.target.value)} 
                          placeholder="e.g. Inspector Murthy"
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "8px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12 }} 
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 9, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Background Verification</label>
                        <select 
                          value={modBgVerification} 
                          onChange={e => setModBgVerification(e.target.value)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "6px 8px", color: ADMIN_THEME.textPrimary, fontSize: 11, cursor: "pointer" }}
                        >
                          <option value="pending">🟡 Pending</option>
                          <option value="verified">🟢 Verified</option>
                          <option value="failed">🔴 Failed</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 9, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Department Check</label>
                        <select 
                          value={modDeptVerification} 
                          onChange={e => setModDeptVerification(e.target.value)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "6px 8px", color: ADMIN_THEME.textPrimary, fontSize: 11, cursor: "pointer" }}
                        >
                          <option value="pending">🟡 Pending</option>
                          <option value="verified">🟢 Verified</option>
                          <option value="failed">🔴 Failed</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 9, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Supervisor Approval</label>
                        <select 
                          value={modSupervisorApproval} 
                          onChange={e => setModSupervisorApproval(e.target.value)} 
                          style={{ width: "100%", background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "6px 8px", color: ADMIN_THEME.textPrimary, fontSize: 11, cursor: "pointer" }}
                        >
                          <option value="pending">🟡 Pending</option>
                          <option value="verified">🟢 Verified</option>
                          <option value="failed">🔴 Failed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 10, color: ADMIN_THEME.textSecondary, marginBottom: 4, fontWeight: 600 }}>Internal Remarks</label>
                      <textarea 
                        value={modInternalRemarks} 
                        onChange={e => setModInternalRemarks(e.target.value)} 
                        placeholder="Provide detailed security clearance details or background flags..."
                        style={{ width: "100%", height: 80, background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 6, padding: "10px 12px", color: ADMIN_THEME.textPrimary, fontSize: 12, resize: "vertical", outline: "none", lineHeight: 1.5 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 6. VERIFICATION TIMELINE SECTION */}
                <div style={{ background: "rgba(0,0,0,0.01)", border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ADMIN_THEME.accentGold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock style={{ width: 14, height: 14 }} /> Officer Verification Timeline
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingLeft: 8, borderLeft: `2px solid ${ADMIN_THEME.border}`, margin: "8px 0 8px 12px" }}>
                    
                    {/* 1. Submitted */}
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-21px", top: 2, width: 10, height: 10, borderRadius: "50%", background: ADMIN_THEME.green, border: `2px solid ${ADMIN_THEME.cardBg}` }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>Application Submitted</div>
                      <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary }}>Timestamp: {new Date(selectedApp.submittedAt).toLocaleString()}</div>
                    </div>

                    {/* 2. Identity Check */}
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-21px", top: 2, width: 10, height: 10, borderRadius: "50%", background: modBgVerification === "verified" ? ADMIN_THEME.green : ADMIN_THEME.accentGold, border: `2px solid ${ADMIN_THEME.cardBg}` }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>Identity & Background Check</div>
                      <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary }}>Status: {modBgVerification === "verified" ? "Verified" : "Pending/Under review"}</div>
                    </div>

                    {/* 3. Department Check */}
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-21px", top: 2, width: 10, height: 10, borderRadius: "50%", background: modDeptVerification === "verified" ? ADMIN_THEME.green : ADMIN_THEME.accentGold, border: `2px solid ${ADMIN_THEME.cardBg}` }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>Departmental Ingress Check</div>
                      <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary }}>Status: {modDeptVerification === "verified" ? "Verified" : "Pending/Under review"}</div>
                    </div>

                    {/* 4. Timeline Review */}
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-21px", top: 2, width: 10, height: 10, borderRadius: "50%", background: ADMIN_THEME.green, border: `2px solid ${ADMIN_THEME.cardBg}` }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>Admin Review Started</div>
                      <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary }}>Reviewer: {modAssignedReviewer || officerProfile?.name || "DSP R. K. Shastry, IPS"}</div>
                    </div>

                    {/* 5. Final State */}
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-21px", top: 2, width: 10, height: 10, borderRadius: "50%", background: selectedApp.status === "approved" || selectedApp.status === "active" ? ADMIN_THEME.green : (selectedApp.status === "rejected" ? ADMIN_THEME.red : "rgba(0,0,0,0.2)"), border: `2px solid ${ADMIN_THEME.cardBg}` }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: ADMIN_THEME.textPrimary }}>Account Activation Status</div>
                      <div style={{ fontSize: 10, color: ADMIN_THEME.textSecondary }}>Decision: {selectedApp.status.toUpperCase()}</div>
                    </div>

                  </div>
                </div>
              </>
            )}

          </div>

          {/* Drawer Actions */}
          <div style={{ padding: "20px 24px", borderTop: `1px solid ${ADMIN_THEME.border}`, display: "flex", flexDirection: "column", gap: 8, background: ADMIN_THEME.bg }}>
            
            {/* Actions Matrix Row 1: Document/Compile operations */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
              <button
                onClick={handleSaveReview}
                style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 4, color: ADMIN_THEME.textSecondary, fontSize: 11, padding: "8px 0", cursor: "pointer", fontWeight: 600 }}
              >
                Save Review
              </button>
              <button
                onClick={handleRequestInfo}
                style={{ background: "rgba(255,153,51,0.1)", border: `1px solid rgba(255,153,51,0.3)`, borderRadius: 4, color: ADMIN_THEME.accentGold, fontSize: 11, padding: "8px 0", cursor: "pointer", fontWeight: 600 }}
              >
                Request Info
              </button>
              <button
                onClick={handleDownloadApplication}
                style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 4, color: ADMIN_THEME.textSecondary, fontSize: 11, padding: "8px 0", cursor: "pointer", fontWeight: 600 }}
              >
                Download JSON
              </button>
              <button
                onClick={handlePrintApplication}
                style={{ background: ADMIN_THEME.cardBg, border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 4, color: ADMIN_THEME.textSecondary, fontSize: 11, padding: "8px 0", cursor: "pointer", fontWeight: 600 }}
              >
                Print Docket
              </button>
            </div>

            {/* Actions Matrix Row 2: Formal letters */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: isConfirmingApproval ? 0 : 8 }}>
              <button
                onClick={() => generateDossierLetter(selectedApp, "approval")}
                style={{ background: "none", border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 4, color: ADMIN_THEME.textSecondary, fontSize: 11, padding: "8px 0", cursor: "pointer", fontWeight: 600 }}
              >
                Compile Approval Letter
              </button>
              <button
                onClick={() => generateDossierLetter(selectedApp, "rejection")}
                style={{ background: "none", border: `1px solid ${ADMIN_THEME.border}`, borderRadius: 4, color: ADMIN_THEME.textSecondary, fontSize: 11, padding: "8px 0", cursor: "pointer", fontWeight: 600 }}
              >
                Compile Rejection Letter
              </button>
            </div>

            {/* State Changers */}
            {!isConfirmingApproval && (
              selectedApp.status === "pending" || selectedApp.status === "under_review" || selectedApp.status === "awaiting" ? (
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => handleRejectApp(selectedApp)}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      background: "rgba(239,68,68,0.1)",
                      border: `1.5px solid ${ADMIN_THEME.red}`,
                      color: ADMIN_THEME.red,
                      borderRadius: 6,
                      padding: "10px 0",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApproveApp(selectedApp)}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      background: ADMIN_THEME.green,
                      border: "none",
                      color: "white",
                      borderRadius: 6,
                      padding: "10px 0",
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    Approve Officer
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", fontSize: 12, color: ADMIN_THEME.textSecondary, padding: "10px 0", marginTop: 4 }}>
                  Processed Node Status: <strong style={{ color: ADMIN_THEME.textPrimary, textTransform: "uppercase" }}>{selectedApp.status}</strong>.
                </div>
              )
            )}

          </div>

        </div>
      )}

    </div>
  );
};
