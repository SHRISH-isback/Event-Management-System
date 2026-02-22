import { useEffect, useState } from "react";
import api from "../api/axios";
import CalendarExport from "../components/CalendarExport";
import BatchCalendarExport from "../components/BatchCalendarExport";
import PaymentProofUpload from "../components/PaymentProofUpload";
import "../App.css";

export default function MyEvents() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [resendLoading, setResendLoading] = useState(null); 
  const [showCalendarExport, setShowCalendarExport] = useState(false);
  const [calendarRegistration, setCalendarRegistration] = useState(null);
  const [showBatchCalendarExport, setShowBatchCalendarExport] = useState(false);
  const [showPaymentUpload, setShowPaymentUpload] = useState(false);
  const [paymentRegistration, setPaymentRegistration] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const res = await api.get("/registrations/my");
        console.log('Fetched registrations:', res.data);
        setRegistrations(res.data);
      } catch (err) {
        console.error('Error fetching registrations:', err);
        console.error('Response:', err.response);
        setError(err.response?.data?.message || "Failed to load your events");
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, []);

  if (loading) {
    return <div className="container">Loading your events...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <p className="error">{error}</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  const now = new Date();
  const validRegistrations = registrations.filter(reg => reg.event);

  const upcomingEvents = validRegistrations.filter(
    (reg) => reg.status === "REGISTERED" && new Date(reg.event.startDate) >= now
  );

  const normalEvents = validRegistrations.filter(
    (reg) => reg.status === "REGISTERED" && reg.event.type === "NORMAL"
  );

  const merchandiseEvents = validRegistrations.filter(
    (reg) => reg.status === "REGISTERED" && reg.event.type === "MERCH"
  );

  const completedEvents = validRegistrations.filter(
    (reg) => reg.status === "REGISTERED" && new Date(reg.event.endDate) < now
  );

  const cancelledEvents = validRegistrations.filter(
    (reg) => reg.status === "CANCELLED"
  );

  const handleViewQRCode = async (registration) => {
    if (registration.event.type === "MERCH" && registration.paymentStatus !== "APPROVED") {
      const msgs = {
        PENDING: registration.paymentProof
          ? "Your payment is awaiting organizer approval. QR code will be available once approved."
          : "Please upload your payment proof first. QR code will be available after payment approval.",
        REJECTED: "Your payment was rejected. Please re-upload a valid payment proof.",
      };
      alert(msgs[registration.paymentStatus] || "QR code not available for this order.");
      return;
    }

    setSelectedRegistration(registration);
    setResendLoading(registration._id);
    
    try {
      console.log('Fetching QR code for registration:', registration._id);
      const res = await api.post(`/registrations/resend/${registration._id}`);
      console.log('QR code response:', res.data);
      
      if (res.data.qrCode) {
        setQrCodeData(res.data.qrCode);
        setShowQRModal(true);
      } else {
        alert("QR code not available for this registration");
      }
    } catch (err) {
      console.error('Error fetching QR code:', err);
      console.error('Error response:', err.response);
      
      const errorMessage = err.response?.data?.message || "Failed to retrieve QR code";
      alert(errorMessage);
    } finally {
      setResendLoading(null);
    }
  };

  const handleAddToCalendar = (registration) => {
    setCalendarRegistration(registration);
    setShowCalendarExport(true);
  };

  const handleBatchCalendarExport = () => {
    const eligibleRegistrations = upcomingEvents.filter(
      reg => reg.status === "REGISTERED" && new Date(reg.event.startDate) >= new Date()
    );
    
    if (eligibleRegistrations.length === 0) {
      alert("No upcoming registered events available for export");
      return;
    }
    
    setShowBatchCalendarExport(true);
  };

  const handleUploadPaymentProof = (registration) => {
    setPaymentRegistration(registration);
    setShowPaymentUpload(true);
  };

  const handlePaymentUploadSuccess = async () => {
    try {
      const res = await api.get("/registrations/my");
      setRegistrations(res.data);
    } catch (err) {
    }
  };

  const getTabCount = (tab) => {
    switch (tab) {
      case "upcoming":
        return upcomingEvents.length;
      case "normal":
        return normalEvents.length;
      case "merchandise":
        return merchandiseEvents.length;
      case "completed":
        return completedEvents.length;
      case "cancelled":
        return cancelledEvents.length;
      default:
        return 0;
    }
  };

  const getFilteredRegistrations = () => {
    switch (activeTab) {
      case "upcoming":
        return upcomingEvents;
      case "normal":
        return normalEvents;
      case "merchandise":
        return merchandiseEvents;
      case "completed":
        return completedEvents;
      case "cancelled":
        return cancelledEvents;
      default:
        return registrations;
    }
  };

  const filteredRegistrations = getFilteredRegistrations();

  const TabButton = ({ value, label }) => (
    <button
      onClick={() => setActiveTab(value)}
      style={{
        padding: "10px 20px",
        backgroundColor: activeTab === value ? "#2563eb" : "transparent",
        color: activeTab === value ? "white" : "#6b7280",
        border: activeTab === value ? "none" : "1px solid #d1d5db",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: activeTab === value ? "600" : "400",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
      onMouseEnter={(e) => {
        if (activeTab !== value) {
          e.currentTarget.style.backgroundColor = "#f3f4f6";
        }
      }}
      onMouseLeave={(e) => {
        if (activeTab !== value) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {label}
      <span
        style={{
          padding: "2px 8px",
          backgroundColor: activeTab === value ? "rgba(255,255,255,0.3)" : "#e5e7eb",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        {getTabCount(value)}
      </span>
    </button>
  );

  return (
    <div className="container">
      <h2>My Events Dashboard</h2>
      <p style={{ color: "#666", marginBottom: "25px" }}>
        View and manage all your event registrations and purchases
      </p>

      {}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap"
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            padding: "15px",
            backgroundColor: "#f9fafb",
            borderRadius: "12px",
            flex: 1
          }}
        >
          <TabButton value="upcoming" label="Upcoming" />
          <TabButton value="normal" label="Normal Events" />
          <TabButton value="merchandise" label="Merchandise" />
          <TabButton value="completed" label="Completed" />
          <TabButton value="cancelled" label="Cancelled" />
        </div>

        {filteredRegistrations.some(reg => reg.status === "REGISTERED" && new Date(reg.event.startDate) >= new Date()) && (
          <button
            onClick={handleBatchCalendarExport}
            style={{
              padding: "12px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap"
            }}
          >
             Export to Calendar
          </button>
        )}
      </div>

      {}
      {filteredRegistrations.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#6b7280", fontSize: "16px" }}>
            No events found in this category.
          </p>
        </div>
      )}

      {filteredRegistrations.map((reg) => {
        return (
        <div className="card" key={reg._id} style={{ position: "relative" }}>
          {}
          <div style={{ position: "absolute", top: "15px", right: "15px" }}>
            <span
              style={{
                padding: "6px 14px",
                backgroundColor: reg.event.type === "MERCH" ? "#fef3c7" : "#dbeafe",
                color: reg.event.type === "MERCH" ? "#92400e" : "#1e40af",
                borderRadius: "16px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              {reg.event.type === "MERCH" ? "Merchandise" : "Event"}
            </span>
          </div>

          <h3 style={{ marginBottom: "10px", paddingRight: "120px" }}>
            {reg.event.name}
          </h3>
          <p style={{ color: "#666", lineHeight: "1.6", marginBottom: "15px" }}>
            {reg.event.description}
          </p>

          <div style={{ display: "grid", gap: "10px", marginBottom: "15px" }}>
            <p style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}></span>
              <b>Event Dates:</b>{" "}
              {new Date(reg.event.startDate).toLocaleDateString()} –{" "}
              {new Date(reg.event.endDate).toLocaleDateString()}
            </p>

            <p style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}></span>
              <b>{reg.event.type === "MERCH" ? "Order ID" : "Ticket ID"}:</b>{" "}
              <span style={{ 
                color: "#2563eb", 
                fontWeight: "bold",
                fontFamily: "monospace",
                padding: "2px 8px",
                backgroundColor: "#eff6ff",
                borderRadius: "4px"
              }}>
                {reg.ticketId}
              </span>
            </p>

            <p style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>
                {reg.status === "REGISTERED" ? "✅" : "❌"}
              </span>
              <b>Status:</b>{" "}
              <span
                style={{
                  color: reg.status === "REGISTERED" ? "#16a34a" : "#dc2626",
                  fontWeight: "600",
                }}
              >
                {reg.status}
              </span>
            </p>
          </div>

          {reg.event.type === "MERCH" && reg.merchDetails && (
            <div
              style={{
                padding: "15px",
                backgroundColor: "#f0fdf4",
                borderRadius: "8px",
                marginTop: "15px",
                border: "1px solid #86efac",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontWeight: "bold",
                  color: "#16a34a",
                  fontSize: "15px",
                }}
              >
                 Merchandise Details:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <p style={{ margin: 0 }}>
                  <b>Size:</b> {reg.merchDetails.size}
                </p>
                <p style={{ margin: 0 }}>
                  <b>Color:</b> {reg.merchDetails.color}
                </p>
                <p style={{ margin: 0 }}>
                  <b>Quantity:</b> {reg.merchDetails.quantity}
                </p>
              </div>
            </div>
          )}

          {}
          {reg.event.type === "MERCH" && reg.paymentStatus && (
            <div
              style={{
                padding: "15px",
                backgroundColor:
                  reg.paymentStatus === "APPROVED"
                    ? "#d4edda"
                    : reg.paymentStatus === "REJECTED"
                    ? "#f8d7da"
                    : "#fff3cd",
                borderRadius: "8px",
                marginTop: "15px",
                border: `1px solid ${
                  reg.paymentStatus === "APPROVED"
                    ? "#28a745"
                    : reg.paymentStatus === "REJECTED"
                    ? "#dc3545"
                    : "#ffc107"
                }`,
              }}
            >
              <p style={{ margin: 0, fontWeight: "bold" }}>
                Payment Status:{" "}
                <span
                  style={{
                    color:
                      reg.paymentStatus === "APPROVED"
                        ? "#155724"
                        : reg.paymentStatus === "REJECTED"
                        ? "#721c24"
                        : "#856404",
                  }}
                >
                  {reg.paymentStatus === "PENDING"
                    ? "PENDING APPROVAL"
                    : reg.paymentStatus}
                </span>
              </p>
              {reg.paymentStatus === "PENDING" && (
                <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
                  ⏳ Payment proof uploaded. Awaiting organizer approval.
                </p>
              )}
              {reg.paymentStatus === "REJECTED" && reg.paymentRejectionReason && (
                <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
                  <strong>Reason:</strong> {reg.paymentRejectionReason}
                </p>
              )}
              {reg.paymentStatus === "REJECTED" && (
                <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
                  🔄 Please re-upload a valid payment proof.
                </p>
              )}
              {reg.paymentStatus === "APPROVED" && (
                <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
                  ✅ Your order has been confirmed! Use the QR code button below.
                </p>
              )}
            </div>
          )}

          {}
          {reg.status === "REGISTERED" && (
            <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
              {/* QR Code button — only for normal events OR approved merch orders */}
              {(reg.event.type === "NORMAL" || reg.paymentStatus === "APPROVED") && (
                <button
                  onClick={() => handleViewQRCode(reg)}
                  disabled={resendLoading === reg._id}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    backgroundColor: "#4f46e5",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: resendLoading === reg._id ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    opacity: resendLoading === reg._id ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    minWidth: "160px",
                  }}
                >
                  {resendLoading === reg._id ? "Loading..." : (
                    <>
                      <span>🎫</span>
                      View QR Code
                    </>
                  )}
                </button>
              )}

              {/* Re-upload payment proof — only after rejection */}
              {reg.event.type === "MERCH" && reg.paymentStatus === "REJECTED" && (
                <button
                  onClick={() => handleUploadPaymentProof(reg)}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    backgroundColor: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    minWidth: "190px",
                  }}
                >
                  <span>�</span>
                  Re-upload Payment Proof
                </button>
              )}

              {/* Add to Calendar — only for normal events with upcoming dates */}
              {reg.event.type === "NORMAL" && new Date(reg.event.startDate) >= new Date() && (
                <button
                  onClick={() => handleAddToCalendar(reg)}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    minWidth: "160px",
                  }}
                >
                  📅 Add to Calendar
                </button>
              )}
            </div>
          )}

          {}
          <p style={{ 
            marginTop: "15px", 
            color: "#888", 
            fontSize: "13px",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "10px"
          }}>
            Registered on: {new Date(reg.createdAt).toLocaleString()}
          </p>
        </div>
        );
      })}

      {}
      {showQRModal && qrCodeData && selectedRegistration && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            textAlign: "center",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
          }}>
            <div style={{
              fontSize: "32px",
              marginBottom: "10px"
            }}>
              
            </div>
            
            <h2 style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "10px",
              color: "#1f2937"
            }}>
              Your {selectedRegistration.event.type === "MERCH" ? "Order" : "Event"} Ticket
            </h2>
            
            <p style={{
              color: "#6b7280",
              marginBottom: "10px",
              fontSize: "16px",
              fontWeight: "600"
            }}>
              {selectedRegistration.event.name}
            </p>

            <div style={{
              backgroundColor: "#f3f4f6",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px"
            }}>
              <p style={{
                color: "#6b7280",
                fontSize: "12px",
                marginBottom: "5px",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                {selectedRegistration.event.type === "MERCH" ? "Order ID" : "Ticket ID"}
              </p>
              <p style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#4f46e5",
                letterSpacing: "2px"
              }}>
                {selectedRegistration.ticketId}
              </p>
            </div>

            <div style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              border: "2px solid #e5e7eb",
              marginBottom: "20px"
            }}>
              <img 
                src={qrCodeData} 
                alt="QR Code" 
                style={{
                  width: "250px",
                  height: "250px",
                  margin: "0 auto",
                  display: "block"
                }}
              />
              <p style={{
                color: "#6b7280",
                fontSize: "14px",
                marginTop: "15px"
              }}>
                {selectedRegistration.event.type === "MERCH" 
                  ? "Show this QR code to collect your merchandise"
                  : "Show this QR code at the event entrance"}
              </p>
            </div>

            <div style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #3b82f6",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              textAlign: "left"
            }}>
              <p style={{
                fontSize: "12px",
                color: "#1e40af",
                margin: 0
              }}>
                <strong>
                  {selectedRegistration.event.type === "MERCH"
                    ? "✅ Payment Approved!"
                    : "📧 Email Sent!"}
                </strong>
              </p>
              <p style={{
                fontSize: "12px",
                color: "#1e40af",
                margin: "5px 0 0 0"
              }}>
                {selectedRegistration.event.type === "MERCH"
                  ? "Your order is confirmed. A confirmation email with this QR code was sent upon approval."
                  : "A confirmation email with this QR code has been resent to your email address."}
              </p>
            </div>

            <div style={{
              display: "flex",
              gap: "10px"
            }}>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `ticket-${selectedRegistration.ticketId}.png`;
                  link.href = qrCodeData;
                  link.click();
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                Download QR Code
              </button>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setQrCodeData(null);
                  setSelectedRegistration(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#f3f4f6",
                  color: "#1f2937",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCalendarExport && calendarRegistration && (
        <CalendarExport
          registrationId={calendarRegistration._id}
          eventName={calendarRegistration.event.name}
          onClose={() => {
            setShowCalendarExport(false);
            setCalendarRegistration(null);
          }}
        />
      )}

      {showBatchCalendarExport && (
        <BatchCalendarExport
          registrations={filteredRegistrations.filter(
            (reg) => reg.status === "REGISTERED" && new Date(reg.event.startDate) >= new Date()
          )}
          onClose={() => setShowBatchCalendarExport(false)}
        />
      )}

      {showPaymentUpload && paymentRegistration && (
        <PaymentProofUpload
          registration={paymentRegistration}
          onSuccess={handlePaymentUploadSuccess}
          onClose={() => {
            setShowPaymentUpload(false);
            setPaymentRegistration(null);
          }}
        />
      )}
    </div>
  );
}
