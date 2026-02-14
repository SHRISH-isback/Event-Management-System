import { useState } from "react";
import api from "../api/axios";

export default function CalendarExport({ registrationId, eventName, onClose }) {
  const [loading, setLoading] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [showReminderOptions, setShowReminderOptions] = useState(false);

  const handleDownloadICS = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/registrations/calendar/export/${registrationId}?reminderMinutes=${reminderMinutes}`,
        { responseType: "blob" }
      );
      
      const blob = new Blob([response.data], { type: "text/calendar" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${eventName.replace(/[^a-z0-9]/gi, '_')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert("Calendar file downloaded successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to download calendar file");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCalendar = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/registrations/calendar/links/${registrationId}`);
      window.open(response.data.googleCalendar, "_blank");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to open Google Calendar");
    } finally {
      setLoading(false);
    }
  };

  const handleOutlookCalendar = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/registrations/calendar/links/${registrationId}`);
      window.open(response.data.outlook, "_blank");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to open Outlook Calendar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0 }}> Add to Calendar</h3>
          <button onClick={onClose} style={{ fontSize: "24px", border: "none", background: "none", cursor: "pointer" }}>
            ×
          </button>
        </div>

        <p style={{ color: "#666", marginBottom: "20px" }}>
          Export <strong>{eventName}</strong> to your calendar application
        </p>

        {}
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <label style={{ fontWeight: "600", fontSize: "14px" }}>
              Set Reminder
            </label>
            <button 
              onClick={() => setShowReminderOptions(!showReminderOptions)}
              style={{ 
                background: "none", 
                border: "1px solid #ddd", 
                borderRadius: "4px", 
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              {showReminderOptions ? "Hide" : "Customize"}
            </button>
          </div>
          
          {showReminderOptions && (
            <div>
              <select 
                value={reminderMinutes} 
                onChange={(e) => setReminderMinutes(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "8px", 
                  borderRadius: "4px", 
                  border: "1px solid #ddd",
                  fontSize: "14px"
                }}
              >
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="120">2 hours before</option>
                <option value="1440">1 day before</option>
                <option value="2880">2 days before</option>
              </select>
            </div>
          )}
          
          {!showReminderOptions && (
            <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
              Reminder set for {reminderMinutes} minutes before event
            </p>
          )}
        </div>

        {}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={handleDownloadICS}
            disabled={loading}
            style={{
              padding: "12px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: loading ? 0.6 : 1
            }}
          >
             Download .ics File (Universal)
          </button>

          <button
            onClick={handleGoogleCalendar}
            disabled={loading}
            style={{
              padding: "12px",
              backgroundColor: "#4285f4",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: loading ? 0.6 : 1
            }}
          >
             Add to Google Calendar
          </button>

          <button
            onClick={handleOutlookCalendar}
            disabled={loading}
            style={{
              padding: "12px",
              backgroundColor: "#0078d4",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: loading ? 0.6 : 1
            }}
          >
             Add to Outlook Calendar
          </button>
        </div>

        <div style={{ marginTop: "20px", padding: "12px", backgroundColor: "#e7f3ff", borderRadius: "8px", fontSize: "13px" }}>
          <strong> Tip:</strong> The .ics file works with Apple Calendar, Google Calendar, Outlook, and most other calendar applications.
        </div>
      </div>
    </div>
  );
}
