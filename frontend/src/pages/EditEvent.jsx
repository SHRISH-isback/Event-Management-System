import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function EditEvent() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        api.get(`/events/${eventId}`)
            .then(res => {
                const e = res.data;
                setEvent(e);
                setForm({
                    name: e.name || "",
                    description: e.description || "",
                    startDate: e.startDate ? e.startDate.slice(0, 10) : "",
                    endDate: e.endDate ? e.endDate.slice(0, 10) : "",
                    registrationDeadline: e.registrationDeadline ? e.registrationDeadline.slice(0, 10) : "",
                    registrationLimit: e.registrationLimit || "",
                    registrationFee: e.registrationFee ?? 0,
                    eligibility: e.eligibility || "",
                });
            })
            .catch(() => setError("Failed to load event"))
            .finally(() => setLoading(false));
    }, [eventId]);

    const isDraft = event?.status === "DRAFT";
    const isPublished = event?.status === "PUBLISHED";
    const isOngoing = event?.status === "ONGOING";

    const canEdit = (field) => {
        if (isDraft) return true;
        if (isPublished) return ["description", "registrationDeadline", "registrationLimit"].includes(field);
        return false;
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await api.patch(`/events/${eventId}`, form);
            setSuccess("Event updated successfully!");
            setTimeout(() => navigate("/organizer"), 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update event");
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!window.confirm(`Mark this event as ${newStatus}?`)) return;
        setSaving(true);
        setError("");
        try {
            await api.patch(`/events/${eventId}`, { status: newStatus });
            setSuccess(`Event marked as ${newStatus}`);
            setTimeout(() => navigate("/organizer"), 1200);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update status");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!event) return <div className="container"><p className="error">Event not found</p></div>;

    const statusColor = { DRAFT: "#f59e0b", PUBLISHED: "#10b981", ONGOING: "#3b82f6", COMPLETED: "#6b7280", CLOSED: "#ef4444" };

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0 }}>Edit Event</h2>
                <span style={{
                    padding: "4px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 700,
                    backgroundColor: statusColor[event.status] + "22",
                    color: statusColor[event.status],
                    border: `1px solid ${statusColor[event.status]}`,
                }}>
                    {event.status}
                </span>
            </div>

            {/* Edit restriction notice */}
            {!isDraft && (
                <div style={{
                    padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px",
                    backgroundColor: isOngoing ? "#eff6ff" : "#fef3c7",
                    border: `1px solid ${isOngoing ? "#93c5fd" : "#fcd34d"}`,
                    color: isOngoing ? "#1e40af" : "#92400e",
                }}>
                    {isOngoing
                        ? "This event is ongoing. You can only mark it as Completed."
                        : "Published events: only Description, Registration Deadline (extend only), and Registration Limit (increase only) can be edited."}
                </div>
            )}

            {error && <p className="error">{error}</p>}
            {success && <p style={{ color: "#10b981", fontWeight: "bold" }}>{success}</p>}

            {!isOngoing && (
                <form onSubmit={handleSave}>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Event Name</label>
                    <input className="input" name="name" value={form.name} onChange={handleChange}
                        disabled={!canEdit("name")} style={{ opacity: canEdit("name") ? 1 : 0.5 }} />

                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Description</label>
                    <textarea className="input" name="description" value={form.description} onChange={handleChange}
                        disabled={!canEdit("description")} style={{ opacity: canEdit("description") ? 1 : 0.5 }} />

                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Start Date</label>
                    <input className="input" type="date" name="startDate" value={form.startDate} onChange={handleChange}
                        disabled={!canEdit("startDate")} style={{ opacity: canEdit("startDate") ? 1 : 0.5 }} />

                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>End Date</label>
                    <input className="input" type="date" name="endDate" value={form.endDate} onChange={handleChange}
                        disabled={!canEdit("endDate")} style={{ opacity: canEdit("endDate") ? 1 : 0.5 }} />

                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Registration Deadline</label>
                    <input className="input" type="date" name="registrationDeadline" value={form.registrationDeadline} onChange={handleChange}
                        disabled={!canEdit("registrationDeadline")} style={{ opacity: canEdit("registrationDeadline") ? 1 : 0.5 }} />

                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Registration Limit</label>
                    <input className="input" type="number" name="registrationLimit" value={form.registrationLimit} onChange={handleChange}
                        disabled={!canEdit("registrationLimit")} style={{ opacity: canEdit("registrationLimit") ? 1 : 0.5 }} />

                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Registration Fee (₹)</label>
                    <input className="input" type="number" name="registrationFee" value={form.registrationFee} onChange={handleChange}
                        disabled={!canEdit("registrationFee")} style={{ opacity: canEdit("registrationFee") ? 1 : 0.5 }} />

                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Eligibility</label>
                    <input className="input" name="eligibility" value={form.eligibility} onChange={handleChange}
                        disabled={!canEdit("eligibility")} style={{ opacity: canEdit("eligibility") ? 1 : 0.5 }} />

                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button className="btn" type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button className="btn" type="button" onClick={() => navigate("/organizer")}
                            style={{ backgroundColor: "#6b7280" }}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Status transition buttons */}
            <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
                <h4 style={{ marginBottom: "12px" }}>Change Event Status</h4>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {isPublished && (
                        <button className="btn" onClick={() => handleStatusChange("ONGOING")}
                            style={{ backgroundColor: "#3b82f6" }} disabled={saving}>
                            Mark as Ongoing
                        </button>
                    )}
                    {isOngoing && (
                        <button className="btn" onClick={() => handleStatusChange("COMPLETED")}
                            style={{ backgroundColor: "#6b7280" }} disabled={saving}>
                            Mark as Completed
                        </button>
                    )}
                    {(isDraft || isPublished) && (
                        <button className="btn" onClick={() => handleStatusChange("CLOSED")}
                            style={{ backgroundColor: "#ef4444" }} disabled={saving}>
                            Close Event
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
