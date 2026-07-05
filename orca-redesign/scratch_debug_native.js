const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { PNG } = require('pngjs');
const JsBarcode = require('jsbarcode');
const { Code128Reader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } = require('@zxing/library');

async function testNative() {
  const testPayload = "VER=VER-2026-ISD-CR-4182|CASE=FIR/2026/BLR/4182";
  const standaloneCanvas = createCanvas(1200, 150);
  JsBarcode(standaloneCanvas, testPayload, {
    format: "CODE128",
    displayValue: false,
    margin: 24,
    height: 80,
    width: 2,
    background: "#ffffff",
    lineColor: "#000000"
  });

  const reportCanvas = createCanvas(1400, 1800);
  const ctx = reportCanvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1400, 1800);

  // Draw standalone canvas at native size 1:1 without distortion
  ctx.drawImage(standaloneCanvas, 100, 1550);

  const reportBuffer = reportCanvas.toBuffer("image/png");
  const pngReport = PNG.sync.read(reportBuffer);

  // Test scanning bottom 300px region (rows 1500-1800)
  const cropY = 1500;
  const cropH = 300;
  const cropW = pngReport.width;
  const lumData = new Uint8ClampedArray(cropW * cropH);
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((cropY + y) * pngReport.width + x) * 4;
      lumData[y * cropW + x] = (pngReport.data[srcIdx]*30 + pngReport.data[srcIdx+1]*59 + pngReport.data[srcIdx+2]*11)/100;
    }
  }

  try {
    const reader = new Code128Reader();
    const result = reader.decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(lumData, cropW, cropH))));
    console.log("🟢 Bottom Region Scan SUCCESS:", result.getText());
  } catch (e) {
    console.log("❌ Bottom Region Scan Failed:", e.message || e);
  }
}

testNative();
