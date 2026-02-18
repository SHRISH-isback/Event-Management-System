import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import api from "../api/axios";

export default function QRScanner({ eventId, onScanSuccess }) {
  const [scanMode, setScanMode] = useState(null); 
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); 
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const processQRCode = useCallback(async (qrData) => {
    try {
      setScanning(true);
      const response = await api.post("/attendance/scan", { qrData });
      
      showMessage(
        ` Attendance marked for ${response.data.registration.participant.name || response.data.registration.participant.email}`,
        "success"
      );
      
      if (onScanSuccess) {
        onScanSuccess(response.data.registration);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error scanning QR code";
      
      if (errorMessage.includes("already scanned")) {
        showMessage(` ${errorMessage}`, "warning");
      } else {
        showMessage(` ${errorMessage}`, "error");
      }
    } finally {
      setScanning(false);
    }
  }, [onScanSuccess]);

  const captureAndScan = useCallback(() => {
    if (!webcamRef.current || scanning) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        processQRCode(code.data);
        stopScanning();
      }
    };
  }, [scanning, processQRCode]);

  const startCameraScanning = () => {
    setScanMode("camera");
    setMessage("Position QR code in front of camera...");
    setMessageType("info");
    
    scanIntervalRef.current = setInterval(() => {
      captureAndScan();
    }, 500);
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanMode(null);
    setMessage("");
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          processQRCode(code.data);
        } else {
          showMessage("No QR code found in image", "error");
        }
      };
    };
    reader.readAsDataURL(file);
    
    event.target.value = "";
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

      {}
      {message && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          backgroundColor: messageType === "success" ? "#d1fae5" :
                          messageType === "error" ? "#fee2e2" :
                          messageType === "warning" ? "#fef3c7" : "#dbeafe",
          border: `1px solid ${messageType === "success" ? "#86efac" :
                               messageType === "error" ? "#fca5a5" :
                               messageType === "warning" ? "#fcd34d" : "#93c5fd"}`,
          color: messageType === "success" ? "#065f46" :
                 messageType === "error" ? "#991b1b" :
                 messageType === "warning" ? "#92400e" : "#1e40af",
          fontWeight: "500",
        }}>
          {message}
        </div>
      )}

      {}
      {!scanMode && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}>
          <button
            onClick={startCameraScanning}
            disabled={scanning}
            style={{
              padding: "16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#2563eb"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#3b82f6"}
          >
            Scan with Camera
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            style={{
              padding: "16px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#059669"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#10b981"}
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

      {}
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
              videoConstraints={{
                facingMode: "environment",
              }}
              style={{
                width: "100%",
                height: "auto",
              }}
            />
            
            {}
            {scanning && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "12px 24px",
                borderRadius: "8px",
                fontWeight: "500",
              }}>
                Processing...
              </div>
            )}
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
            Stop Scanning
          </button>
        </div>
      )}
    </div>
  );
}
