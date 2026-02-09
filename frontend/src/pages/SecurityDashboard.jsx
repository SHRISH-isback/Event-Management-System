import { useEffect, useState } from "react";
import api from "../api/axios";
import "../App.css";

export default function SecurityDashboard() {
    const [stats, setStats] = useState(null);
    const [events, setEvents] = useState([]);
    const [blockedIPs, setBlockedIPs] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    
    const [eventTypeFilter, setEventTypeFilter] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [resolvedFilter, setResolvedFilter] = useState("");
    const [daysFilter, setDaysFilter] = useState(7);
    
    const [showBlockForm, setShowBlockForm] = useState(false);
    const [blockIP, setBlockIP] = useState("");
    const [blockReason, setBlockReason] = useState("");
    const [blockPermanent, setBlockPermanent] = useState(false);
    const [blockHours, setBlockHours] = useState(24);

    useEffect(() => {
        fetchData();
    }, [daysFilter, eventTypeFilter, severityFilter, resolvedFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, eventsRes, blockedRes] = await Promise.all([
                api.get(`/security/stats?days=${daysFilter}`),
                api.get(`/security/events`, {
                    params: {
                        eventType: eventTypeFilter,
                        severity: severityFilter,
                        resolved: resolvedFilter,
                        limit: 100,
                    },
                }),
                api.get("/security/blocked-ips"),
            ]);

            setStats(statsRes.data);
            setEvents(eventsRes.data.events);
            setBlockedIPs(blockedRes.data.blockedIPs);
        } catch (error) {
            console.error("Error fetching security data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveEvent = async (eventId) => {
        try {
            await api.patch(`/security/events/${eventId}/resolve`);
            fetchData();
        } catch (error) {
            alert("Failed to resolve event");
        }
    };

    const handleBlockIPSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/security/blocked-ips", {
                ipAddress: blockIP,
                reason: blockReason,
                permanent: blockPermanent,
                expiresInHours: blockPermanent ? null : blockHours,
            });
            setShowBlockForm(false);
            setBlockIP("");
            setBlockReason("");
            setBlockPermanent(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to block IP");
        }
    };

    const handleUnblockIP = async (ipAddress) => {
        if (!window.confirm(`Unblock IP ${ipAddress}?`)) return;
        
        try {
            await api.delete(`/security/blocked-ips/${ipAddress}`);
            fetchData();
        } catch (error) {
            alert("Failed to unblock IP");
        }
    };

    const getSeverityColor = (severity) => {
        const colors = {
            LOW: "#4caf50",
            MEDIUM: "#ff9800",
            HIGH: "#f44336",
            CRITICAL: "#9c27b0",
        };
        return colors[severity] || "#666";
    };

    if (loading) {
        return (
            <div className="container">
                <h2>Security Dashboard</h2>
                <p>Loading security data...</p>
            </div>
        );
    }

    return (
        <div className="container">
            <h2> Security Dashboard</h2>

            {}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <button
                    className={activeTab === "overview" ? "btn" : "btn-secondary"}
                    onClick={() => setActiveTab("overview")}
                >
                    Overview
                </button>
                <button
                    className={activeTab === "events" ? "btn" : "btn-secondary"}
                    onClick={() => setActiveTab("events")}
                >
                    Security Events
                </button>
                <button
                    className={activeTab === "blocked" ? "btn" : "btn-secondary"}
                    onClick={() => setActiveTab("blocked")}
                >
                    Blocked IPs
                </button>
            </div>

            {}
            {activeTab === "overview" && stats && (
                <div>
                    <div style={{ marginBottom: "20px" }}>
                        <label>Time Period: </label>
                        <select value={daysFilter} onChange={(e) => setDaysFilter(e.target.value)}>
                            <option value={1}>Last 24 hours</option>
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>
                    </div>

                    {}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "30px" }}>
                        <div className="card" style={{ textAlign: "center" }}>
                            <h3 style={{ margin: "0 0 10px 0", fontSize: "2em" }}>{stats.summary.totalEvents}</h3>
                            <p style={{ margin: 0, color: "#666" }}>Total Events</p>
                        </div>
                        <div className="card" style={{ textAlign: "center", borderLeft: "4px solid #f44336" }}>
                            <h3 style={{ margin: "0 0 10px 0", fontSize: "2em", color: "#f44336" }}>{stats.summary.unresolvedCount}</h3>
                            <p style={{ margin: 0, color: "#666" }}>Unresolved</p>
                        </div>
                        <div className="card" style={{ textAlign: "center", borderLeft: "4px solid #ff9800" }}>
                            <h3 style={{ margin: "0 0 10px 0", fontSize: "2em", color: "#ff9800" }}>{stats.summary.blockedIPsCount}</h3>
                            <p style={{ margin: 0, color: "#666" }}>Blocked IPs</p>
                        </div>
                    </div>

                    {}
                    <div className="card" style={{ marginBottom: "20px" }}>
                        <h3>Events by Type</h3>
                        {stats.eventsByType.map((item) => (
                            <div key={item._id} style={{ marginBottom: "10px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                    <span>{item._id}</span>
                                    <span><b>{item.count}</b></span>
                                </div>
                                <div style={{ width: "100%", height: "8px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
                                    <div
                                        style={{
                                            width: `${(item.count / stats.summary.totalEvents) * 100}%`,
                                            height: "100%",
                                            backgroundColor: "#2196f3",
                                            borderRadius: "4px",
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {}
                    <div className="card">
                        <h3>Top Suspicious IPs</h3>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #ddd" }}>
                                    <th style={{ padding: "10px", textAlign: "left" }}>IP Address</th>
                                    <th style={{ padding: "10px", textAlign: "right" }}>Events</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.topIPs.map((ip, index) => (
                                    <tr key={index} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                        <td style={{ padding: "10px" }}>{ip._id}</td>
                                        <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold" }}>{ip.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {}
            {activeTab === "events" && (
                <div>
                    {}
                    <div className="card" style={{ marginBottom: "20px" }}>
                        <h3>Filters</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                            <div>
                                <label>Event Type:</label>
                                <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)}>
                                    <option value="">All Types</option>
                                    <option value="FAILED_LOGIN">Failed Login</option>
                                    <option value="RATE_LIMIT_EXCEEDED">Rate Limit Exceeded</option>
                                    <option value="CAPTCHA_FAILED">CAPTCHA Failed</option>
                                    <option value="IP_BLOCKED">IP Blocked</option>
                                    <option value="SUSPICIOUS_ACTIVITY">Suspicious Activity</option>
                                </select>
                            </div>
                            <div>
                                <label>Severity:</label>
                                <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                                    <option value="">All Severities</option>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label>Status:</label>
                                <select value={resolvedFilter} onChange={(e) => setResolvedFilter(e.target.value)}>
                                    <option value="">All</option>
                                    <option value="false">Unresolved</option>
                                    <option value="true">Resolved</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {}
                    {events.length === 0 ? (
                        <p>No security events found.</p>
                    ) : (
                        events.map((event) => (
                            <div key={event._id} className="card" style={{ marginBottom: "15px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                            <span
                                                style={{
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                    backgroundColor: getSeverityColor(event.severity),
                                                    color: "white",
                                                    fontSize: "0.85em",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {event.severity}
                                            </span>
                                            <span style={{ fontWeight: "bold" }}>{event.eventType}</span>
                                            {event.resolved && (
                                                <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "#4caf50", color: "white", fontSize: "0.85em" }}>
                                                    ✓ Resolved
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ margin: "5px 0" }}>
                                            <b>IP:</b> {event.ipAddress}
                                        </p>
                                        {event.email && (
                                            <p style={{ margin: "5px 0" }}>
                                                <b>Email:</b> {event.email}
                                            </p>
                                        )}
                                        <p style={{ margin: "5px 0", color: "#666", fontSize: "0.9em" }}>
                                            {new Date(event.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        {!event.resolved && (
                                            <button
                                                className="btn"
                                                style={{ fontSize: "0.9em" }}
                                                onClick={() => handleResolveEvent(event._id)}
                                            >
                                                Mark Resolved
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {}
            {activeTab === "blocked" && (
                <div>
                    <div style={{ marginBottom: "20px" }}>
                        <button className="btn" onClick={() => setShowBlockForm(true)}>
                             Block New IP
                        </button>
                    </div>

                    {}
                    {showBlockForm && (
                        <div className="modal-overlay" onClick={() => setShowBlockForm(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h3>Block IP Address</h3>
                                <form onSubmit={handleBlockIPSubmit}>
                                    <div style={{ marginBottom: "15px" }}>
                                        <label>IP Address:</label>
                                        <input
                                            type="text"
                                            value={blockIP}
                                            onChange={(e) => setBlockIP(e.target.value)}
                                            placeholder="e.g., 192.168.1.1"
                                            required
                                        />
                                    </div>
                                    <div style={{ marginBottom: "15px" }}>
                                        <label>Reason:</label>
                                        <textarea
                                            value={blockReason}
                                            onChange={(e) => setBlockReason(e.target.value)}
                                            rows="3"
                                            required
                                        ></textarea>
                                    </div>
                                    <div style={{ marginBottom: "15px" }}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={blockPermanent}
                                                onChange={(e) => setBlockPermanent(e.target.checked)}
                                            />
                                            {" "}Permanent Block
                                        </label>
                                    </div>
                                    {!blockPermanent && (
                                        <div style={{ marginBottom: "15px" }}>
                                            <label>Block Duration (hours):</label>
                                            <input
                                                type="number"
                                                value={blockHours}
                                                onChange={(e) => setBlockHours(e.target.value)}
                                                min="1"
                                            />
                                        </div>
                                    )}
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button type="submit" className="btn">
                                            Block IP
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setShowBlockForm(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {}
                    {blockedIPs.length === 0 ? (
                        <p>No blocked IPs.</p>
                    ) : (
                        blockedIPs.map((blocked) => (
                            <div key={blocked._id} className="card" style={{ marginBottom: "15px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: "0 0 10px 0" }}>{blocked.ipAddress}</h3>
                                        <p style={{ margin: "5px 0" }}>
                                            <b>Reason:</b> {blocked.reason}
                                        </p>
                                        <p style={{ margin: "5px 0" }}>
                                            <b>Type:</b>{" "}
                                            {blocked.permanent ? (
                                                <span style={{ color: "#f44336" }}>Permanent</span>
                                            ) : (
                                                <span>
                                                    Temporary (expires:{" "}
                                                    {new Date(blocked.expiresAt).toLocaleString()})
                                                </span>
                                            )}
                                        </p>
                                        {blocked.autoBlocked && (
                                            <p style={{ margin: "5px 0", color: "#ff9800" }}>
                                                 Auto-blocked
                                            </p>
                                        )}
                                        <p style={{ margin: "5px 0", color: "#666", fontSize: "0.9em" }}>
                                            Blocked: {new Date(blocked.createdAt).toLocaleString()}
                                        </p>
                                        <p style={{ margin: "5px 0", color: "#666", fontSize: "0.9em" }}>
                                            Failed attempts: {blocked.failedAttempts}
                                        </p>
                                    </div>
                                    <div>
                                        <button
                                            className="btn"
                                            style={{ backgroundColor: "#4caf50" }}
                                            onClick={() => handleUnblockIP(blocked.ipAddress)}
                                        >
                                            Unblock
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
