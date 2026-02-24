import { useState } from "react";
import api from "../api/axios";

export default function PaymentProofUpload({ registration, onClose, onSuccess }) {
  const [paymentProof, setPaymentProof] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // True when the user is re-uploading after a rejection
  const isReupload = registration.paymentStatus === "REJECTED";
  const isMerch = registration.event?.type === "MERCH";

  // Validates file type/size and converts to base64 for upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProof(reader.result);
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Sends the base64 image to the backend for organizer review
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentProof) {
      setError("Please select a payment proof image");
      return;
    }

    setUploading(true);
    setError("");
    try {
      await api.post(`/registrations/payment-proof/${registration._id}`, { paymentProof });
      const msg = isReupload
        ? "Payment proof re-uploaded successfully! Your booking is now pending re-approval."
        : "Payment proof uploaded successfully! Your booking is now pending approval.";
      alert(msg);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload payment proof");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isReupload ? "Re-upload Payment Proof" : "Upload Payment Proof"}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Show rejection reason when re-uploading */}
          {isReupload && registration.paymentRejectionReason && (
            <div style={{ padding: "12px", background: "#f8d7da", borderRadius: "6px", marginBottom: "15px", color: "#721c24", fontSize: "14px" }}>
              <strong>Previous rejection reason:</strong> {registration.paymentRejectionReason}
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <p><strong>Booking Details:</strong></p>
            <p>Event: {registration.event?.name}</p>
            {isMerch && registration.merchDetails && (
              <>
                <p>Merchandise: {registration.merchDetails.size} / {registration.merchDetails.color}</p>
                <p>Quantity: {registration.merchDetails.quantity}</p>
                <p>Amount: ₹{(registration.event?.registrationFee || 0) * registration.merchDetails.quantity}</p>
              </>
            )}
            {!isMerch && (
              <p>Fee: ₹{registration.event?.registrationFee}</p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="paymentProof" style={{ display: "block", marginBottom: "10px" }}>
                <strong>Upload Payment Screenshot/Receipt:</strong>
              </label>
              <input
                type="file"
                id="paymentProof"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "block", width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "5px" }}
              />
            </div>

            {/* Image preview after file selection */}
            {previewUrl && (
              <div style={{ marginBottom: "20px" }}>
                <p><strong>Preview:</strong></p>
                <img
                  src={previewUrl}
                  alt="Payment Proof Preview"
                  style={{ maxWidth: "100%", maxHeight: "300px", border: "1px solid #ddd", borderRadius: "5px" }}
                />
              </div>
            )}

            {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: "10px 20px", borderRadius: "5px", border: "1px solid #ddd", background: "white", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !paymentProof}
                style={{
                  padding: "10px 20px",
                  borderRadius: "5px",
                  border: "none",
                  background: uploading || !paymentProof ? "#ccc" : (isReupload ? "#dc3545" : "#007bff"),
                  color: "white",
                  cursor: uploading || !paymentProof ? "not-allowed" : "pointer",
                }}
              >
                {uploading ? "Uploading..." : (isReupload ? "Re-upload" : "Upload")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
