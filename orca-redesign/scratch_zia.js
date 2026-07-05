const fs = require('fs');
const path = require('path');
const catalyst = require('zcatalyst-sdk-node');

async function runForensics() {
  console.log("=======================================================");
  console.log("      ZOHO ZIA BARCODE SCANNER FORENSIC INVESTIGATION ");
  console.log("=======================================================\n");

  const testPayload = "VER=VER-2026-ISD-CR-4182|CASE=FIR/2026/BLR/4182";

  console.log("--- TESTING ZOHO ZIA SDK INITIALIZATION & SCAN ---");
  try {
    const app = catalyst.initialize();
    const zia = app.zia();
    console.log("Zia SDK initialized.");
  } catch (err) {
    console.error("\nZOHO ZIA EXCEPTION:");
    console.error("Message:", err.message);
  }
}

runForensics();
