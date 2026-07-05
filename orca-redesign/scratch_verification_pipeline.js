const fs = require('fs');
const path = require('path');
const http = require('http');
const { createCanvas, loadImage } = require('canvas');
const JsBarcode = require('jsbarcode');

// Load environment variables
const envText = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
envText.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx !== -1) {
    let k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
});

const { initializeApp: initAdminApp, getApps: getAdminApps, cert } = require('firebase-admin/app');
const { getFirestore: getAdminFirestore } = require('firebase-admin/firestore');

function getAdminDb() {
  if (getAdminApps().length > 0) {
    return getAdminFirestore(getAdminApps()[0]);
  }
  const saKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const parsed = JSON.parse(saKey);
  const app = initAdminApp({
    credential: cert(parsed),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "orca-ai-india"
  });
  return getAdminFirestore(app);
}

const testVerId = "VER-2026-ISD-CR-4182";
const testCaseNum = "FIR/2026/BLR/4182";
const testPayload = `VER=${testVerId}|CASE=${testCaseNum}`;

function uploadFileToApi(filePath, filename) {
  return new Promise((resolve, reject) => {
    const fileBuffer = fs.readFileSync(filePath);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    let body = [];
    body.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`));
    body.push(fileBuffer);
    body.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    
    const payload = Buffer.concat(body);

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/verification/document',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length
      }
    }, (res) => {
      let respBody = '';
      res.on('data', chunk => respBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(respBody) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: respBody });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runFullDiagnostics() {
  console.log("=======================================================");
  console.log("      ORCA BARCODE VERIFICATION PIPELINE DIAGNOSTICS ");
  console.log("=======================================================\n");

  try {
    const adminDb = getAdminDb();
    await adminDb.collection("verified_documents").doc(testVerId).set({
      verificationId: testVerId,
      caseNumber: testCaseNum,
      reportReference: "ISD-CR-4182",
      reportType: "State Crime Intelligence Briefing",
      verificationStatus: "VERIFIED",
      issuingAuthority: "Karnataka State Police • SCRB (ORCA)",
      officerName: "DSP R.K. SHASTRY",
      officerRank: "IPS, Superintendent of Police",
      policeStation: "Internal Security Division (ISD)",
      district: "Bengaluru City",
      classification: "CONFIDENTIAL",
      generatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`[Firestore Register] Document ${testVerId} registered in verified_documents.`);
  } catch (dbErr) {
    console.error("Firestore Register Exception:", dbErr.message);
  }

  // 1. GENERATE STANDALONE BARCODE PNG
  const standaloneCanvas = createCanvas(800, 150);
  JsBarcode(standaloneCanvas, testPayload, {
    format: "CODE128",
    displayValue: false,
    margin: 24,
    height: 80,
    width: 2.2,
    background: "#ffffff",
    lineColor: "#000000"
  });
  const standalonePath = path.join(__dirname, "standalone_barcode.png");
  fs.writeFileSync(standalonePath, standaloneCanvas.toBuffer("image/png"));
  console.log(`[Step 1] Created standalone barcode: standalone_barcode.png (800x150)`);

  // 2. GENERATE FULL PAGE REPORT IMAGE WITH EMBEDDED BARCODE
  const reportCanvas = createCanvas(1200, 1600);
  const ctx = reportCanvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1200, 1600);

  // Add government header & text
  ctx.fillStyle = "#001f3f";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("O.R.C.A · ORGANIZED CRIME ANALYSIS AUTHORITY", 80, 100);
  ctx.font = "18px sans-serif";
  ctx.fillText("KARNATAKA STATE POLICE · INTERNAL SECURITY DIVISION", 80, 140);
  ctx.strokeStyle = "#001f3f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(80, 160);
  ctx.lineTo(1120, 160);
  ctx.stroke();

  ctx.fillStyle = "#1e293b";
  ctx.font = "20px sans-serif";
  ctx.fillText("CONFIDENTIAL STATE CRIME INTELLIGENCE BRIEFING", 80, 240);
  ctx.fillText(`CASE REFERENCE: ${testCaseNum}`, 80, 280);
  ctx.fillText(`VERIFICATION IDENTIFIER: ${testVerId}`, 80, 320);

  // Load standalone image and render cleanly onto report
  const img = await loadImage(standalonePath);
  ctx.drawImage(img, 200, 1350, 800, 150);

  const reportPath = path.join(__dirname, "full_report_page.png");
  fs.writeFileSync(reportPath, reportCanvas.toBuffer("image/png"));
  console.log(`[Step 2] Created full page report: full_report_page.png (1200x1600)`);

  // 3. TEST VERIFICATION OF STANDALONE BARCODE UPLOAD
  console.log("\n--- [Test A] Uploading Standalone Barcode to /api/verification/document ---");
  const resA = await uploadFileToApi(standalonePath, "standalone_barcode.png");
  console.log("Status:", resA.status);
  console.log("Response:", JSON.stringify(resA.data || resA.raw, null, 2));

  // 4. TEST VERIFICATION OF FULL PAGE REPORT UPLOAD
  console.log("\n--- [Test B] Uploading Full Page Report to /api/verification/document ---");
  const resB = await uploadFileToApi(reportPath, "full_report_page.png");
  console.log("Status:", resB.status);
  console.log("Response:", JSON.stringify(resB.data || resB.raw, null, 2));

  process.exit(0);
}

runFullDiagnostics();
