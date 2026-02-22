import { useEffect, useState } from "react";
import api from "../api/axios";
import "../App.css";

export default function MerchandiseOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [organizerId, setOrganizerId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

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

  useEffect(() => {
    if (!organizerId) return;

    const fetchOrders = async () => {
      try {
        const res = await api.get(`/registrations/pending-orders/${organizerId}`);
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [organizerId]);

  const refreshOrders = async () => {
    try {
      const res = await api.get(`/registrations/pending-orders/${organizerId}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to refresh orders");
    }
  };

  const handleApprove = async (orderId) => {
    if (!window.confirm("Are you sure you want to approve this payment?")) {
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/registrations/approve-payment/${orderId}`);
      alert("Payment approved successfully! Order is now confirmed.");
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

  if (loading) {
    return <div className="container">Loading orders...</div>;
  }

  const pendingOrders = orders.filter((o) => o.paymentStatus === "PENDING");
  const approvedOrders = orders.filter((o) => o.paymentStatus === "APPROVED");
  const rejectedOrders = orders.filter((o) => o.paymentStatus === "REJECTED");

  const getFilteredOrders = () => {
    switch (activeTab) {
      case "pending":
        return pendingOrders;
      case "approved":
        return approvedOrders;
      case "rejected":
        return rejectedOrders;
      default:
        return pendingOrders;
    }
  };

  const filteredOrders = getFilteredOrders();

  const getStatusBadge = (order) => {
    let label, style;
    if (order.paymentStatus === "PENDING") {
      label = "Pending Approval";
      style = { background: "#f59e0b", color: "#fff" };
    } else if (order.paymentStatus === "APPROVED") {
      label = "Approved";
      style = { background: "#28a745", color: "#fff" };
    } else if (order.paymentStatus === "REJECTED") {
      label = "Rejected";
      style = { background: "#dc3545", color: "#fff" };
    } else {
      label = order.paymentStatus;
      style = { background: "#e9ecef", color: "#000" };
    }

    return (
      <span
        style={{
          padding: "5px 12px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "bold",
          ...style,
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "8px" }}>Merchandise Orders</h1>
      <p style={{ color: "#6b7280", marginBottom: "24px" }}>
        Review and manage payment proofs for merchandise orders
      </p>

      <div style={{ marginBottom: "30px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("pending")}
          style={{
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
            background: activeTab === "pending" ? "#f59e0b" : "#e9ecef",
            color: activeTab === "pending" ? "white" : "#000",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Pending Approval ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          style={{
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
            background: activeTab === "approved" ? "#28a745" : "#e9ecef",
            color: activeTab === "approved" ? "white" : "#000",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Approved ({approvedOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          style={{
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
            background: activeTab === "rejected" ? "#dc3545" : "#e9ecef",
            color: activeTab === "rejected" ? "white" : "#000",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
         Rejected ({rejectedOrders.length})
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          {activeTab === "pending" && "No orders pending approval."}
          {activeTab === "approved" && "No approved orders yet."}
          {activeTab === "rejected" && "No rejected orders."}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "20px",
                background: "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <div>
                  <h3 style={{ margin: "0 0 10px 0" }}>{order.event.name}</h3>
                  <p style={{ margin: "5px 0", color: "#666" }}>
                    <strong>Ticket ID:</strong> {order.ticketId}
                  </p>
                  <p style={{ margin: "5px 0", color: "#666" }}>
                    <strong>Customer:</strong>{" "}
                    {order.participantDetails?.firstName} {order.participantDetails?.lastName}
                  </p>
                  <p style={{ margin: "5px 0", color: "#666" }}>
                    <strong>Email:</strong> {order.participant.email}
                  </p>
                  <p style={{ margin: "5px 0", color: "#666" }}>
                    <strong>Contact:</strong> {order.participantDetails?.contactNumber}
                  </p>
                </div>
                <div>{getStatusBadge(order)}</div>
              </div>

              <div style={{ marginBottom: "15px", paddingTop: "15px", borderTop: "1px solid #eee" }}>
                <p style={{ margin: "5px 0" }}>
                  <strong>Merchandise:</strong> {order.merchDetails.size} /{" "}
                  {order.merchDetails.color}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Quantity:</strong> {order.merchDetails.quantity}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Total Amount:</strong> ₹
                  {order.event.registrationFee * order.merchDetails.quantity}
                </p>
                <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
                  <strong>Order Date:</strong>{" "}
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>

              {order.paymentProof && (
                <div style={{ marginBottom: "15px" }}>
                  <button
                    onClick={() => handleViewImage(order)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "5px",
                      border: "1px solid #007bff",
                      background: "white",
                      color: "#007bff",
                      cursor: "pointer",
                    }}
                  >
                    View Payment Proof
                  </button>
                </div>
              )}

              {order.paymentStatus === "PENDING" && order.paymentProof && (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => handleApprove(order._id)}
                    disabled={actionLoading}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "5px",
                      border: "none",
                      background: actionLoading ? "#ccc" : "#28a745",
                      color: "white",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectClick(order)}
                    disabled={actionLoading}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "5px",
                      border: "none",
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
                  <strong>Approved on:</strong>{" "}
                  {new Date(order.paymentApprovedAt).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {}
      {showImageModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Payment Proof</h2>
              <button className="modal-close" onClick={() => setShowImageModal(false)}>
                ×
              </button>
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

      {}
      {showRejectModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reject Payment</h2>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: "15px" }}>
                Please provide a reason for rejecting this payment:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ddd",
                  marginBottom: "15px",
                }}
              />
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowRejectModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "5px",
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={actionLoading || !rejectionReason.trim()}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "5px",
                    border: "none",
                    background:
                      actionLoading || !rejectionReason.trim() ? "#ccc" : "#dc3545",
                    color: "white",
                    cursor:
                      actionLoading || !rejectionReason.trim()
                        ? "not-allowed"
                        : "pointer",
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
