import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import api from "../api/axios";

export default function QRScanner({ eventId, onScanSuccess }) {
  const [scanMode, setScanMode] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const isProcessingRef = useRef(false); 
  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessageAfterDelay = (delay = 5000) => {
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, delay);
  };

  const decodeQRFromCanvas = (canvas) => {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
  };

  const processQRCode = useCallback(async (qrData) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    showMessage("Processing QR code...", "info");

    try {
      const response = await api.post("/attendance/scan", { qrData });
      const reg = response.data.registration;
      showMessage(
        ` ${response.data.message || "Attendance marked for " + (reg.participant?.displayName || reg.participant?.email)}`,
        "success"
      );
      clearMessageAfterDelay(6000);
      if (onScanSuccess) onScanSuccess(reg);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error scanning QR code";
      if (errorMessage.toLowerCase().includes("already scanned")) {
        showMessage(` ${errorMessage}`, "warning");
      } else {
        showMessage(` ${errorMessage}`, "error");
      }
      clearMessageAfterDelay(6000);
    } finally {
      isProcessingRef.current = false;
    }
  }, [onScanSuccess]);

  const captureAndScan = useCallback(() => {
    if (isProcessingRef.current) return;
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const code = decodeQRFromCanvas(canvas);
      if (code && code.data) {
        stopScanning();
        processQRCode(code.data);
      }
    };
    img.src = imageSrc;
  }, [processQRCode]);

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanMode(null);
  };

  const startCameraScanning = () => {
    isProcessingRef.current = false;
    setScanMode("camera");
    showMessage("Point camera at the QR code...", "info");
  };

  useEffect(() => {
    if (scanMode === "camera") {
      scanIntervalRef.current = setInterval(captureAndScan, 400);
    }
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [scanMode, captureAndScan]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    showMessage("🔍 Reading QR code from image...", "info");

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const tryDecode = (scale) => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth * scale;
          canvas.height = img.naturalHeight * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return decodeQRFromCanvas(canvas);
        };

        let code = tryDecode(1);
        if (!code) code = tryDecode(2);   
        if (!code) code = tryDecode(0.5); 
        if (code && code.data) {
          processQRCode(code.data);
        } else {
          showMessage(" No QR code detected in this image. Try a clearer photo or use camera scan.", "error");
          clearMessageAfterDelay(6000);
        }
      };
      img.onerror = () => {
        showMessage(" Could not load image file.", "error");
        clearMessageAfterDelay(4000);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "24px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      marginBottom: "20px",
    }}>
      <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#1a1a1a" }}>
        QR Code Scanner
      </h3>

      {message && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          backgroundColor: messageType === "success" ? "#d1fae5"
                         : messageType === "error"   ? "#fee2e2"
                         : messageType === "warning" ? "#fef3c7"
                         :                            "#dbeafe",
          border: `1px solid ${
            messageType === "success" ? "#86efac"
          : messageType === "error"   ? "#fca5a5"
          : messageType === "warning" ? "#fcd34d"
          :                            "#93c5fd"
          }`,
          color: messageType === "success" ? "#065f46"
               : messageType === "error"   ? "#991b1b"
               : messageType === "warning" ? "#92400e"
               :                            "#1e40af",
          fontWeight: "500",
        }}>
          {message}
        </div>
      )}

      {!scanMode && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <button
            onClick={startCameraScanning}
            style={{
              padding: "16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            Scan with Camera
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "16px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            Upload QR Image
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </div>
      )}

      {scanMode === "camera" && (
        <div>
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "500px",
            margin: "0 auto",
            borderRadius: "8px",
            overflow: "hidden",
            border: "2px solid #3b82f6",
          }}>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              videoConstraints={{ facingMode: "environment", width: 1280, height: 720 }}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            {/* Targeting overlay */}
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "200px", height: "200px",
              border: "3px solid #3b82f6",
              borderRadius: "12px",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
              pointerEvents: "none",
            }} />
          </div>

          <button
            onClick={stopScanning}
            style={{
              marginTop: "16px",
              padding: "12px 24px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              width: "100%",
            }}
          >
            ✕ Stop Scanning
          </button>
        </div>
      )}
    </div>
  );
}
