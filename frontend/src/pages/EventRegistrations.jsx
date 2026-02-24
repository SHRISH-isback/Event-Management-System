import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { fuzzyMatch } from "../utils/fuzzyMatch";

// Badge style definitions for attendance and payment statuses
const BADGE = {
  present: { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", label: "Present" },
  absent:  { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", label: "Absent"  },
  approved:{ bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", label: "Approved"},
  pending: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d", label: "Pending" },
  rejected:{ bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", label: "Rejected"},
};

// Pill badge for attendance/payment status display
function Badge({ type }) {
  const b = BADGE[type] || BADGE.absent;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "99px",
      fontSize: "12px",
      fontWeight: 600,
      backgroundColor: b.bg,
      color: b.color,
      border: `1px solid ${b.border}`,
    }}>
      {b.label}
    </span>
  );
}

// Summary stat card used in the statistics row
function StatCard({ label, value, bg, accent }) {
  return (
    <div style={{
      backgroundColor: bg,
      borderLeft: `4px solid ${accent}`,
      borderRadius: "10px",
      padding: "16px 20px",
      minWidth: 0,
    }}>
      <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>{label}</p>
      <p style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#111827" }}>{value}</p>
    </div>
  );
}

export default function EventRegistrations() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAttendance, setFilterAttendance] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);

  // Fetch event details, registrations, and analytics
  useEffect(() => {
    Promise.all([
      api.get(`/events/${eventId}`),
      api.get(`/registrations/event/${eventId}`),
      api.get(`/events/${eventId}/analytics`).catch(() => null),
    ])
      .then(([evRes, regRes, analyticsRes]) => {
        setEvent(evRes.data.event || evRes.data);
        setRegistrations(regRes.data);
        if (analyticsRes) setAnalytics(analyticsRes.data);
      })
      .catch(err => setError(err.response?.data?.message || "Failed to load registrations"))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Compute summary statistics from the registrations list
  const stats = useMemo(() => {
    const total = registrations.length;
    const present = registrations.filter(r => r.attendance?.scanned).length;
    const merch = registrations.filter(r => r.merchDetails).length;
    const pendingPayment = registrations.filter(r => r.paymentStatus === "PENDING").length;
    const hasPaidRegistrations = registrations.some(r => r.paymentStatus && r.paymentStatus !== "NOT_REQUIRED");
    return { total, present, absent: total - present, merch, pendingPayment, hasPaidRegistrations };
  }, [registrations]);

  // Apply search and filter criteria to produce the visible list
  const filtered = useMemo(() => {
    return registrations.filter(r => {
      const name = (r.participant?.displayName || r.participant?.email || "").toLowerCase();
      const ticket = (r.ticketId || "").toLowerCase();
      const q = search.toLowerCase();
      if (q && !fuzzyMatch(name, q) && !fuzzyMatch(ticket, q)) return false;

      if (filterAttendance === "present" && !r.attendance?.scanned) return false;
      if (filterAttendance === "absent" && r.attendance?.scanned) return false;

      if (filterPayment !== "all") {
        if (!r.paymentStatus || r.paymentStatus === "NOT_REQUIRED") return false;
        if (filterPayment !== "all" && r.paymentStatus !== filterPayment) return false;
      }

      return true;
    });
  }, [registrations, search, filterAttendance, filterPayment]);

  const isMerch = event?.type === "MERCH";
  const showPaymentFilter = isMerch || stats.hasPaidRegistrations;

  // CSV export handler
  const handleExportCSV = async () => {
    setCsvLoading(true);
    try {
      const res = await api.get(`/registrations/export/${eventId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `registrations-${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to export CSV");
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Page header with back navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "6px 14px", background: "#f3f4f6", border: "1px solid #d1d5db",
            borderRadius: "6px", cursor: "pointer", fontSize: "14px", color: "#374151",
          }}
        >
          Back
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#111827" }}>
            Registrations
          </h2>
          {event && (
            <p style={{ margin: "2px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
              {event.name}
              {event.type && (
                <span style={{
                  marginLeft: "8px", padding: "1px 8px", borderRadius: "99px",
                  fontSize: "11px", fontWeight: 600,
                  background: isMerch ? "#fef3c7" : "#dbeafe",
                  color: isMerch ? "#92400e" : "#1e40af",
                }}>
                  {event.type}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
          Loading registrations...
        </div>
      )}
      {error && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b",
          borderRadius: "8px", padding: "12px 16px", marginBottom: "16px",
        }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary statistics row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
            marginBottom: "24px",
            marginTop: "16px",
          }}>
            <StatCard label="Total Registered" value={stats.total} bg="#dbeafe" accent="#3b82f6" />
            <StatCard label="Present" value={stats.present} bg="#d1fae5" accent="#10b981" />
            <StatCard label="Absent" value={stats.absent} bg="#fee2e2" accent="#ef4444" />
            {showPaymentFilter && (
              <StatCard label="Pending Payment" value={stats.pendingPayment} bg="#fef3c7" accent="#f59e0b" />
            )}
            <StatCard
              label="Attendance Rate"
              value={stats.total > 0 ? `${((stats.present / stats.total) * 100).toFixed(1)}%` : "—"}
              bg="#f3e8ff"
              accent="#8b5cf6"
            />
          </div>

          {/* Search and filter controls */}
          <div style={{
            display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px",
            alignItems: "center",
          }}>
            <input
              type="text"
              placeholder="Search by name or ticket ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px",
                fontSize: "14px", flex: "1 1 220px", minWidth: 0, outline: "none",
              }}
            />
            <select
              value={filterAttendance}
              onChange={e => setFilterAttendance(e.target.value)}
              style={{
                padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px",
                fontSize: "14px", background: "white", cursor: "pointer",
              }}
            >
              <option value="all">All Attendance</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
            {showPaymentFilter && (
              <select
                value={filterPayment}
                onChange={e => setFilterPayment(e.target.value)}
                style={{
                  padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px",
                  fontSize: "14px", background: "white", cursor: "pointer",
                }}
              >
                <option value="all">All Payment Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            )}
            <span style={{ fontSize: "13px", color: "#6b7280", marginLeft: "4px" }}>
              {filtered.length} of {registrations.length} shown
            </span>
          </div>

          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "48px", color: "#9ca3af",
              background: "#f9fafb", borderRadius: "12px", border: "1px solid #e5e7eb",
            }}>
              No registrations match your filters.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Table header row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: showPaymentFilter
                  ? "2fr 1.2fr 1fr 1fr 1fr 40px"
                  : "2fr 1.2fr 1fr 1fr 40px",
                gap: "8px",
                padding: "8px 16px",
                background: "#f3f4f6",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                <span>Participant</span>
                <span>Ticket ID</span>
                <span>Attendance</span>
                {showPaymentFilter && <span>Payment</span>}
                <span>Registered</span>
                <span></span>
              </div>

              {/* Registration rows — click to expand details */}
              {filtered.map(r => {
                const isExpanded = expandedId === r._id;
                const displayName = r.participant?.displayName || r.participant?.email || "—";
                const attendanceStatus = r.attendance?.scanned ? "present" : "absent";
                const paymentBadgeType =
                  r.paymentStatus === "APPROVED" ? "approved" :
                  r.paymentStatus === "PENDING" ? "pending" :
                  r.paymentStatus === "REJECTED" ? "rejected" : null;

                return (
                  <div
                    key={r._id}
                    style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      overflow: "hidden",
                      borderLeft: r.attendance?.scanned ? "4px solid #10b981" : "4px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: showPaymentFilter
                          ? "2fr 1.2fr 1fr 1fr 1fr 40px"
                          : "2fr 1.2fr 1fr 1fr 40px",
                        gap: "8px",
                        padding: "12px 16px",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : r._id)}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#111827" }}>
                          {displayName}
                        </p>
                        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>
                          {r.participant?.email}
                        </p>
                      </div>
                      <span style={{ fontSize: "13px", color: "#6b7280", fontFamily: "monospace" }}>
                        {r.ticketId}
                      </span>
                      <span><Badge type={attendanceStatus} /></span>
                      {showPaymentFilter && (
                        <span>{paymentBadgeType ? <Badge type={paymentBadgeType} /> : <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>}</span>
                      )}
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                        {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span style={{ textAlign: "center", color: "#9ca3af", fontSize: "18px", userSelect: "none" }}>
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>

                    {/* Expanded detail panel: attendance, merch, form responses, participant info */}
                    {isExpanded && (
                      <div style={{
                        padding: "12px 16px 16px",
                        borderTop: "1px solid #f3f4f6",
                        background: "#fafafa",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "16px",
                      }}>
                        <div style={{ flex: "1 1 200px" }}>
                          <p style={{ margin: "0 0 6px 0", fontWeight: 600, fontSize: "13px", color: "#374151" }}>
                            Attendance
                          </p>
                          {r.attendance?.scanned ? (
                            <>
                              <p style={{ margin: "3px 0", fontSize: "13px", color: "#6b7280" }}>
                                Scanned: {new Date(r.attendance.scannedAt).toLocaleString()}
                              </p>
                              {r.attendance.scanCount > 1 && (
                                <p style={{ margin: "3px 0", fontSize: "13px", color: "#f59e0b" }}>
                                  Scan attempts: {r.attendance.scanCount}
                                </p>
                              )}
                              {r.attendance.manualOverride && (
                                <p style={{ margin: "3px 0", fontSize: "13px", color: "#92400e" }}>
                                  Manual override: {r.attendance.overrideReason}
                                </p>
                              )}
                            </>
                          ) : (
                            <p style={{ margin: "3px 0", fontSize: "13px", color: "#9ca3af" }}>Not scanned yet.</p>
                          )}
                        </div>

                        {r.merchDetails?.size && (
                          <div style={{ flex: "1 1 200px" }}>
                            <p style={{ margin: "0 0 6px 0", fontWeight: 600, fontSize: "13px", color: "#374151" }}>
                              Merchandise
                            </p>
                            <p style={{ margin: "3px 0", fontSize: "13px", color: "#6b7280" }}>
                              Size: <b>{r.merchDetails.size}</b>
                            </p>
                            <p style={{ margin: "3px 0", fontSize: "13px", color: "#6b7280" }}>
                              Color: <b>{r.merchDetails.color}</b>
                            </p>
                            <p style={{ margin: "3px 0", fontSize: "13px", color: "#6b7280" }}>
                              Qty: <b>{r.merchDetails.quantity}</b>
                            </p>
                            {r.paymentStatus && r.paymentStatus !== "NOT_REQUIRED" && (
                              <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
                                Payment: <Badge type={r.paymentStatus?.toLowerCase()} />
                              </p>
                            )}
                            {r.paymentRejectionReason && (
                              <p style={{ margin: "3px 0", fontSize: "13px", color: "#991b1b" }}>
                                Rejection reason: {r.paymentRejectionReason}
                              </p>
                            )}
                          </div>
                        )}

                        {r.formResponses && Object.keys(r.formResponses).length > 0 && (
                          <div style={{ flex: "2 1 300px" }}>
                            <p style={{ margin: "0 0 6px 0", fontWeight: 600, fontSize: "13px", color: "#374151" }}>
                              Form Responses
                            </p>
                            {Object.entries(r.formResponses).map(([key, value]) => (
                              <p key={key} style={{ margin: "3px 0", fontSize: "13px", color: "#6b7280" }}>
                                <b>{key}:</b> {Array.isArray(value) ? value.join(", ") : String(value)}
                              </p>
                            ))}
                          </div>
                        )}

                        {(r.participant?.participantType || r.participant?.contactNumber) && (
                          <div style={{ flex: "1 1 200px" }}>
                            <p style={{ margin: "0 0 6px 0", fontWeight: 600, fontSize: "13px", color: "#374151" }}>
                              Participant Info
                            </p>
                            {r.participant.participantType && (
                              <p style={{ margin: "3px 0", fontSize: "13px", color: "#6b7280" }}>
                                Type: <b>{r.participant.participantType}</b>
                              </p>
                            )}
                            {r.participant.contactNumber && (
                              <p style={{ margin: "3px 0", fontSize: "13px", color: "#6b7280" }}>
                                Contact: {r.participant.contactNumber}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Analytics and CSV export panel */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "18px" }}>
        <button className="btn" onClick={() => setShowAnalytics(a => !a)} style={{ backgroundColor: "#3b82f6" }}>
          {showAnalytics ? "Hide Analytics" : "Show Analytics"}
        </button>
        <button className="btn" onClick={handleExportCSV} disabled={csvLoading} style={{ backgroundColor: "#10b981" }}>
          {csvLoading ? "Exporting..." : "Export CSV"}
        </button>
      </div>
      {showAnalytics && analytics && (
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "18px 24px", marginBottom: "18px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#1e40af" }}>Event Analytics</h3>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginTop: "12px" }}>
            <div><b>Total Registrations:</b> {analytics.totalRegistrations}</div>
            <div><b>Attendance Rate:</b> {analytics.attendanceRate}%</div>
            <div><b>Revenue:</b> ₹{analytics.revenue}</div>
          </div>
          <div style={{ marginTop: "12px" }}>
            <b>Registrations (last 7 days):</b>
            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              {analytics.timeline.map((d, i) => (
                <div key={i} style={{ minWidth: 60, textAlign: "center" }}>
                  <div style={{ fontWeight: 600 }}>{d.count}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>{d.date}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: "12px" }}>
            <b>Payment Status Breakdown:</b>
            <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
              {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                <span key={status} style={{ background: "#e0e7ef", borderRadius: "8px", padding: "4px 10px", fontSize: "13px" }}>
                  {status}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
