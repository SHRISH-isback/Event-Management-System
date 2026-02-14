import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import CalendarExport from "../components/CalendarExport";
import "../App.css";

export default function EventDetails() {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [registrationCount, setRegistrationCount] = useState(0);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationId, setRegistrationId] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [ticketId, setTicketId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const role = localStorage.getItem("role");
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showCustomFormModal, setShowCustomFormModal] = useState(false);
    const [formResponses, setFormResponses] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [showCalendarExport, setShowCalendarExport] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${eventId}`);
                setEvent(res.data);
                
                if (role === "PARTICIPANT") {
                    try {
                        const regRes = await api.get(`/registrations/check/${eventId}`);
                        setIsRegistered(regRes.data.isRegistered);
                        setRegistrationId(regRes.data.registrationId);
                    } catch (err) {
                    }
                }

                try {
                    const countRes = await api.get(`/registrations/count/${eventId}`);
                    setRegistrationCount(countRes.data.count);
                } catch (err) {
                }
            } catch {
                setError("Failed to load event details");
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId, role]);

    const handleRegister = async () => {
        setError("");
        setMessage("");

        if (event.type === "MERCH" && !showPurchaseModal) {
            setShowPurchaseModal(true);
            return;
        }

        if (event.type === "NORMAL" && event.customFields && event.customFields.length > 0 && !showCustomFormModal) {
            setShowCustomFormModal(true);
            return;
        }

        try {
            const requestData = {};

            if (event.type === "MERCH") {
                if (!selectedSize || !selectedColor) {
                    setError("Please select both size and color");
                    return;
                }
                requestData.size = selectedSize;
                requestData.color = selectedColor;
                requestData.quantity = quantity;
            }

            if (event.type === "NORMAL" && event.customFields && event.customFields.length > 0) {
                const errors = {};
                for (const field of event.customFields) {
                    if (field.required && (!formResponses[field.label] || formResponses[field.label] === "")) {
                        errors[field.label] = `${field.label} is required`;
                    }
                }

                if (Object.keys(errors).length > 0) {
                    setFormErrors(errors);
                    return;
                }

                requestData.formResponses = formResponses;
            }

            const res = await api.post(`/registrations/${eventId}`, requestData);
            
            const successMsg = event.type === "MERCH" 
                ? `Purchase successful! Your Order ID: ${res.data.ticketId}\n${quantity} × ${selectedSize} ${selectedColor}`
                : `Registered successfully! Your Ticket ID: ${res.data.ticketId}`;
            
            setMessage(successMsg);
            setIsRegistered(true);
            setRegistrationCount(prev => prev + 1);
            setRegistrationId(res.data.registrationId);
            setShowPurchaseModal(false);
            setShowCustomFormModal(false);
            
            if (res.data.qrCode) {
                setQrCodeData(res.data.qrCode);
                setTicketId(res.data.ticketId);
                setShowQRModal(true);
            }

            setRegistrationId(res.data.ticketId);
        } catch (err) {
            setError(
                err.response?.data?.message || "Registration failed"
            );
        }
    };

    const getAvailableStock = () => {
        if (!event || event.type !== "MERCH" || !selectedSize || !selectedColor) {
            return 0;
        }

        const variant = event.merchVariants?.find(
            v => v.size === selectedSize && v.color === selectedColor
        );

        return variant ? variant.stock - variant.sold : 0;
    };

    const isDeadlinePassed = () => {
        if (!event?.registrationDeadline) return false;
        return new Date() > new Date(event.registrationDeadline);
    };

    const isEventFull = () => {
        if (!event?.registrationLimit) return false;
        return registrationCount >= event.registrationLimit;
    };

    const canRegister = () => {
        if (role !== "PARTICIPANT") return false;
        if (isRegistered) return false;
        if (isDeadlinePassed()) return false;
        if (isEventFull()) return false;
        return true;
    };

    const getRegistrationButtonText = () => {
        if (isRegistered) return "Already Registered";
        if (isDeadlinePassed()) return "Registration Closed";
        if (isEventFull()) return "Event Full";
        if (event?.type === "MERCH") return "Purchase";
        return "Register Now";
    };

    const handleFormFieldChange = (fieldLabel, value) => {
        setFormResponses(prev => ({
            ...prev,
            [fieldLabel]: value
        }));
        if (formErrors[fieldLabel]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldLabel];
                return newErrors;
            });
        }
    };

    const handleCheckboxChange = (fieldLabel, option, checked) => {
        setFormResponses(prev => {
            const currentValue = prev[fieldLabel] || [];
            const valueArray = Array.isArray(currentValue) ? currentValue : [];
            
            if (checked) {
                return {
                    ...prev,
                    [fieldLabel]: [...valueArray, option]
                };
            } else {
                return {
                    ...prev,
                    [fieldLabel]: valueArray.filter(v => v !== option)
                };
            }
        });
    };

    if (loading) {
        return <div className="container">Loading event...</div>;
    }

    if (!event) {
        return <div className="container">
            <p className="error">Event not found</p>
            <button className="btn" onClick={() => navigate("/events")}>Back to Events</button>
        </div>;
    }

    return (
        <div className="container">
            <h2>{event.name}</h2>
            
            {/* Event Type Badge */}
            <span style={{
                display: "inline-block",
                padding: "4px 12px",
                backgroundColor: event.type === "MERCH" ? "#10b981" : "#2563eb",
                color: "white",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold",
                marginBottom: "15px"
            }}>
                {event.type === "MERCH" ? "MERCHANDISE" : "NORMAL EVENT"}
            </span>

            <p style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "20px" }}>
                {event.description}
            </p>

            {}
            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
                gap: "15px",
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px"
            }}>
                <div>
                    <p style={{ margin: "5px 0" }}><b>Start Date:</b></p>
                    <p style={{ margin: "5px 0", color: "#666" }}>
                        {new Date(event.startDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>

                <div>
                    <p style={{ margin: "5px 0" }}><b>End Date:</b></p>
                    <p style={{ margin: "5px 0", color: "#666" }}>
                        {new Date(event.endDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>

                {event.registrationDeadline && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>Registration Deadline:</b></p>
                        <p style={{ margin: "5px 0", color: isDeadlinePassed() ? "#dc2626" : "#666" }}>
                            {new Date(event.registrationDeadline).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })}
                            {isDeadlinePassed() && " (Closed)"}
                        </p>
                    </div>
                )}

                {event.organizer && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>Organizer:</b></p>
                        <p style={{ margin: "5px 0", color: "#666" }}>{event.organizer.name}</p>
                    </div>
                )}

                {event.eligibility && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>Eligibility:</b></p>
                        <p style={{ margin: "5px 0", color: "#666" }}>{event.eligibility}</p>
                    </div>
                )}

                {event.registrationFee !== undefined && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>Fee:</b></p>
                        <p style={{ margin: "5px 0", color: "#666" }}>
                            {event.registrationFee === 0 ? "Free" : `₹${event.registrationFee}`}
                        </p>
                    </div>
                )}

                {event.registrationLimit && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>Seats:</b></p>
                        <p style={{ 
                            margin: "5px 0", 
                            color: isEventFull() ? "#dc2626" : "#666",
                            fontWeight: isEventFull() ? "bold" : "normal"
                        }}>
                            {registrationCount} / {event.registrationLimit}
                            {isEventFull() && " (Full)"}
                        </p>
                    </div>
                )}

                {event.tags && event.tags.length > 0 && (
                    <div style={{ gridColumn: "1 / -1" }}>
                        <p style={{ margin: "5px 0" }}><b>Tags:</b></p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                            {event.tags.map((tag, index) => (
                                <span key={index} style={{
                                    padding: "4px 10px",
                                    backgroundColor: "#e5e7eb",
                                    borderRadius: "12px",
                                    fontSize: "12px"
                                }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Merchandise Stock Information */}
            {event.type === "MERCH" && event.merchVariants && (
                <div style={{
                    padding: "20px",
                    backgroundColor: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #86efac",
                    marginBottom: "20px"
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#10b981" }}>
                        Available Merchandise
                    </h3>
                    
                    <p style={{ marginBottom: "10px" }}>
                        <b>Purchase Limit:</b> {event.purchaseLimit} item(s) per customer
                    </p>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ 
                            width: "100%", 
                            borderCollapse: "collapse",
                            backgroundColor: "white",
                            borderRadius: "6px",
                            overflow: "hidden"
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: "#d1fae5" }}>
                                    <th style={{ padding: "10px", textAlign: "left" }}>Size</th>
                                    <th style={{ padding: "10px", textAlign: "left" }}>Color</th>
                                    <th style={{ padding: "10px", textAlign: "left" }}>Available Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {event.merchVariants.map((variant, idx) => {
                                    const availableStock = variant.stock - variant.sold;
                                    return (
                                        <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                            <td style={{ padding: "10px" }}>{variant.size}</td>
                                            <td style={{ padding: "10px" }}>{variant.color}</td>
                                            <td style={{ 
                                                padding: "10px",
                                                color: availableStock === 0 ? "#dc2626" : "#10b981",
                                                fontWeight: "bold"
                                            }}>
                                                {availableStock === 0 ? "Out of Stock" : availableStock}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Purchase Modal */}
            {showPurchaseModal && event.type === "MERCH" && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "20px"
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "30px",
                        borderRadius: "12px",
                        maxWidth: "500px",
                        width: "100%",
                        maxHeight: "90vh",
                        overflowY: "auto"
                    }}>
                        <h3 style={{ marginTop: 0 }}>Complete Your Purchase</h3>

                        {error && <div style={{ 
                            padding: "12px", 
                            backgroundColor: "#fee2e2", 
                            border: "1px solid #dc2626",
                            borderRadius: "6px",
                            marginBottom: "15px",
                            color: "#991b1b"
                        }}>
                            {error}
                        </div>}

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                                Select Size:
                            </label>
                            <select
                                className="input"
                                value={selectedSize}
                                onChange={(e) => {
                                    setSelectedSize(e.target.value);
                                    setError("");
                                }}
                                style={{ width: "100%" }}
                            >
                                <option value="">-- Choose Size --</option>
                                {event.availableSizes?.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                                Select Color:
                            </label>
                            <select
                                className="input"
                                value={selectedColor}
                                onChange={(e) => {
                                    setSelectedColor(e.target.value);
                                    setError("");
                                }}
                                style={{ width: "100%" }}
                            >
                                <option value="">-- Choose Color --</option>
                                {event.availableColors?.map(color => (
                                    <option key={color} value={color}>{color}</option>
                                ))}
                            </select>
                        </div>

                        {selectedSize && selectedColor && (
                            <div style={{
                                padding: "12px",
                                backgroundColor: "#f0fdf4",
                                borderRadius: "6px",
                                marginBottom: "20px"
                            }}>
                                <p style={{ margin: "5px 0" }}>
                                    <b>Available Stock:</b> {getAvailableStock()} items
                                </p>
                            </div>
                        )}

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                                Quantity:
                            </label>
                            <input
                                className="input"
                                type="number"
                                min="1"
                                max={Math.min(event.purchaseLimit, getAvailableStock())}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                style={{ width: "100%" }}
                            />
                            <small style={{ color: "#666" }}>
                                Maximum: {Math.min(event.purchaseLimit, getAvailableStock())} items
                            </small>
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                            <button
                                className="btn"
                                onClick={handleRegister}
                                disabled={!selectedSize || !selectedColor || getAvailableStock() === 0}
                                style={{
                                    flex: 1,
                                    opacity: (!selectedSize || !selectedColor || getAvailableStock() === 0) ? 0.5 : 1,
                                    cursor: (!selectedSize || !selectedColor || getAvailableStock() === 0) ? "not-allowed" : "pointer"
                                }}
                            >
                                Confirm Purchase
                            </button>
                            <button
                                className="btn"
                                onClick={() => {
                                    setShowPurchaseModal(false);
                                    setError("");
                                }}
                                style={{ flex: 1, backgroundColor: "#6b7280" }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {showCustomFormModal && event.type === "NORMAL" && event.customFields && event.customFields.length > 0 && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "20px"
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "30px",
                        borderRadius: "12px",
                        maxWidth: "600px",
                        width: "100%",
                        maxHeight: "90vh",
                        overflowY: "auto"
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: "10px" }}>Complete Registration Form</h3>
                        <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
                            Please fill out the following information to complete your registration
                        </p>

                        {Object.keys(formErrors).length > 0 && (
                            <div style={{ 
                                padding: "12px", 
                                backgroundColor: "#fee2e2", 
                                border: "1px solid #dc2626",
                                borderRadius: "6px",
                                marginBottom: "15px",
                                color: "#991b1b"
                            }}>
                                Please fill out all required fields
                            </div>
                        )}

                        {event.customFields
                            .sort((a, b) => a.order - b.order)
                            .map((field, index) => (
                            <div key={index} style={{ marginBottom: "20px" }}>
                                <label style={{ 
                                    display: "block", 
                                    marginBottom: "8px", 
                                    fontWeight: "bold",
                                    color: "#1f2937"
                                }}>
                                    {field.label}
                                    {field.required && <span style={{ color: "#dc2626" }}> *</span>}
                                </label>

                                {field.type === "text" && (
                                    <input
                                        className="input"
                                        type="text"
                                        value={formResponses[field.label] || ""}
                                        onChange={(e) => handleFormFieldChange(field.label, e.target.value)}
                                        style={{ 
                                            width: "100%",
                                            borderColor: formErrors[field.label] ? "#dc2626" : undefined
                                        }}
                                    />
                                )}

                                {field.type === "dropdown" && (
                                    <select
                                        className="input"
                                        value={formResponses[field.label] || ""}
                                        onChange={(e) => handleFormFieldChange(field.label, e.target.value)}
                                        style={{ 
                                            width: "100%",
                                            borderColor: formErrors[field.label] ? "#dc2626" : undefined
                                        }}
                                    >
                                        <option value="">-- Select an option --</option>
                                        {field.options.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                )}

                                {field.type === "checkbox" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {field.options.map(option => (
                                            <label key={option} style={{ 
                                                display: "flex", 
                                                alignItems: "center", 
                                                gap: "8px",
                                                fontWeight: "normal"
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        Array.isArray(formResponses[field.label]) && 
                                                        formResponses[field.label].includes(option)
                                                    }
                                                    onChange={(e) => handleCheckboxChange(field.label, option, e.target.checked)}
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {field.type === "file" && (
                                    <div>
                                        <input
                                            className="input"
                                            type="file"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    handleFormFieldChange(field.label, file.name);
                                                }
                                            }}
                                            style={{ width: "100%" }}
                                        />
                                        <small style={{ color: "#666", fontSize: "12px" }}>
                                            Note: File upload functionality is limited in demo mode
                                        </small>
                                    </div>
                                )}

                                {formErrors[field.label] && (
                                    <div style={{ 
                                        color: "#dc2626", 
                                        fontSize: "12px", 
                                        marginTop: "4px" 
                                    }}>
                                        {formErrors[field.label]}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                            <button
                                className="btn"
                                onClick={handleRegister}
                                style={{ flex: 1 }}
                            >
                                Complete Registration
                            </button>
                            <button
                                className="btn"
                                onClick={() => {
                                    setShowCustomFormModal(false);
                                    setFormErrors({});
                                    setError("");
                                }}
                                style={{ flex: 1, backgroundColor: "#6b7280" }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {showQRModal && qrCodeData && (
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
                            {event?.type === "MERCH" ? "Purchase Confirmed!" : "Registration Successful!"}
                        </h2>
                        
                        <p style={{
                            color: "#6b7280",
                            marginBottom: "20px",
                            fontSize: "14px"
                        }}>
                            A confirmation email with your {event?.type === "MERCH" ? "order" : "ticket"} details has been sent
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
                                {event?.type === "MERCH" ? "Order ID" : "Ticket ID"}
                            </p>
                            <p style={{
                                fontSize: "20px",
                                fontWeight: "bold",
                                color: "#4f46e5",
                                letterSpacing: "2px"
                            }}>
                                {ticketId}
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
                                {event?.type === "MERCH" 
                                    ? "Show this QR code to collect your merchandise"
                                    : "Show this QR code at the event entrance"}
                            </p>
                        </div>

                        <div style={{
                            backgroundColor: "#fffbeb",
                            border: "1px solid #fbbf24",
                            padding: "15px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                            textAlign: "left"
                        }}>
                            <p style={{
                                fontSize: "12px",
                                color: "#92400e",
                                margin: 0
                            }}>
                                <strong> Important:</strong>
                            </p>
                            <ul style={{
                                fontSize: "12px",
                                color: "#92400e",
                                margin: "10px 0 0 0",
                                paddingLeft: "20px"
                            }}>
                                <li>Save this QR code or take a screenshot</li>
                                <li>Check your email for the full ticket details</li>
                                <li>Present this on your phone or printed copy</li>
                            </ul>
                        </div>

                        <div style={{
                            display: "flex",
                            gap: "10px"
                        }}>
                            <button
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.download = `ticket-${ticketId}.png`;
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
                                onClick={() => setShowQRModal(false)}
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

            {/* Messages */}
            {message && <div style={{ 
                padding: "12px", 
                backgroundColor: "#d1fae5", 
                border: "1px solid #10b981",
                borderRadius: "6px",
                marginBottom: "15px",
                color: "#065f46"
            }}>
                {message}
            </div>}
            
            {error && <div style={{ 
                padding: "12px", 
                backgroundColor: "#fee2e2", 
                border: "1px solid #dc2626",
                borderRadius: "6px",
                marginBottom: "15px",
                color: "#991b1b"
            }}>
                {error}
            </div>}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
                {role === "PARTICIPANT" && !isRegistered && (
                    <button 
                        className="btn" 
                        onClick={handleRegister}
                        disabled={!canRegister()}
                        style={{
                            flex: "1 1 auto",
                            opacity: canRegister() ? 1 : 0.5,
                            cursor: canRegister() ? "pointer" : "not-allowed"
                        }}
                    >
                        {getRegistrationButtonText()}
                    </button>
                )}

                {role === "PARTICIPANT" && isRegistered && registrationId && new Date(event.startDate) >= new Date() && (
                    <>
                        <button 
                            className="btn" 
                            disabled
                            style={{
                                flex: "1 1 auto",
                                opacity: 0.7,
                                cursor: "not-allowed",
                                backgroundColor: "#6b7280"
                            }}
                        >
                            ✓ Already Registered
                        </button>
                        <button 
                            className="btn" 
                            onClick={() => setShowCalendarExport(true)}
                            style={{
                                flex: "1 1 auto",
                                backgroundColor: "#28a745"
                            }}
                        >
                             Add to Calendar
                        </button>
                    </>
                )}

                {role === "PARTICIPANT" && isRegistered && (!registrationId || new Date(event.startDate) < new Date()) && (
                    <button 
                        className="btn" 
                        disabled
                        style={{
                            flex: "1 1 auto",
                            opacity: 0.7,
                            cursor: "not-allowed",
                            backgroundColor: "#6b7280"
                        }}
                    >
                    Already Registered
                    </button>
                )}

                <button
                    className="btn"
                    style={{ 
                        backgroundColor: "#6b7280",
                        flex: "0 1 auto"
                    }}
                    onClick={() => navigate(-1)}
                >
                     Back
                </button>
            </div>

            {}
            {showCalendarExport && registrationId && event && (
                <CalendarExport 
                    registrationId={registrationId}
                    eventName={event.name}
                    onClose={() => setShowCalendarExport(false)} 
                />
            )}
        </div>
    );
}