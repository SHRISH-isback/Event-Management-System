import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import CalendarExport from "../components/CalendarExport";
import DiscussionForum from "../components/DiscussionForum";
import PaymentProofUpload from "../components/PaymentProofUpload";
import "../App.css";

export default function EventDetails() {
    const { eventId } = useParams();
    const navigate = useNavigate();

    // Core event and registration state
    const [event, setEvent] = useState(null);
    const [registrationCount, setRegistrationCount] = useState(0);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationId, setRegistrationId] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [ticketId, setTicketId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const role = localStorage.getItem("role");

    // Merchandise order state
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [paymentProofFile, setPaymentProofFile] = useState(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState(null);
    const [paymentProofError, setPaymentProofError] = useState("");
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showMerchOrderConfirm, setShowMerchOrderConfirm] = useState(false);
    const [merchOrderDetails, setMerchOrderDetails] = useState(null);

    // Custom registration form state
    const [showCustomFormModal, setShowCustomFormModal] = useState(false);
    const [formResponses, setFormResponses] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [showCalendarExport, setShowCalendarExport] = useState(false);

    // Payment proof upload modal state (for paid normal events)
    const [showPaymentUploadModal, setShowPaymentUploadModal] = useState(false);

    // Fetch event details and check participant registration status on mount
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
                        setPaymentStatus(regRes.data.paymentStatus);
                    } catch (err) {}
                }

                try {
                    const countRes = await api.get(`/registrations/count/${eventId}`);
                    setRegistrationCount(countRes.data.count);
                } catch (err) {}
            } catch {
                setError("Failed to load event details");
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId, role]);

    // Handle normal event registration; opens custom form modal if custom fields exist
    const handleRegister = async () => {
        setError("");
        setMessage("");

        if (event.customFields && event.customFields.length > 0 && !showCustomFormModal) {
            setShowCustomFormModal(true);
            return;
        }

        try {
            const requestData = {};
            if (event.customFields && event.customFields.length > 0) {
                // Validate required custom fields before submitting
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
            setIsRegistered(true);
            setRegistrationCount(prev => prev + 1);
            setRegistrationId(res.data.registrationId);
            setPaymentStatus(res.data.paymentStatus || null);
            setTicketId(res.data.ticketId);
            setShowCustomFormModal(false);

            // Paid normal event — requires payment proof upload
            if (res.data.requiresPaymentProof) {
                setShowPaymentUploadModal(true);
                return;
            }

            // Show QR code modal on successful free registration
            if (res.data.qrCode) {
                setQrCodeData(res.data.qrCode);
                setShowQRModal(true);
            } else {
                setMessage(`Registered successfully! Your Ticket ID: ${res.data.ticketId}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        }
    };

    // Handle merchandise order submission with payment proof upload
    const handleMerchSubmit = async () => {
        setError("");
        setPaymentProofError("");

        if (!selectedSize || !selectedColor) {
            setError("Please select both size and color");
            return;
        }
        if (!paymentProofFile) {
            setPaymentProofError("Please upload your payment proof");
            return;
        }

        try {
            const orderRes = await api.post(`/registrations/${eventId}`, {
                size: selectedSize,
                color: selectedColor,
                quantity,
            });

            const newRegistrationId = orderRes.data.registrationId;

            try {
                await api.post(`/registrations/payment-proof/${newRegistrationId}`, {
                    paymentProof: paymentProofFile,
                });
            } catch (proofErr) {
                // Order was created but proof upload failed — direct user to My Events to re-upload
                setIsRegistered(true);
                setRegistrationCount(prev => prev + 1);
                setRegistrationId(newRegistrationId);
                setPaymentStatus("PENDING");
                setShowPurchaseModal(false);
                setError(
                    "Order was placed but payment proof upload failed (image may be too large). " +
                    "Please go to My Events and upload your payment proof there."
                );
                return;
            }

            setIsRegistered(true);
            setRegistrationCount(prev => prev + 1);
            setRegistrationId(newRegistrationId);
            setPaymentStatus("PENDING");
            setShowPurchaseModal(false);
            setMerchOrderDetails({
                ticketId: orderRes.data.ticketId,
                size: selectedSize,
                color: selectedColor,
                quantity,
            });
            setShowMerchOrderConfirm(true);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to place order");
        }
    };

    // Reset all purchase modal state on cancel
    const resetPurchaseModal = () => {
        setShowPurchaseModal(false);
        setSelectedSize("");
        setSelectedColor("");
        setQuantity(1);
        setPaymentProofFile(null);
        setPaymentProofPreview(null);
        setPaymentProofError("");
        setError("");
    };

    // Calculate available stock for the currently selected size/color variant
    const getAvailableStock = () => {
        if (!event || event.type !== "MERCH" || !selectedSize || !selectedColor) return 0;
        const variant = event.merchVariants?.find(v => v.size === selectedSize && v.color === selectedColor);
        return variant ? variant.stock - variant.sold : 0;
    };

    // Validate and read payment proof image as base64
    const handlePaymentProofChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setPaymentProofError("Please upload an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setPaymentProofError("File size must be less than 5MB");
            return;
        }
        setPaymentProofError("");
        const reader = new FileReader();
        reader.onloadend = () => {
            setPaymentProofFile(reader.result);
            setPaymentProofPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Update a single custom form field response and clear its error
    const handleFormFieldChange = (fieldLabel, value) => {
        setFormResponses(prev => ({ ...prev, [fieldLabel]: value }));
        if (formErrors[fieldLabel]) {
            setFormErrors(prev => { const e = { ...prev }; delete e[fieldLabel]; return e; });
        }
    };

    // Toggle a checkbox option in a multi-select custom form field
    const handleCheckboxChange = (fieldLabel, option, checked) => {
        setFormResponses(prev => {
            const current = Array.isArray(prev[fieldLabel]) ? prev[fieldLabel] : [];
            return {
                ...prev,
                [fieldLabel]: checked ? [...current, option] : current.filter(v => v !== option),
            };
        });
    };

    // Registration eligibility helpers
    const isDeadlinePassed = () => !event?.registrationDeadline ? false : new Date() > new Date(event.registrationDeadline);
    const isEventFull = () => !event?.registrationLimit ? false : registrationCount >= event.registrationLimit;
    const canOrder = () => role === "PARTICIPANT" && !isRegistered && !isDeadlinePassed() && !isEventFull();
    const canRegisterNormal = () => role === "PARTICIPANT" && !isRegistered && !isDeadlinePassed() && !isEventFull();

    if (loading) return <div className="container">Loading event...</div>;
    if (!event) return (
        <div className="container">
            <p className="error">Event not found</p>
            <button className="btn" onClick={() => navigate("/events")}>Back to Events</button>
        </div>
    );

    return (
        <div className="container">
            <h2>{event.name}</h2>

            {/* Event type badge */}
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

            <p style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "20px" }}>{event.description}</p>

            {/* Event metadata grid */}
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
                        {new Date(event.startDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                    </p>
                </div>
                <div>
                    <p style={{ margin: "5px 0" }}><b>End Date:</b></p>
                    <p style={{ margin: "5px 0", color: "#666" }}>
                        {new Date(event.endDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                    </p>
                </div>
                {event.registrationDeadline && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>Order Deadline:</b></p>
                        <p style={{ margin: "5px 0", color: isDeadlinePassed() ? "#dc2626" : "#666" }}>
                            {new Date(event.registrationDeadline).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
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
                {event.registrationFee !== undefined && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>{event.type === "MERCH" ? "Price per item:" : "Fee:"}</b></p>
                        <p style={{ margin: "5px 0", color: "#666" }}>
                            {event.registrationFee === 0 ? "Free" : `\u20b9${event.registrationFee}`}
                        </p>
                    </div>
                )}
                {event.type === "MERCH" && event.purchaseLimit && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>Purchase Limit:</b></p>
                        <p style={{ margin: "5px 0", color: "#666" }}>{event.purchaseLimit} item(s) per person</p>
                    </div>
                )}
                {event.registrationLimit && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>{event.type === "MERCH" ? "Orders:" : "Seats:"}</b></p>
                        <p style={{ margin: "5px 0", color: isEventFull() ? "#dc2626" : "#666", fontWeight: isEventFull() ? "bold" : "normal" }}>
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
                                <span key={index} style={{ padding: "4px 10px", backgroundColor: "#e5e7eb", borderRadius: "12px", fontSize: "12px" }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Merchandise stock table */}
            {event.type === "MERCH" && event.merchVariants && (
                <div style={{
                    padding: "20px",
                    backgroundColor: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #86efac",
                    marginBottom: "20px"
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#10b981" }}>Available Stock</h3>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "6px", overflow: "hidden" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#d1fae5" }}>
                                    <th style={{ padding: "10px", textAlign: "left" }}>Size</th>
                                    <th style={{ padding: "10px", textAlign: "left" }}>Color</th>
                                    <th style={{ padding: "10px", textAlign: "left" }}>Available</th>
                                </tr>
                            </thead>
                            <tbody>
                                {event.merchVariants.map((variant, idx) => {
                                    const available = variant.stock - variant.sold;
                                    return (
                                        <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                            <td style={{ padding: "10px" }}>{variant.size}</td>
                                            <td style={{ padding: "10px" }}>{variant.color}</td>
                                            <td style={{ padding: "10px", color: available === 0 ? "#dc2626" : "#10b981", fontWeight: "bold" }}>
                                                {available === 0 ? "Out of Stock" : available}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Merchandise purchase modal */}
            {showPurchaseModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 1000, padding: "20px"
                }}>
                    <div style={{
                        backgroundColor: "white", padding: "30px", borderRadius: "12px",
                        maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto"
                    }}>
                        <h3 style={{ marginTop: 0 }}>Place Merchandise Order</h3>
                        <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
                            Select your preferences and upload your payment proof. Your order will be confirmed after the organizer approves your payment.
                        </p>

                        {error && (
                            <div style={{ padding: "12px", backgroundColor: "#fee2e2", border: "1px solid #dc2626", borderRadius: "6px", marginBottom: "15px", color: "#991b1b" }}>
                                {error}
                            </div>
                        )}

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Size:</label>
                            <select className="input" value={selectedSize} onChange={e => { setSelectedSize(e.target.value); setError(""); }} style={{ width: "100%" }}>
                                <option value="">-- Choose Size --</option>
                                {event.availableSizes?.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Color:</label>
                            <select className="input" value={selectedColor} onChange={e => { setSelectedColor(e.target.value); setError(""); }} style={{ width: "100%" }}>
                                <option value="">-- Choose Color --</option>
                                {event.availableColors?.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Show real-time stock availability for the selected variant */}
                        {selectedSize && selectedColor && (
                            <div style={{
                                padding: "10px 14px",
                                backgroundColor: getAvailableStock() === 0 ? "#fee2e2" : "#f0fdf4",
                                borderRadius: "6px", marginBottom: "16px"
                            }}>
                                <p style={{ margin: 0, color: getAvailableStock() === 0 ? "#991b1b" : "#065f46" }}>
                                    <b>Available Stock:</b> {getAvailableStock() === 0 ? "Out of Stock" : `${getAvailableStock()} items`}
                                </p>
                            </div>
                        )}

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Quantity:</label>
                            <input
                                className="input"
                                type="number"
                                min="1"
                                max={Math.min(event.purchaseLimit || 10, getAvailableStock())}
                                value={quantity}
                                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                                style={{ width: "100%" }}
                            />
                            <small style={{ color: "#666" }}>Maximum: {Math.min(event.purchaseLimit || 10, getAvailableStock())} items</small>
                        </div>

                        {event.registrationFee > 0 && (
                            <div style={{ padding: "12px 14px", backgroundColor: "#eff6ff", borderRadius: "6px", marginBottom: "16px" }}>
                                <p style={{ margin: 0, color: "#1e40af" }}>
                                    <b>Total:</b> {`\u20b9${event.registrationFee * quantity}`}
                                </p>
                                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#3b82f6" }}>
                                    Please complete this payment and upload the proof below.
                                </p>
                            </div>
                        )}

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                                Payment Proof: <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <input type="file" accept="image/*" onChange={handlePaymentProofChange} style={{ width: "100%" }} />
                            {paymentProofError && (
                                <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "6px" }}>{paymentProofError}</p>
                            )}
                            {paymentProofPreview && (
                                <img src={paymentProofPreview} alt="Payment proof preview" style={{ marginTop: "10px", maxWidth: "100%", maxHeight: "180px", borderRadius: "6px", border: "1px solid #e5e7eb" }} />
                            )}
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                            <button
                                className="btn"
                                onClick={handleMerchSubmit}
                                disabled={!selectedSize || !selectedColor || getAvailableStock() === 0}
                                style={{
                                    flex: 1,
                                    opacity: (!selectedSize || !selectedColor || getAvailableStock() === 0) ? 0.5 : 1,
                                    cursor: (!selectedSize || !selectedColor || getAvailableStock() === 0) ? "not-allowed" : "pointer"
                                }}
                            >
                                Submit Order
                            </button>
                            <button className="btn" onClick={resetPurchaseModal} style={{ flex: 1, backgroundColor: "#6b7280" }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom registration form modal */}
            {showCustomFormModal && event.customFields && event.customFields.length > 0 && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 1000, padding: "20px"
                }}>
                    <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
                        <h3 style={{ marginTop: 0, marginBottom: "10px" }}>Complete Registration Form</h3>
                        <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>Please fill out the following information to complete your registration</p>

                        {Object.keys(formErrors).length > 0 && (
                            <div style={{ padding: "12px", backgroundColor: "#fee2e2", border: "1px solid #dc2626", borderRadius: "6px", marginBottom: "15px", color: "#991b1b" }}>
                                Please fill out all required fields
                            </div>
                        )}

                        {/* Render each custom field in order */}
                        {event.customFields.sort((a, b) => a.order - b.order).map((field, index) => (
                            <div key={index} style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#1f2937" }}>
                                    {field.label}
                                    {field.required && <span style={{ color: "#dc2626" }}> *</span>}
                                </label>
                                {field.type === "text" && (
                                    <input className="input" type="text" value={formResponses[field.label] || ""} onChange={e => handleFormFieldChange(field.label, e.target.value)} style={{ width: "100%", borderColor: formErrors[field.label] ? "#dc2626" : undefined }} />
                                )}
                                {field.type === "dropdown" && (
                                    <select className="input" value={formResponses[field.label] || ""} onChange={e => handleFormFieldChange(field.label, e.target.value)} style={{ width: "100%", borderColor: formErrors[field.label] ? "#dc2626" : undefined }}>
                                        <option value="">-- Select an option --</option>
                                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                )}
                                {field.type === "checkbox" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {field.options.map(opt => (
                                            <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "normal" }}>
                                                <input type="checkbox" checked={Array.isArray(formResponses[field.label]) && formResponses[field.label].includes(opt)} onChange={e => handleCheckboxChange(field.label, opt, e.target.checked)} />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {formErrors[field.label] && <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{formErrors[field.label]}</div>}
                            </div>
                        ))}

                        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                            <button className="btn" onClick={handleRegister} style={{ flex: 1 }}>Complete Registration</button>
                            <button className="btn" onClick={() => { setShowCustomFormModal(false); setFormErrors({}); setError(""); }} style={{ flex: 1, backgroundColor: "#6b7280" }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Merchandise order confirmation modal */}
            {showMerchOrderConfirm && merchOrderDetails && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    display: "flex", justifyContent: "center", alignItems: "center",
                    zIndex: 1000, padding: "20px"
                }}>
                    <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "12px", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                        <h2 style={{ fontSize: "22px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" }}>Order Submitted!</h2>
                        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
                            Your order is now pending organizer approval. You will receive a confirmation email with your QR code once approved.
                        </p>

                        <div style={{ backgroundColor: "#f3f4f6", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
                            <p style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Order ID</p>
                            <p style={{ fontSize: "20px", fontWeight: "bold", color: "#4f46e5", letterSpacing: "2px", margin: 0 }}>{merchOrderDetails.ticketId}</p>
                        </div>

                        <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", padding: "14px", borderRadius: "8px", marginBottom: "16px", textAlign: "left" }}>
                            <p style={{ fontWeight: "bold", color: "#15803d", marginBottom: "8px", fontSize: "14px" }}>Order Details</p>
                            <p style={{ margin: "4px 0", fontSize: "14px" }}><b>Size:</b> {merchOrderDetails.size}</p>
                            <p style={{ margin: "4px 0", fontSize: "14px" }}><b>Color:</b> {merchOrderDetails.color}</p>
                            <p style={{ margin: "4px 0", fontSize: "14px" }}><b>Quantity:</b> {merchOrderDetails.quantity}</p>
                            {event?.registrationFee > 0 && (
                                <p style={{ margin: "4px 0", fontSize: "14px", fontWeight: "bold" }}>
                                    <b>Total:</b> {`\u20b9${event.registrationFee * merchOrderDetails.quantity}`}
                                </p>
                            )}
                        </div>

                        <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fbbf24", padding: "14px", borderRadius: "8px", marginBottom: "20px", textAlign: "left" }}>
                            <p style={{ fontWeight: "bold", color: "#92400e", marginBottom: "6px", fontSize: "14px" }}>What happens next?</p>
                            <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#92400e", lineHeight: "1.8" }}>
                                <li>The organizer will review your payment proof</li>
                                <li>Once approved, your order is confirmed</li>
                                <li>A confirmation email with your QR code will be sent</li>
                            </ol>
                        </div>

                        <button
                            onClick={() => { setShowMerchOrderConfirm(false); setMerchOrderDetails(null); }}
                            style={{ width: "100%", padding: "12px", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* QR code modal shown after successful free event registration */}
            {showQRModal && qrCodeData && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    display: "flex", justifyContent: "center", alignItems: "center",
                    zIndex: 1000, padding: "20px"
                }}>
                    <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "12px", maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px", color: "#1f2937" }}>Registration Successful!</h2>
                        <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "14px" }}>
                            A confirmation email with your ticket and QR code has been sent
                        </p>
                        <div style={{ backgroundColor: "#f3f4f6", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
                            <p style={{ color: "#6b7280", fontSize: "12px", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>Ticket ID</p>
                            <p style={{ fontSize: "20px", fontWeight: "bold", color: "#4f46e5", letterSpacing: "2px" }}>{ticketId}</p>
                        </div>
                        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", border: "2px solid #e5e7eb", marginBottom: "20px" }}>
                            <img src={qrCodeData} alt="QR Code" style={{ width: "250px", height: "250px", margin: "0 auto", display: "block" }} />
                            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "15px" }}>Show this QR code at the event entrance</p>
                        </div>
                        <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fbbf24", padding: "15px", borderRadius: "8px", marginBottom: "20px", textAlign: "left" }}>
                            <p style={{ fontSize: "12px", color: "#92400e", margin: 0 }}><strong>Important:</strong></p>
                            <ul style={{ fontSize: "12px", color: "#92400e", margin: "10px 0 0 0", paddingLeft: "20px" }}>
                                <li>Save this QR code or take a screenshot</li>
                                <li>Check your email for the full ticket details</li>
                                <li>Present this on your phone or printed copy</li>
                            </ul>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={() => { const link = document.createElement("a"); link.download = `ticket-${ticketId}.png`; link.href = qrCodeData; link.click(); }}
                                style={{ flex: 1, padding: "12px", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                                Download QR Code
                            </button>
                            <button onClick={() => setShowQRModal(false)}
                                style={{ flex: 1, padding: "12px", backgroundColor: "#f3f4f6", color: "#1f2937", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment status banner for paid normal events */}
            {role === "PARTICIPANT" && event.type === "NORMAL" && isRegistered && paymentStatus && paymentStatus !== "NOT_REQUIRED" && (
                <div style={{
                    padding: "14px 16px",
                    backgroundColor: paymentStatus === "APPROVED" ? "#d1fae5" : paymentStatus === "REJECTED" ? "#fee2e2" : "#fef3c7",
                    border: `1px solid ${paymentStatus === "APPROVED" ? "#6ee7b7" : paymentStatus === "REJECTED" ? "#fca5a5" : "#fcd34d"}`,
                    borderRadius: "8px",
                    marginBottom: "15px",
                }}>
                    <p style={{ margin: 0, fontWeight: "bold", color: paymentStatus === "APPROVED" ? "#065f46" : paymentStatus === "REJECTED" ? "#991b1b" : "#92400e" }}>
                        Payment Status: {paymentStatus === "PENDING" ? "PENDING APPROVAL" : paymentStatus}
                    </p>
                    {paymentStatus === "PENDING" && (
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#92400e" }}>
                            Your payment proof is under review. Your ticket will be issued once approved.
                        </p>
                    )}
                    {paymentStatus === "REJECTED" && (
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#991b1b" }}>
                            Payment was rejected. Please re-upload a valid payment proof.
                        </p>
                    )}
                    {paymentStatus === "APPROVED" && (
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#065f46" }}>
                            Payment approved! Your ticket is confirmed. Check My Events for your QR code.
                        </p>
                    )}
                </div>
            )}

            {/* Success / error feedback */}
            {message && (
                <div style={{ padding: "12px", backgroundColor: "#d1fae5", border: "1px solid #10b981", borderRadius: "6px", marginBottom: "15px", color: "#065f46" }}>
                    {message}
                </div>
            )}
            {error && (
                <div style={{ padding: "12px", backgroundColor: "#fee2e2", border: "1px solid #dc2626", borderRadius: "6px", marginBottom: "15px", color: "#991b1b" }}>
                    {error}
                </div>
            )}

            {/* Action buttons — context-sensitive based on event type, role, and registration state */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
                {role === "PARTICIPANT" && event.type === "MERCH" && !isRegistered && canOrder() && (
                    <button className="btn" onClick={() => setShowPurchaseModal(true)} style={{ flex: "1 1 auto", backgroundColor: "#10b981" }}>
                        Order Now
                    </button>
                )}
                {role === "PARTICIPANT" && event.type === "MERCH" && !isRegistered && isDeadlinePassed() && (
                    <button className="btn" disabled style={{ flex: "1 1 auto", opacity: 0.5, cursor: "not-allowed" }}>
                        Orders Closed
                    </button>
                )}
                {role === "PARTICIPANT" && event.type === "MERCH" && isRegistered && paymentStatus === "APPROVED" && (
                    <button className="btn" disabled style={{ flex: "1 1 auto", opacity: 0.7, cursor: "not-allowed", backgroundColor: "#28a745" }}>
                        Order Confirmed
                    </button>
                )}
                {role === "PARTICIPANT" && event.type === "MERCH" && isRegistered && paymentStatus === "PENDING" && (
                    <button className="btn" disabled style={{ flex: "1 1 auto", opacity: 0.7, cursor: "not-allowed", backgroundColor: "#f59e0b" }}>
                        Awaiting Payment Approval
                    </button>
                )}
                {role === "PARTICIPANT" && event.type === "MERCH" && isRegistered && paymentStatus === "REJECTED" && (
                    <button className="btn" onClick={() => navigate("/my-events")} style={{ flex: "1 1 auto", backgroundColor: "#dc2626" }}>
                        Payment Rejected — Re-upload in My Events
                    </button>
                )}

                {role === "PARTICIPANT" && event.type === "NORMAL" && !isRegistered && (
                    <button
                        className="btn"
                        onClick={handleRegister}
                        disabled={!canRegisterNormal()}
                        style={{ flex: "1 1 auto", opacity: canRegisterNormal() ? 1 : 0.5, cursor: canRegisterNormal() ? "pointer" : "not-allowed" }}
                    >
                        {isDeadlinePassed() ? "Registration Closed" : isEventFull() ? "Event Full" : "Register Now"}
                    </button>
                )}
                {role === "PARTICIPANT" && event.type === "NORMAL" && isRegistered && paymentStatus === "PENDING" && (
                    <>
                        <button className="btn" disabled style={{ flex: "1 1 auto", opacity: 0.7, cursor: "not-allowed", backgroundColor: "#f59e0b" }}>
                            Awaiting Payment Approval
                        </button>
                        {!paymentStatus || true ? (
                            <button
                                className="btn"
                                onClick={() => setShowPaymentUploadModal(true)}
                                style={{ flex: "1 1 auto", backgroundColor: "#2563eb" }}
                            >
                                Upload Payment Proof
                            </button>
                        ) : null}
                    </>
                )}
                {role === "PARTICIPANT" && event.type === "NORMAL" && isRegistered && paymentStatus === "REJECTED" && (
                    <>
                        <button className="btn" disabled style={{ flex: "1 1 auto", opacity: 0.7, cursor: "not-allowed", backgroundColor: "#dc2626" }}>
                            Payment Rejected
                        </button>
                        <button
                            className="btn"
                            onClick={() => setShowPaymentUploadModal(true)}
                            style={{ flex: "1 1 auto", backgroundColor: "#dc2626" }}
                        >
                            Re-upload Payment Proof
                        </button>
                    </>
                )}
                {role === "PARTICIPANT" && event.type === "NORMAL" && isRegistered && (!paymentStatus || paymentStatus === "NOT_REQUIRED" || paymentStatus === "APPROVED") && (
                    <>
                        <button className="btn" disabled style={{ flex: "1 1 auto", opacity: 0.7, cursor: "not-allowed", backgroundColor: "#6b7280" }}>
                            {paymentStatus === "APPROVED" ? "Registration Confirmed" : "Already Registered"}
                        </button>
                        {/* Only show calendar export for upcoming events */}
                        {new Date(event.startDate) >= new Date() && (
                            <button className="btn" onClick={() => setShowCalendarExport(true)} style={{ flex: "1 1 auto", backgroundColor: "#28a745" }}>
                                Add to Calendar
                            </button>
                        )}
                    </>
                )}

                {role === "ORGANIZER" && (
                    <button className="btn" style={{ backgroundColor: "#3b82f6", marginTop: 12 }}
                        onClick={() => navigate(`/organizer/event/${event._id}/registrations`)}>
                        View Analytics & Participants
                    </button>
                )}

                <button className="btn" style={{ backgroundColor: "#6b7280", flex: "0 1 auto" }} onClick={() => navigate(-1)}>
                    Back
                </button>
            </div>

            {/* Calendar export modal for registered participants */}
            {showCalendarExport && registrationId && event && (
                <CalendarExport registrationId={registrationId} eventName={event.name} onClose={() => setShowCalendarExport(false)} />
            )}

            {/* Payment proof upload modal for paid normal events */}
            {showPaymentUploadModal && registrationId && event && (
                <PaymentProofUpload
                    registration={{
                        _id: registrationId,
                        event: { name: event.name, registrationFee: event.registrationFee, type: event.type },
                        paymentStatus,
                        paymentRejectionReason: undefined,
                    }}
                    onClose={() => setShowPaymentUploadModal(false)}
                    onSuccess={() => {
                        setPaymentStatus("PENDING");
                        setShowPaymentUploadModal(false);
                        setMessage("Payment proof uploaded! Awaiting organizer approval.");
                    }}
                />
            )}

            {/* Discussion forum — visible to registered participants and organizers */}
            {(role === "PARTICIPANT" && isRegistered) || role === "ORGANIZER" ? (
                <>
                    {event.type === "MERCH" && role === "PARTICIPANT" && paymentStatus && paymentStatus !== "APPROVED" && (
                        <div style={{
                            padding: "10px 14px",
                            backgroundColor: paymentStatus === "REJECTED" ? "#fee2e2" : "#fef9c3",
                            border: `1px solid ${paymentStatus === "REJECTED" ? "#fca5a5" : "#fde68a"}`,
                            borderRadius: "8px",
                            marginBottom: "10px",
                            fontSize: "13px",
                            color: paymentStatus === "REJECTED" ? "#991b1b" : "#92400e",
                        }}>
                            {paymentStatus === "REJECTED"
                                ? "Your order payment was rejected. You can still participate in the discussion."
                                : "Your order is pending approval. You can still participate in the discussion."}
                        </div>
                    )}
                    <DiscussionForum eventId={eventId} />
                </>
            ) : null}
        </div>
    );
}