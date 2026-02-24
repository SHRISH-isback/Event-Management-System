import { useState, useEffect } from "react";
import api from "../api/axios";
import "../App.css";

export default function PasswordResetRequest() {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const res = await api.get("/password-reset/my-requests");
      setRequests(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load password reset requests");
      setLoading(false);
    }
  };

  // Submits a new password reset request with a reason
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason for password reset");
      return;
    }

    try {
      await api.post("/password-reset/request", { reason });
      setSuccess("Password reset request submitted successfully!");
      setReason("");
      setShowModal(false);
      fetchMyRequests();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request");
    }
  };

  // Returns inline styles for the status badge based on request status
  const getStatusBadgeStyle = (status) => {
    const styles = {
      PENDING:  { backgroundColor: "#fef3c7", color: "#f59e0b" },
      APPROVED: { backgroundColor: "#d1fae5", color: "#10b981" },
      REJECTED: { backgroundColor: "#fee2e2", color: "#ef4444" },
    };
    return styles[status] || {};
  };

  return (
    <div style={{ marginTop: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3>Password Reset Requests</h3>
        <button className="btn" onClick={() => setShowModal(true)} style={{ backgroundColor: "#3b82f6" }}>
          Request Password Reset
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {success && <p style={{ color: "#10b981", marginBottom: "15px" }}>{success}</p>}

      {/* Request history list */}
      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>
          No password reset requests yet.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {requests.map((request) => (
            <div key={request._id} className="card" style={{ padding: "15px", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", ...getStatusBadgeStyle(request.status) }}>
                      {request.status}
                    </span>
                    <span style={{ fontSize: "14px", color: "#6b7280" }}>
                      Requested on {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <strong>Reason:</strong>
                    <p style={{ margin: "5px 0", color: "#4b5563" }}>{request.reason}</p>
                  </div>

                  {request.adminComment && (
                    <div style={{ marginBottom: "10px" }}>
                      <strong>Admin Comment:</strong>
                      <p style={{ margin: "5px 0", color: "#4b5563" }}>{request.adminComment}</p>
                    </div>
                  )}

                  {request.processedAt && (
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      Processed on {new Date(request.processedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for submitting a new request */}
      {showModal && (
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ backgroundColor: "white", padding: "30px", borderRadius: "8px", maxWidth: "500px", width: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "20px" }}>Request Password Reset</h3>

            <form onSubmit={handleSubmitRequest}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  Reason for Password Reset <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you need a password reset..."
                  style={{ width: "100%", minHeight: "100px", padding: "10px", border: "1px solid #d1d5db", borderRadius: "4px", resize: "vertical", fontFamily: "inherit" }}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setReason(""); setError(""); }}
                  style={{ padding: "10px 20px", border: "1px solid #d1d5db", borderRadius: "4px", backgroundColor: "white", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
