import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import QRScanner from "../components/QRScanner";
import "../App.css";

export default function AttendanceDashboard() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [eventType, setEventType] = useState("NORMAL");
  const [stats, setStats] = useState(null);
  const [scannedRegistrations, setScannedRegistrations] = useState([]);
  const [notScannedRegistrations, setNotScannedRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showManualOverride, setShowManualOverride] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideAction, setOverrideAction] = useState("mark");
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  // Loads event info, stats, and splits registrations into scanned/not-scanned
  const fetchAttendanceData = useCallback(async () => {
    try {
      const [eventRes, attendanceRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/attendance/dashboard/${eventId}`),
      ]);

      setEvent(eventRes.data.event || eventRes.data);
      setEventType(attendanceRes.data.eventType || "NORMAL");
      setStats(attendanceRes.data.stats);
      setScannedRegistrations(attendanceRes.data.scannedRegistrations);
      setNotScannedRegistrations(attendanceRes.data.notScannedRegistrations);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      alert("Error loading attendance data");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchAuditLog = async () => {
    try {
      const response = await api.get(`/attendance/audit/${eventId}`);
      setAuditLogs(response.data.logs);
      setShowAuditLog(true);
    } catch (error) {
      console.error("Error fetching audit log:", error);
      alert("Error loading audit log");
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const handleScanSuccess = () => {
    fetchAttendanceData();
  };

  // Submits a manual attendance override with a required reason for audit tracking
  const handleManualOverride = async (registrationId) => {
    if (!overrideReason.trim()) {
      alert("Please provide a reason for manual override");
      return;
    }

    try {
      await api.post(`/attendance/manual/${registrationId}`, {
        action: overrideAction,
        reason: overrideReason,
      });

      alert(`Attendance ${overrideAction === "mark" ? "marked" : "unmarked"} successfully`);
      setShowManualOverride(null);
      setOverrideReason("");
      fetchAttendanceData();
    } catch (error) {
      console.error("Error in manual override:", error);
      alert(error.response?.data?.message || "Error performing manual override");
    }
  };

  const exportCSV = async () => {
    try {
      const response = await api.get(`/attendance/export/${eventId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_${event?.name || "event"}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Error exporting attendance report");
    }
  };

  if (loading) {
    return <div className="container"><p>Loading attendance data...</p></div>;
  }

  // Labels adapt between normal event (attendance) and merch event (collection) modes
  const isMerch = eventType === "MERCH";
  const labels = {
    heading:              isMerch ? "Order Collection Tracking" : "Attendance Tracking",
    total:                isMerch ? "Total Approved Orders"     : "Total Registrations",
    scanned:              isMerch ? "Collected"                 : "Present",
    notScanned:           isMerch ? "Not Collected"             : "Absent",
    rate:                 isMerch ? "Collection Rate"           : "Attendance Rate",
    scanBtn:              isMerch ? "Scan to Mark Collected"    : "Start Scanning",
    scanBtnHide:          isMerch ? "Hide Scanner"              : "Hide Scanner",
    scannedHeading:       isMerch ? "Collected"                 : "Present",
    notScannedHeading:    isMerch ? "Not Yet Collected"         : "Absent",
    markPresent:          isMerch ? "Mark Collected"            : "Mark Present",
    markAbsent:           isMerch ? "Mark Not Collected"        : "Mark Absent",
    noScanned:            isMerch ? "No orders marked as collected yet." : "No participants scanned yet.",
    allScanned:           isMerch ? "All orders have been collected."    : "All participants have been scanned.",
    overrideConfirmMark:  isMerch ? "mark as collected"                  : "mark present",
    overrideConfirmUnmark:isMerch ? "mark as not collected"              : "mark absent",
    scannedAtLabel:       isMerch ? "Collected At"              : "Scanned At",
  };

  return (
    <div className="container">
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: "8px 16px", backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}
        >
          Back
        </button>
      </div>

      <h2 style={{ marginBottom: "8px" }}>{labels.heading}</h2>
      <h3 style={{ color: "#6b7280", fontWeight: "normal", marginTop: "0", marginBottom: "24px" }}>
        {event?.name}
      </h3>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="card" style={{ backgroundColor: "#dbeafe", borderLeft: "4px solid #3b82f6" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>{labels.total}</h4>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#1e3a8a" }}>{stats?.total || 0}</p>
        </div>
        <div className="card" style={{ backgroundColor: "#d1fae5", borderLeft: "4px solid #10b981" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#065f46" }}>{labels.scanned}</h4>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#064e3b" }}>{stats?.scanned || 0}</p>
        </div>
        <div className="card" style={{ backgroundColor: "#fee2e2", borderLeft: "4px solid #ef4444" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#991b1b" }}>{labels.notScanned}</h4>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#7f1d1d" }}>{stats?.notScanned || 0}</p>
        </div>
        <div className="card" style={{ backgroundColor: "#fef3c7", borderLeft: "4px solid #f59e0b" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#92400e" }}>{labels.rate}</h4>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#78350f" }}>{stats?.attendanceRate || 0}%</p>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <button
          onClick={() => setShowScanner(!showScanner)}
          style={{ padding: "12px 24px", backgroundColor: showScanner ? "#ef4444" : "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500" }}
        >
          {showScanner ? labels.scanBtnHide : labels.scanBtn}
        </button>
        <button
          onClick={exportCSV}
          style={{ padding: "12px 24px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500" }}
        >
          Export CSV
        </button>
        <button
          onClick={fetchAuditLog}
          style={{ padding: "12px 24px", backgroundColor: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500" }}
        >
          Audit Log
        </button>
      </div>

      {showScanner && <QRScanner eventId={eventId} onScanSuccess={handleScanSuccess} />}

      {/* Audit log modal */}
      {showAuditLog && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", maxWidth: "800px", width: "100%", maxHeight: "80vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0 }}>Audit Log ({auditLogs.length} entries)</h3>
              <button onClick={() => setShowAuditLog(false)} style={{ padding: "8px 16px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                Close
              </button>
            </div>
            {auditLogs.length === 0 ? (
              <p>No manual overrides recorded.</p>
            ) : (
              auditLogs.map((log, index) => (
                <div key={index} className="card" style={{ marginBottom: "12px" }}>
                  <p><b>Ticket ID:</b> {log.ticketId}</p>
                  <p><b>Participant:</b> {log.participant.displayName || log.participant.email}</p>
                  <p><b>Action:</b> {log.action}</p>
                  <p><b>Reason:</b> {log.reason}</p>
                  <p><b>Override By:</b> {log.overrideBy?.email}</p>
                  <p><b>Time:</b> {new Date(log.overrideAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Scanned / collected registrations list */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ backgroundColor: "#d1fae5", padding: "12px 16px", borderRadius: "8px", color: "#065f46", marginBottom: "12px" }}>
          {labels.scannedHeading} ({scannedRegistrations.length})
        </h3>
        {scannedRegistrations.length === 0 ? (
          <p style={{ color: "#6b7280", fontStyle: "italic" }}>{labels.noScanned}</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {scannedRegistrations.map((reg) => (
              <div key={reg._id} className="card" style={{ borderLeft: reg.manualOverride ? "4px solid #f59e0b" : "4px solid #10b981" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <b>{reg.participant.displayName || reg.participant.email}</b>
                      {reg.manualOverride && (
                        <span style={{ marginLeft: "8px", backgroundColor: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500" }}>
                          Manual Override
                        </span>
                      )}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "14px", color: "#6b7280" }}><b>Ticket ID:</b> {reg.ticketId}</p>
                    <p style={{ margin: "4px 0", fontSize: "14px", color: "#6b7280" }}><b>{labels.scannedAtLabel}:</b> {new Date(reg.scannedAt).toLocaleString()}</p>
                    {reg.scanCount > 1 && (
                      <p style={{ margin: "4px 0", fontSize: "14px", color: "#f59e0b" }}><b>Scan Attempts:</b> {reg.scanCount}</p>
                    )}
                    {reg.merchDetails && (
                      <p style={{ margin: "4px 0", fontSize: "14px", color: "#6b7280" }}>
                        <b>Merch:</b> {reg.merchDetails.size} / {reg.merchDetails.color} (x{reg.merchDetails.quantity})
                      </p>
                    )}
                    {reg.manualOverride && (
                      <p style={{ margin: "4px 0", fontSize: "14px", color: "#92400e" }}><b>Reason:</b> {reg.overrideReason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setShowManualOverride(reg._id); setOverrideAction("unmark"); }}
                    style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", marginLeft: "12px" }}
                  >
                    {labels.markAbsent}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Not-scanned / not-collected registrations list */}
      <div>
        <h3 style={{ backgroundColor: "#fee2e2", padding: "12px 16px", borderRadius: "8px", color: "#991b1b", marginBottom: "12px" }}>
          {labels.notScannedHeading} ({notScannedRegistrations.length})
        </h3>
        {notScannedRegistrations.length === 0 ? (
          <p style={{ color: "#6b7280", fontStyle: "italic" }}>{labels.allScanned}</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {notScannedRegistrations.map((reg) => (
              <div key={reg._id} className="card" style={{ borderLeft: "4px solid #ef4444", opacity: 0.8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 8px 0" }}><b>{reg.participant.displayName || reg.participant.email}</b></p>
                    <p style={{ margin: "4px 0", fontSize: "14px", color: "#6b7280" }}><b>Ticket ID:</b> {reg.ticketId}</p>
                    {reg.merchDetails && (
                      <p style={{ margin: "4px 0", fontSize: "14px", color: "#6b7280" }}>
                        <b>Merch:</b> {reg.merchDetails.size} / {reg.merchDetails.color} (x{reg.merchDetails.quantity})
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { setShowManualOverride(reg._id); setOverrideAction("mark"); }}
                    style={{ padding: "6px 12px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", marginLeft: "12px" }}
                  >
                    {labels.markPresent}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual override modal — requires a reason before confirming */}
      {showManualOverride && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", maxWidth: "500px", width: "100%" }}>
            <h3 style={{ marginTop: 0 }}>Manual Override</h3>
            <p style={{ color: "#6b7280" }}>
              You are about to{" "}
              {overrideAction === "mark" ? labels.overrideConfirmMark : labels.overrideConfirmUnmark}{" "}
              this participant manually. Please provide a reason for audit purposes.
            </p>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Enter reason for manual override..."
              rows={4}
              style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", marginBottom: "16px", resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => handleManualOverride(showManualOverride)}
                style={{ flex: 1, padding: "12px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
              >
                Confirm
              </button>
              <button
                onClick={() => { setShowManualOverride(null); setOverrideReason(""); }}
                style={{ flex: 1, padding: "12px", backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
