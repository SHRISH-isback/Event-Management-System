import { useState } from "react";
import api from "../api/axios";

export default function BatchCalendarExport({ registrations, onClose }) {
  const [loading, setLoading] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [selectedRegistrations, setSelectedRegistrations] = useState(
    registrations.map((r) => r._id)
  );

  // Toggle a single registration in/out of the selection
  const toggleRegistration = (regId) => {
    setSelectedRegistrations((prev) =>
      prev.includes(regId) ? prev.filter((id) => id !== regId) : [...prev, regId]
    );
  };

  const toggleAll = () => {
    if (selectedRegistrations.length === registrations.length) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(registrations.map((r) => r._id));
    }
  };

  // Sends selected registration IDs to backend and downloads a combined .ics file
  const handleBatchExport = async () => {
    if (selectedRegistrations.length === 0) {
      alert("Please select at least one event to export");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        "/registrations/calendar/export/batch",
        { registrationIds: selectedRegistrations, reminderMinutes: parseInt(reminderMinutes) },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "text/calendar" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `my_events_${new Date().toISOString().split("T")[0]}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(`Successfully exported ${selectedRegistrations.length} event(s) to calendar!`);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to export events to calendar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0 }}> Batch Export to Calendar</h3>
          <button onClick={onClose} style={{ fontSize: "24px", border: "none", background: "none", cursor: "pointer" }}>
            ×
          </button>
        </div>

        <p style={{ color: "#666", marginBottom: "20px" }}>
          Select events to export to your calendar application
        </p>

        {/* Single reminder setting applied to all exported events */}
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
          <label style={{ fontWeight: "600", fontSize: "14px", display: "block", marginBottom: "8px" }}>
            Set Reminder for All Events
          </label>
          <select
            value={reminderMinutes}
            onChange={(e) => setReminderMinutes(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", fontSize: "14px" }}
          >
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="120">2 hours before</option>
            <option value="1440">1 day before</option>
            <option value="2880">2 days before</option>
          </select>
        </div>

        {/* Selectable list of registered events */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <label style={{ fontWeight: "600", fontSize: "14px" }}>
              Select Events ({selectedRegistrations.length}/{registrations.length})
            </label>
            <button
              onClick={toggleAll}
              style={{ background: "none", border: "1px solid #007bff", color: "#007bff", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
            >
              {selectedRegistrations.length === registrations.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "8px", padding: "10px" }}>
            {registrations.map((reg) => (
              <div
                key={reg._id}
                onClick={() => toggleRegistration(reg._id)}
                style={{
                  padding: "10px",
                  marginBottom: "8px",
                  backgroundColor: selectedRegistrations.includes(reg._id) ? "#e7f3ff" : "#f8f9fa",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: selectedRegistrations.includes(reg._id) ? "2px solid #007bff" : "2px solid transparent",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    checked={selectedRegistrations.includes(reg._id)}
                    onChange={() => toggleRegistration(reg._id)}
                    style={{ cursor: "pointer" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "2px" }}>{reg.event.name}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {new Date(reg.event.startDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                      {" • "}
                      {new Date(reg.event.startDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {reg.event.type === "MERCH" && (
                    <span style={{ fontSize: "11px", backgroundColor: "#ffc107", color: "#000", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
                      MERCH
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleBatchExport}
          disabled={loading || selectedRegistrations.length === 0}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: selectedRegistrations.length === 0 ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading || selectedRegistrations.length === 0 ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "16px",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Exporting..." : `Export ${selectedRegistrations.length} Event(s) to Calendar`}
        </button>

        <div style={{ marginTop: "15px", padding: "12px", backgroundColor: "#e7f3ff", borderRadius: "8px", fontSize: "13px" }}>
          <strong>💡 Tip:</strong> The exported .ics file will contain all selected events and can be imported into any calendar application.
        </div>
      </div>
    </div>
  );
}
