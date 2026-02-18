import { useState, useEffect } from "react";
import api from "../api/axios";
import "../App.css";

export default function PasswordResetManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminComment, setAdminComment] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      const params = filterStatus !== "ALL" ? { status: filterStatus } : {};
      const res = await api.get("/password-reset/all", { params });
      setRequests(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load password reset requests");
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      const res = await api.post(`/password-reset/${selectedRequest._id}/approve`, {
        adminComment: adminComment.trim() || undefined,
      });
      setGeneratedPassword(res.data.newPassword);
      setSuccess(
        `Password reset approved for ${res.data.clubName}. New password has been generated.`
      );
      setShowApproveModal(false);
      setAdminComment("");
      fetchRequests();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve request");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !adminComment.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    try {
      const res = await api.post(`/password-reset/${selectedRequest._id}/reject`, {
        adminComment: adminComment.trim(),
      });
      setSuccess(`Password reset request rejected for ${res.data.clubName}.`);
      setShowRejectModal(false);
      setSelectedRequest(null);
      setAdminComment("");
      fetchRequests();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject request");
    }
  };

  const getStatusBadgeStyle = (status) => {
    const styles = {
      PENDING: { backgroundColor: "#fef3c7", color: "#f59e0b", border: "1px solid #f59e0b" },
      APPROVED: { backgroundColor: "#d1fae5", color: "#10b981", border: "1px solid #10b981" },
      REJECTED: { backgroundColor: "#fee2e2", color: "#ef4444", border: "1px solid #ef4444" },
    };
    return styles[status] || {};
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess("Password copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const closePasswordModal = () => {
    setGeneratedPassword(null);
    setSelectedRequest(null);
  };

  return (
    <div className="container">
      <h2>Password Reset Management</h2>

      {error && <p className="error">{error}</p>}
      {success && <p style={{ color: "#10b981", marginBottom: "15px" }}>{success}</p>}

      {}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px", fontWeight: "bold" }}>Filter by Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: "8px 15px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          <option value="ALL">All Requests</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>
          No password reset requests found.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {requests.map((request) => (
            <div
              key={request._id}
              className="card"
              style={{
                padding: "20px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                    <h3 style={{ margin: 0 }}>{request.clubName}</h3>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      ...getStatusBadgeStyle(request.status),
                    }}>
                      {request.status}
                    </span>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <strong>Email:</strong> {request.clubEmail}
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <strong>Requested on:</strong>{" "}
                    {new Date(request.requestedAt).toLocaleString()}
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <strong>Reason:</strong>
                    <p style={{
                      margin: "5px 0",
                      padding: "10px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "4px",
                      whiteSpace: "pre-wrap",
                    }}>
                      {request.reason}
                    </p>
                  </div>

                  {request.adminComment && (
                    <div style={{ marginBottom: "10px" }}>
                      <strong>Admin Comment:</strong>
                      <p style={{
                        margin: "5px 0",
                        padding: "10px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "4px",
                        whiteSpace: "pre-wrap",
                      }}>
                        {request.adminComment}
                      </p>
                    </div>
                  )}

                  {request.processedAt && (
                    <div style={{ marginBottom: "10px", fontSize: "14px", color: "#6b7280" }}>
                      <strong>Processed on:</strong>{" "}
                      {new Date(request.processedAt).toLocaleString()}
                      {request.processedBy && ` by ${request.processedBy.email}`}
                    </div>
                  )}
                </div>

                {request.status === "PENDING" && (
                  <div style={{ display: "flex", gap: "10px", marginLeft: "20px" }}>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowApproveModal(true);
                      }}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectModal(true);
                      }}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {showApproveModal && selectedRequest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowApproveModal(false);
            setSelectedRequest(null);
            setAdminComment("");
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "20px" }}>Approve Password Reset</h3>

            <p style={{ marginBottom: "20px" }}>
              You are about to approve password reset for <strong>{selectedRequest.clubName}</strong>.
              A new password will be automatically generated.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Admin Comment (Optional)
              </label>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Add any notes or instructions..."
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                  setAdminComment("");
                }}
                style={{
                  padding: "10px 20px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Approve & Generate Password
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {showRejectModal && selectedRequest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowRejectModal(false);
            setSelectedRequest(null);
            setAdminComment("");
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "20px" }}>Reject Password Reset</h3>

            <p style={{ marginBottom: "20px" }}>
              You are about to reject password reset request from <strong>{selectedRequest.clubName}</strong>.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Reason for Rejection <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                required
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setAdminComment("");
                }}
                style={{
                  padding: "10px 20px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {generatedPassword && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3 style={{ marginBottom: "20px", color: "#10b981" }}>
              ✓ Password Reset Approved
            </h3>

            <p style={{ marginBottom: "20px" }}>
              New password has been generated. Please share this with the organizer.
              <strong style={{ color: "#ef4444" }}> This password will only be shown once!</strong>
            </p>

            <div
              style={{
                padding: "15px",
                backgroundColor: "#f9fafb",
                borderRadius: "4px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <code style={{ fontSize: "18px", fontWeight: "bold" }}>{generatedPassword}</code>
              <button
                onClick={() => copyToClipboard(generatedPassword)}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                 Copy
              </button>
            </div>

            <button
              onClick={closePasswordModal}
              style={{
                width: "100%",
                padding: "10px 20px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
