const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const { Code128Reader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } = require('@zxing/library');

function debugScan() {
  const standaloneBuffer = fs.readFileSync(path.join(__dirname, 'standalone_barcode.png'));
  const pngStandalone = PNG.sync.read(standaloneBuffer);
  console.log(`Standalone PNG: ${pngStandalone.width}x${pngStandalone.height}`);

  const reportBuffer = fs.readFileSync(path.join(__dirname, 'full_report_page.png'));
  const pngReport = PNG.sync.read(reportBuffer);
  console.log(`Report PNG: ${pngReport.width}x${pngReport.height}`);

  // Test standalone scan
  try {
    const lumData = new Uint8ClampedArray(pngStandalone.width * pngStandalone.height);
    for (let i = 0; i < pngStandalone.width * pngStandalone.height; i++) {
      lumData[i] = (pngStandalone.data[i*4]*30 + pngStandalone.data[i*4+1]*59 + pngStandalone.data[i*4+2]*11)/100;
    }
    const reader = new Code128Reader();
    const result = reader.decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(lumData, pngStandalone.width, pngStandalone.height))));
    console.log("✅ Standalone Scan Success:", result.getText());
  } catch (e) {
    console.log("❌ Standalone Scan Failed:", e.message);
  }

  // Test extracting exact coordinates on report (x:200, y:1350, w:800, h:150)
  try {
    const cropX = 200, cropY = 1350, cropW = 800, cropH = 150;
    const lumData = new Uint8ClampedArray(cropW * cropH);
    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const srcIdx = ((cropY + y) * pngReport.width + (cropX + x)) * 4;
        lumData[y * cropW + x] = (pngReport.data[srcIdx]*30 + pngReport.data[srcIdx+1]*59 + pngReport.data[srcIdx+2]*11)/100;
      }
    }
    const reader = new Code128Reader();
    const result = reader.decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(lumData, cropW, cropH))));
    console.log("✅ Report Crop Region Scan Success:", result.getText());
  } catch (e) {
    console.log("❌ Report Crop Region Scan Failed:", e.message);
  }
}

debugScan();
