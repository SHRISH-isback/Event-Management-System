import { useState, useRef, useEffect, useCallback } from "react";
import jsQR from "jsqr";
import api from "../api/axios";

export default function QRScanner({ eventId, onScanSuccess }) {
  const [scanMode, setScanMode] = useState(null); // null | "camera"
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const isProcessingRef = useRef(false); // prevents concurrent QR submissions
  const fileInputRef = useRef(null);

  const showMsg = (text, type = "info") => { setMessage(text); setMessageType(type); };
  const clearMsgAfter = (ms = 6000) => setTimeout(() => { setMessage(""); setMessageType("info"); }, ms);

  // Sends decoded QR data to the backend to mark attendance
  const processQRCode = useCallback(async (qrData) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    showMsg("Processing QR code...", "info");
    try {
      const response = await api.post("/attendance/scan", { qrData });
      const reg = response.data.registration;
      showMsg(
        response.data.message || `Attendance marked for ${reg.participant?.displayName || reg.participant?.email}`,
        "success"
      );
      clearMsgAfter(7000);
      if (onScanSuccess) onScanSuccess(reg);
    } catch (error) {
      const msg = error.response?.data?.message || "Error scanning QR code";
      showMsg(
        msg,
        msg.toLowerCase().includes("already scanned") ? "warning" : "error"
      );
      clearMsgAfter(7000);
    } finally {
      setTimeout(() => { isProcessingRef.current = false; }, 2000);
    }
  }, [onScanSuccess]);

  // Continuously decodes frames from the live camera feed using jsQR
  const scanFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState < video.HAVE_ENOUGH_DATA || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (!isProcessingRef.current) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
      if (code?.data) processQRCode(code.data);
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [processQRCode]);

  const handleVideoPlay = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [scanFrame]);

  // Requests camera access and starts the video stream
  const startCamera = useCallback(async () => {
    setCameraError("");
    showMsg("Starting camera...", "info");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setScanMode("camera");
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"  ? "Camera permission denied. Please allow camera access in your browser settings and try again." :
        err.name === "NotFoundError"    ? "No camera found on this device." :
        err.name === "NotReadableError" ? "Camera is in use by another application. Close it and try again." :
                                          `Camera error: ${err.message}`;
      setCameraError(msg);
      showMsg(msg, "error");
    }
  }, []);

  // Attach stream to video element once camera mode is active
  useEffect(() => {
    if (scanMode === "camera" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [scanMode]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current)  { videoRef.current.srcObject = null; }
    isProcessingRef.current = false;
    setScanMode(null);
    setMessage("");
  }, []);

  // Cleanup camera/animation on unmount
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }, []);

  // Decodes a QR code from an uploaded image, retrying at different scales
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    showMsg("Reading QR code from image...", "info");

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const tryDecode = (scale) => {
          const c = document.createElement("canvas");
          c.width  = img.naturalWidth  * scale;
          c.height = img.naturalHeight * scale;
          const ctx = c.getContext("2d");
          ctx.drawImage(img, 0, 0, c.width, c.height);
          const id = ctx.getImageData(0, 0, c.width, c.height);
          return jsQR(id.data, id.width, id.height, { inversionAttempts: "attemptBoth" });
        };
        const code = tryDecode(1) || tryDecode(2) || tryDecode(0.5);
        if (code) {
          processQRCode(code.data);
        } else {
          showMsg("No QR code found. Try a closer / clearer photo.", "error");
          clearMsgAfter();
        }
      };
      img.onerror = () => { showMsg("Could not load the image file.", "error"); clearMsgAfter(4000); };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Dynamic styles for the status message banner
  const msgStyle = {
    padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontWeight: "500",
    backgroundColor: messageType==="success"?"#d1fae5": messageType==="error"?"#fee2e2": messageType==="warning"?"#fef3c7":"#dbeafe",
    border: `1px solid ${messageType==="success"?"#86efac": messageType==="error"?"#fca5a5": messageType==="warning"?"#fcd34d":"#93c5fd"}`,
    color:  messageType==="success"?"#065f46": messageType==="error"?"#991b1b": messageType==="warning"?"#92400e":"#1e40af",
  };

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
      <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#1a1a1a" }}>QR Code Scanner</h3>

      {message && <div style={msgStyle}>{message}</div>}
      {cameraError && !scanMode && (
        <div style={{ padding: "12px", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", marginBottom: "16px", color: "#991b1b", fontSize: "14px" }}>
          {cameraError}
        </div>
      )}

      {/* Idle state: camera or file upload entry points */}
      {!scanMode && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <button onClick={startCamera}
            style={{ padding: "16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500" }}>
            Scan with Camera
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            style={{ padding: "16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500" }}>
            Upload QR Image
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
        </div>
      )}

      {/* Live camera view with targeting overlay */}
      {scanMode === "camera" && (
        <div>
          <div style={{ position: "relative", width: "100%", maxWidth: "500px", margin: "0 auto", borderRadius: "8px", overflow: "hidden", border: "2px solid #3b82f6", backgroundColor: "#000" }}>
            <video
              ref={videoRef}
              onPlay={handleVideoPlay}
              playsInline
              muted
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {/* Targeting box overlay */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: "200px", height: "200px",
              border: "3px solid #3b82f6", borderRadius: "12px",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
              pointerEvents: "none",
            }} />
          </div>
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", margin: "10px 0 0" }}>
            Hold the QR code steady inside the blue box
          </p>
          <button onClick={stopCamera}
            style={{ marginTop: "12px", padding: "12px 24px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", width: "100%" }}>
            ✕ Stop Camera
          </button>
        </div>
      )}
    </div>
  );
}
