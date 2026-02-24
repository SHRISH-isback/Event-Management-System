import { useEffect, useState } from "react";
import api from "../api/axios";
import "../App.css";

export default function PaymentVerification() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "NORMAL" | "MERCH"
  const [organizerId, setOrganizerId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch the organizer's own profile to get their ID
  useEffect(() => {
    const fetchOrganizerProfile = async () => {
      try {
        const res = await api.get("/organizers/profile");
        setOrganizerId(res.data._id);
      } catch (err) {
        console.error("Failed to load organizer profile");
      }
    };
    fetchOrganizerProfile();
  }, []);

  // Fetch all payment-related registrations once we have the organizer ID
  useEffect(() => {
    if (!organizerId) return;
    const fetchOrders = async () => {
      try {
        const res = await api.get(`/registrations/pending-payments/${organizerId}`);
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to load payment registrations");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [organizerId]);

  const refreshOrders = async () => {
    try {
      const res = await api.get(`/registrations/pending-payments/${organizerId}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to refresh");
    }
  };

  const handleApprove = async (orderId) => {
    if (!window.confirm("Approve this payment?")) return;
    setActionLoading(true);
    try {
      await api.post(`/registrations/approve-payment/${orderId}`);
      alert("Payment approved! The booking is now confirmed.");
      await refreshOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (order) => {
    setSelectedOrder(order);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/registrations/reject-payment/${selectedOrder._id}`, {
        reason: rejectionReason,
      });
      alert("Payment rejected.");
      setShowRejectModal(false);
      setSelectedOrder(null);
      await refreshOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewImage = (order) => {
    setSelectedOrder(order);
    setShowImageModal(true);
  };

  if (loading) return <div className="container">Loading payment registrations...</div>;

  // Apply event type filter then status tab filter
  const typeFiltered = orders.filter((o) => typeFilter === "all" || o.event?.type === typeFilter);
  const pendingOrders = typeFiltered.filter((o) => o.paymentStatus === "PENDING");
  const approvedOrders = typeFiltered.filter((o) => o.paymentStatus === "APPROVED");
  const rejectedOrders = typeFiltered.filter((o) => o.paymentStatus === "REJECTED");

  const getFilteredOrders = () => {
    switch (activeTab) {
      case "pending":  return pendingOrders;
      case "approved": return approvedOrders;
      case "rejected": return rejectedOrders;
      default:         return pendingOrders;
    }
  };

  const filteredOrders = getFilteredOrders();

  const getStatusBadge = (order) => {
    const styles = {
      PENDING:  { background: "#f59e0b", color: "#fff", label: "Pending Approval" },
      APPROVED: { background: "#28a745", color: "#fff", label: "Approved" },
      REJECTED: { background: "#dc3545", color: "#fff", label: "Rejected" },
    };
    const s = styles[order.paymentStatus] || { background: "#e9ecef", color: "#000", label: order.paymentStatus };
    return (
      <span style={{ padding: "5px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", background: s.background, color: s.color }}>
        {s.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const isMerch = type === "MERCH";
    return (
      <span style={{
        padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold",
        background: isMerch ? "#fef3c7" : "#dbeafe",
        color: isMerch ? "#92400e" : "#1e40af",
        marginLeft: "8px",
      }}>
        {isMerch ? "MERCH" : "EVENT"}
      </span>
    );
  };

  const TabBtn = ({ value, label, count, color }) => (
    <button
      onClick={() => setActiveTab(value)}
      style={{
        padding: "10px 20px", borderRadius: "5px", border: "none",
        background: activeTab === value ? color : "#e9ecef",
        color: activeTab === value ? "white" : "#000",
        cursor: "pointer", fontWeight: "bold",
      }}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "8px" }}>Payment Verification</h1>
      <p style={{ color: "#6b7280", marginBottom: "24px" }}>
        Review and manage payment proofs for all paid event registrations and merchandise orders
      </p>

      {/* Event type filter */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontWeight: "600", fontSize: "14px", color: "#374151" }}>Filter by type:</span>
        {["all", "NORMAL", "MERCH"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: "6px 16px", borderRadius: "5px", border: "1px solid #d1d5db",
              background: typeFilter === t ? "#4f46e5" : "white",
              color: typeFilter === t ? "white" : "#374151",
              cursor: "pointer", fontWeight: typeFilter === t ? "bold" : "normal", fontSize: "13px",
            }}
          >
            {t === "all" ? "All" : t === "NORMAL" ? "Events" : "Merchandise"}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div style={{ marginBottom: "30px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <TabBtn value="pending"  label="Pending Approval" count={pendingOrders.length}  color="#f59e0b" />
        <TabBtn value="approved" label="Approved"         count={approvedOrders.length} color="#28a745" />
        <TabBtn value="rejected" label="Rejected"         count={rejectedOrders.length} color="#dc3545" />
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          {activeTab === "pending"  && "No registrations pending approval."}
          {activeTab === "approved" && "No approved payments yet."}
          {activeTab === "rejected" && "No rejected payments."}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {filteredOrders.map((order) => {
            const isMerch = order.event?.type === "MERCH";
            return (
              <div
                key={order._id}
                style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "20px", background: "white", borderLeft: `4px solid ${order.paymentStatus === "APPROVED" ? "#28a745" : order.paymentStatus === "REJECTED" ? "#dc3545" : "#f59e0b"}` }}
              >
                {/* Header: event name, type badge, status */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                      <h3 style={{ margin: 0 }}>{order.event?.name}</h3>
                      {getTypeBadge(order.event?.type)}
                    </div>
                    <p style={{ margin: "4px 0", color: "#666" }}>
                      <strong>Ticket ID:</strong> <span style={{ fontFamily: "monospace", color: "#2563eb" }}>{order.ticketId}</span>
                    </p>
                    <p style={{ margin: "4px 0", color: "#666" }}>
                      <strong>Participant:</strong>{" "}
                      {order.participantDetails?.firstName
                        ? `${order.participantDetails.firstName} ${order.participantDetails.lastName || ""}`.trim()
                        : order.participant?.email}
                    </p>
                    <p style={{ margin: "4px 0", color: "#666" }}>
                      <strong>Email:</strong> {order.participant?.email}
                    </p>
                    {order.participantDetails?.contactNumber && (
                      <p style={{ margin: "4px 0", color: "#666" }}>
                        <strong>Contact:</strong> {order.participantDetails.contactNumber}
                      </p>
                    )}
                  </div>
                  <div>{getStatusBadge(order)}</div>
                </div>

                {/* Payment / booking details */}
                <div style={{ marginBottom: "15px", paddingTop: "15px", borderTop: "1px solid #eee" }}>
                  {isMerch && order.merchDetails ? (
                    <>
                      <p style={{ margin: "4px 0" }}><strong>Merchandise:</strong> {order.merchDetails.size} / {order.merchDetails.color}</p>
                      <p style={{ margin: "4px 0" }}><strong>Quantity:</strong> {order.merchDetails.quantity}</p>
                      <p style={{ margin: "4px 0" }}><strong>Total:</strong> ₹{(order.event?.registrationFee || 0) * order.merchDetails.quantity}</p>
                    </>
                  ) : (
                    <p style={{ margin: "4px 0" }}><strong>Registration Fee:</strong> ₹{order.event?.registrationFee}</p>
                  )}
                  <p style={{ margin: "4px 0", color: "#666", fontSize: "13px" }}>
                    <strong>Booked on:</strong> {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Payment proof image or warning */}
                {order.paymentProof ? (
                  <div style={{ marginBottom: "15px" }}>
                    <button
                      onClick={() => handleViewImage(order)}
                      style={{
                        padding: "8px 16px", borderRadius: "5px",
                        border: "1px solid #007bff", background: "white",
                        color: "#007bff", cursor: "pointer",
                      }}
                    >
                      View Payment Proof
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: "10px", background: "#fff3cd", borderRadius: "5px", marginBottom: "15px", color: "#856404", fontSize: "13px" }}>
                    No payment proof uploaded yet
                  </div>
                )}

                {/* Approve / Reject actions for pending */}
                {order.paymentStatus === "PENDING" && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleApprove(order._id)}
                      disabled={actionLoading || !order.paymentProof}
                      title={!order.paymentProof ? "Cannot approve: no payment proof uploaded" : "Approve this payment"}
                      style={{
                        padding: "10px 20px", borderRadius: "5px", border: "none",
                        background: actionLoading || !order.paymentProof ? "#ccc" : "#28a745",
                        color: "white",
                        cursor: actionLoading || !order.paymentProof ? "not-allowed" : "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(order)}
                      disabled={actionLoading}
                      style={{
                        padding: "10px 20px", borderRadius: "5px", border: "none",
                        background: actionLoading ? "#ccc" : "#dc3545",
                        color: "white",
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}

                {order.paymentStatus === "REJECTED" && order.paymentRejectionReason && (
                  <div style={{ padding: "10px", background: "#f8d7da", borderRadius: "5px", color: "#721c24" }}>
                    <strong>Rejection Reason:</strong> {order.paymentRejectionReason}
                  </div>
                )}

                {order.paymentStatus === "APPROVED" && order.paymentApprovedAt && (
                  <div style={{ padding: "10px", background: "#d4edda", borderRadius: "5px", color: "#155724" }}>
                    <strong>Approved on:</strong> {new Date(order.paymentApprovedAt).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payment proof image modal */}
      {showImageModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Payment Proof — {selectedOrder.event?.name}</h2>
              <button className="modal-close" onClick={() => setShowImageModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <img
                src={selectedOrder.paymentProof}
                alt="Payment Proof"
                style={{ maxWidth: "100%", maxHeight: "70vh" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Rejection reason modal */}
      {showRejectModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reject Payment</h2>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: "15px" }}>
                Rejecting payment for <strong>{selectedOrder.event?.name}</strong> —{" "}
                {selectedOrder.participantDetails?.firstName || selectedOrder.participant?.email}
              </p>
              <p style={{ marginBottom: "10px", fontSize: "14px" }}>Please provide a reason (participant will be notified):</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                style={{
                  width: "100%", padding: "10px", borderRadius: "5px",
                  border: "1px solid #ddd", marginBottom: "15px", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowRejectModal(false)}
                  style={{ padding: "10px 20px", borderRadius: "5px", border: "1px solid #ddd", background: "white", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={actionLoading || !rejectionReason.trim()}
                  style={{
                    padding: "10px 20px", borderRadius: "5px", border: "none",
                    background: actionLoading || !rejectionReason.trim() ? "#ccc" : "#dc3545",
                    color: "white",
                    cursor: actionLoading || !rejectionReason.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {actionLoading ? "Rejecting..." : "Reject Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
