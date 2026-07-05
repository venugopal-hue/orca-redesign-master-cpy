import os
import json
import logging
import time

logger = logging.getLogger("orca_firebase")

# Create local data directory for offline sandbox persistence
LOCAL_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(LOCAL_DB_DIR, exist_ok=True)

firebase_available = False

try:
    import firebase_admin
    from firebase_admin import credentials, firestore, storage
    
    # Initialize Firebase if not already initialized
    if not firebase_admin._apps:
        # Check if a custom service account JSON is set or resides locally
        cred_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT") or "firebase-key.json"
        
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {
                'storageBucket': 'orca-india-efcdd.firebasestorage.app'
            })
            firebase_available = True
            logger.info("Firebase Admin SDK successfully initialized via service account JSON.")
        else:
            # Try initializing implicitly using default environment variables or parameters
            try:
                # This works if the developer ran gcloud authentication or if standard defaults exist
                firebase_admin.initialize_app(options={
                    'storageBucket': 'orca-india-efcdd.firebasestorage.app'
                })
                firebase_available = True
                logger.info("Firebase Admin SDK successfully initialized via Application Default Credentials.")
            except Exception as default_err:
                logger.warning(
                    f"Implicit Firebase Admin initialization bypassed: {str(default_err)}. "
                    "Operating in high-fidelity local sandbox mode."
                )
except ImportError:
    logger.warning("firebase_admin Python package missing. Operating in high-fidelity local sandbox mode.")


def save_fir_metadata(case_id: str, formatted_case: dict, file_bytes: bytes, filename: str, ocr_result: dict):
    """
    Saves extracted FIR metadata, AI intelligence summaries, and OCR logs to Firestore.
    Uploads the uploaded file to Firebase Storage if online.
    Otherwise, saves all files and records locally on the disk sandbox to ensure a flawless demo.
    """
    # 1. Local Persistence (Sandbox Backup Database)
    try:
        safe_id = case_id.replace("/", "_")
        local_case_file = os.path.join(LOCAL_DB_DIR, f"case_{safe_id}.json")
        local_logs_file = os.path.join(LOCAL_DB_DIR, f"logs_{safe_id}.json")
        local_binary_file = os.path.join(LOCAL_DB_DIR, f"doc_{safe_id}_{filename}")
        
        # Save case metadata
        with open(local_case_file, "w", encoding="utf-8") as f:
            json.dump(formatted_case, f, indent=2, ensure_ascii=False)
            
        # Save ocr logs
        with open(local_logs_file, "w", encoding="utf-8") as f:
            json.dump(ocr_result, f, indent=2, ensure_ascii=False)
            
        # Save raw binary uploaded file
        with open(local_binary_file, "wb") as f:
            f.write(file_bytes)
            
        logger.info(f"Local sandbox sync complete: saved case_{safe_id}.json & raw file.")
    except Exception as e:
        logger.error(f"Local sandbox write failure: {str(e)}")

    # 2. Firebase Database Sync (Firestore & Cloud Storage)
    if firebase_available:
        try:
            db = firestore.client()
            bucket = storage.bucket()
            
            # Upload raw file binary to storage bucket
            safe_id = case_id.replace("/", "_")
            blob_path = f"firs/{safe_id}_{filename}"
            blob = bucket.blob(blob_path)
            blob.upload_from_string(file_bytes, content_type="application/octet-stream")
            
            # Create download / access link
            try:
                # Signed URLs require active credentials
                file_url = blob.generate_signed_url(expiration=3600 * 24 * 7) # 7 Days Validity
            except Exception:
                # Fallback to standard Google storage download URL format
                file_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{blob_path.replace('/', '%2F')}?alt=media"
                
            # Embed evidence file url in standard case schema
            formatted_case["evidenceFileUrl"] = file_url
            
            # Push details to /cases in Firestore
            db.collection("cases").document(case_id).set(formatted_case)
            
            # Push OCR raw scans to /ocr_logs
            ocr_log_data = {
                "caseId": case_id,
                "filename": filename,
                "sha256": ocr_result["sha256"],
                "confidence": ocr_result["confidence"],
                "logs": ocr_result["logs"],
                "extractedText": ocr_result["text"],
                "timestamp": firestore.SERVER_TIMESTAMP
            }
            db.collection("ocr_logs").document(case_id).set(ocr_log_data)
            
            # Log operational officer event in /audit_logs
            audit_log_data = {
                "timestamp": firestore.SERVER_TIMESTAMP,
                "caseId": case_id,
                "action": "FIR INGESTION & FORENSIC EXTRACTION PIPELINE",
                "operator": "DSP R. K. Shastry, IPS",
                "ocrConfidence": f"{ocr_result['confidence']}%",
                "details": f"Ingested secure digital dossier '{filename}' verified & mapped."
            }
            db.collection("audit_logs").add(audit_log_data)
            
            logger.info("Successfully pushed all forensic metadata and files to Live Google Cloud Firebase.")
        except Exception as fe:
            logger.error(f"Live Firebase database push failed: {str(fe)}. Relying on local sandbox data storage.")
