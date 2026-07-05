import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth, checkAdminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce RBAC Session Check
    const activeAdmin = await checkAdminAuth(req, "Administration");
    if (!activeAdmin) {
      return NextResponse.json({ success: false, error: "ACCESS DENIED: Insufficient administrative privileges." }, { status: 403 });
    }

    const payload = await req.json();
    const { 
      applicationId, 
      email, 
      name, 
      rank, 
      district, 
      station, 
      badgeId, 
      mobile,
      requestedAccess,
      adminName,
      assignedRole,
      permissions,
      division,
      stateUnit,
      department,
      reportingOfficer,
      supervisor,
      departmentHead,
      commandingOfficer,
      status
    } = payload;

    if (!applicationId || !email || !name || !badgeId) {
      return NextResponse.json({ success: false, error: "Missing required application metrics." }, { status: 400 });
    }

    const emailToUse = email.trim().toLowerCase();
    
    // 2. Provision / Retrieve Authentication user using Admin SDK
    let authUser;
    try {
      authUser = await adminAuth.getUserByEmail(emailToUse);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        authUser = await adminAuth.createUser({
          email: emailToUse,
          password: "Orca@" + badgeId.replace(/[^a-zA-Z0-9]/g, "") + "9",
          emailVerified: true
        });
      } else {
        throw err;
      }
    }

    // Retrieve previous profile state if updating permissions later
    const existingDocRef = adminDb.collection("officers").doc(authUser.uid);
    const existingDoc = await existingDocRef.get();
    const oldProfile = existingDoc.exists ? existingDoc.data() : null;

    // Create history entries
    const permissionsHistory = oldProfile?.permissionsHistory || [];
    const stationHistory = oldProfile?.stationHistory || [];

    const nowStr = new Date().toISOString();

    // Log permission/role changes if any
    if (oldProfile) {
      const roleChanged = oldProfile.role !== (assignedRole || "Investigation Officer");
      const permissionsChanged = JSON.stringify(oldProfile.permissions) !== JSON.stringify(permissions || {});
      
      if (roleChanged || permissionsChanged) {
        permissionsHistory.push({
          timestamp: nowStr,
          changedBy: activeAdmin.name || adminName || "DSP R. K. Shastry, IPS",
          oldRole: oldProfile.role,
          newRole: assignedRole || "Investigation Officer",
          oldPermissions: oldProfile.permissions || {},
          newPermissions: permissions || {},
          reason: "Administrative approval / role realignment"
        });
      }

      // Log transfers/station changes
      const stationChanged = oldProfile.station !== (station || "");
      const districtChanged = oldProfile.district !== (district || "");
      
      if (stationChanged || districtChanged) {
        stationHistory.push({
          timestamp: nowStr,
          changedBy: activeAdmin.name || adminName || "DSP R. K. Shastry, IPS",
          oldStation: oldProfile.station,
          newStation: station || "",
          oldDistrict: oldProfile.district,
          newDistrict: district || "",
          reason: "Officer division assignment"
        });
      }
    } else {
      // Log initial permission state
      permissionsHistory.push({
        timestamp: nowStr,
        changedBy: activeAdmin.name || adminName || "DSP R. K. Shastry, IPS",
        newRole: assignedRole || "Investigation Officer",
        newPermissions: permissions || {},
        reason: "Initial credentials provisioning"
      });
      stationHistory.push({
        timestamp: nowStr,
        changedBy: activeAdmin.name || adminName || "DSP R. K. Shastry, IPS",
        newStation: station || "",
        newDistrict: district || "",
        reason: "Initial station placement"
      });
    }

    // 3. Provision Officer Profile in Firestore
    const officerProfile = {
      uid: authUser.uid,
      email: emailToUse,
      name: name,
      rank: rank || "Inspector",
      role: assignedRole || "Investigation Officer",
      district: district || "Bengaluru Urban",
      station: station || "State Cyber Crime PS",
      badgeId: badgeId,
      mobile: mobile || "",
      requestedAccess: requestedAccess || "",
      clearanceLevel: rank === "SP" || rank === "DSP" ? "ISD-LEVEL-I" : "ISD-LEVEL-IV",
      lastLogin: nowStr,
      active: status === "suspended" || status === "inactive" || status === "rejected" ? false : true,
      
      // Extended workflow fields
      division: division || "",
      stateUnit: stateUnit || "",
      department: department || "Cyber Crime",
      reportingOfficer: reportingOfficer || "",
      supervisor: supervisor || "",
      departmentHead: departmentHead || "",
      commandingOfficer: commandingOfficer || "",
      permissions: permissions || {},
      permissionsHistory,
      stationHistory,
      status: status || "active"
    };

    await existingDocRef.set(officerProfile, { merge: true });

    // 4. Mark Application as Approved/Updated
    await adminDb.collection("officer_applications").doc(applicationId).set({
      status: status || "approved",
      approvedAt: nowStr,
      remarks: `Provisioned by ${activeAdmin.name || adminName}. Assigned Role: ${assignedRole || "Investigation Officer"}`
    }, { merge: true });

    // 5. Log Action in Audit Logs
    await adminDb.collection("audit_logs").add({
      timestamp: nowStr,
      officer: activeAdmin.name || adminName || "DSP R. K. Shastry, IPS",
      action: `Approved and provisioned officer credentials: ${name} (${badgeId}) under Role: ${assignedRole || "Investigation Officer"}`,
      module: "Officer Applications",
      ipAddress: req.headers.get("x-forwarded-for") || "10.0.12.94",
      status: "Success"
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully provisioned credentials and activated profile for ${name}.` 
    });

  } catch (error: any) {
    console.error("[Admin Officer Approval Error]:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to process officer credential activation." 
    }, { status: 500 });
  }
}
