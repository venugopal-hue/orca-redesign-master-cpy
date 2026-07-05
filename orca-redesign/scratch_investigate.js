const fs = require('fs');
const path = require('path');

const envText = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
envText.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx !== -1) {
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
});

const { initializeApp: initClientApp, getApps: getClientApps } = require('firebase/app');
const { getFirestore: getClientFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const { initializeApp: initAdminApp, getApps: getAdminApps, cert } = require('firebase-admin/app');
const { getFirestore: getAdminFirestore } = require('firebase-admin/firestore');

async function investigate() {
  console.log("=======================================================");
  console.log("      ORCA FIREBASE ARCHITECTURE FORENSIC INVESTIGATION ");
  console.log("=======================================================\n");

  // 1. CLIENT SDK CONFIGURATION AUDIT
  const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  console.log("--- 1. FIREBASE CLIENT SDK CONFIGURATION ---");
  console.log("Client Project ID:    ", clientConfig.projectId);
  console.log("Client Auth Domain:   ", clientConfig.authDomain);
  console.log("Client App ID:        ", clientConfig.appId);
  console.log("Client API Key:       ", clientConfig.apiKey);

  const clientApp = getClientApps().length > 0 ? getClientApps()[0] : initClientApp(clientConfig);
  const clientDb = getClientFirestore(clientApp);

  // 2. ADMIN SDK CONFIGURATION AUDIT
  console.log("\n--- 2. FIREBASE ADMIN SDK CONFIGURATION ---");
  let adminApp;
  if (getAdminApps().length > 0) {
    adminApp = getAdminApps()[0];
  } else {
    const saKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (saKey) {
      try {
        const parsed = JSON.parse(saKey);
        adminApp = initAdminApp({
          credential: cert(parsed),
          projectId: clientConfig.projectId
        });
        console.log("Admin SDK Mode: Service Account Certificate AUTHENTICATED SUCCESSFULLY.");
        console.log("Client Email:  ", parsed.client_email);
      } catch (e) {
        console.error("Service Account Parsing Error:", e.message);
        adminApp = initAdminApp({ projectId: clientConfig.projectId });
        console.log("Admin SDK Mode: Implicit initialization fallback.");
      }
    } else {
      adminApp = initAdminApp({ projectId: clientConfig.projectId });
      console.log("Admin SDK Mode: Unauthenticated project ID reference (ADC search).");
    }
  }

  console.log("Admin Project ID:     ", adminApp.options.projectId || clientConfig.projectId);

  // 3. ATTEMPT ADMIN FIRESTORE WRITE & READ BACK
  console.log("\n--- 3. TESTING LIVE ADMIN FIRESTORE WRITE & IMMEDIATE READ-BACK ---");
  const testDocId = `VER-ADMIN-LIVE-${Date.now()}`;
  const testRecord = {
    verificationId: testDocId,
    caseNumber: "FIR/2026/BLR/9999",
    reportReference: "ISD-CR-LIVE-VERIFIED",
    reportType: "State Crime Intelligence Briefing",
    verificationStatus: "VERIFIED",
    issuingAuthority: "Karnataka State Police • SCRB (ORCA)",
    officerName: "DSP R.K. SHASTRY",
    officerRank: "IPS, Superintendent of Police",
    policeStation: "Internal Security Division (ISD)",
    district: "Bengaluru City",
    classification: "CONFIDENTIAL",
    generatedAt: new Date().toISOString(),
    liveVerified: true
  };

  console.log(`Target Collection: "verified_documents"`);
  console.log(`Target Document ID: "${testDocId}"`);

  try {
    const adminDb = getAdminFirestore(adminApp);
    const adminDocRef = adminDb.collection("verified_documents").doc(testDocId);
    console.log("Writing document via Admin SDK...");
    await adminDocRef.set(testRecord);
    console.log("✅ Admin SDK write call completed successfully!");

    console.log("Attempting immediate read-back via Admin SDK...");
    const adminSnap = await adminDocRef.get();
    if (adminSnap.exists) {
      console.log("🟢 LIVE FIRESTORE PERSISTENCE CONFIRMED!");
      console.log("Retrieved Document Data:");
      console.log(JSON.stringify(adminSnap.data(), null, 2));
    } else {
      console.log("❌ FAILURE: Document DOES NOT exist in Admin SDK after write!");
    }
  } catch (adminErr) {
    console.error("❌ ADMIN FIRESTORE EXCEPTION:", adminErr.code || adminErr.name, adminErr.message);
  }
}

investigate();
