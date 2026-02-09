import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function CreateEvent() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        description: "",
        type: "NORMAL",
        startDate: "",
        endDate: "",
        registrationLimit: "",
    });

    const [merchSizes, setMerchSizes] = useState([]);
    const [merchColors, setMerchColors] = useState([]);
    const [merchVariants, setMerchVariants] = useState([]);
    const [purchaseLimit, setPurchaseLimit] = useState(1);
    const [newSize, setNewSize] = useState("");
    const [newColor, setNewColor] = useState("");
    const [customFields, setCustomFields] = useState([]);
    const [newField, setNewField] = useState({
        label: "",
        type: "text",
        required: false,
        options: [],
    });
    const [newOption, setNewOption] = useState("");

    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const addSize = () => {
        if (newSize && !merchSizes.includes(newSize)) {
            setMerchSizes([...merchSizes, newSize]);
            setNewSize("");
            regenerateVariants([...merchSizes, newSize], merchColors);
        }
    };

    const removeSize = (size) => {
        const updated = merchSizes.filter(s => s !== size);
        setMerchSizes(updated);
        regenerateVariants(updated, merchColors);
    };

    const addColor = () => {
        if (newColor && !merchColors.includes(newColor)) {
            setMerchColors([...merchColors, newColor]);
            setNewColor("");
            regenerateVariants(merchSizes, [...merchColors, newColor]);
        }
    };

    const removeColor = (color) => {
        const updated = merchColors.filter(c => c !== color);
        setMerchColors(updated);
        regenerateVariants(merchSizes, updated);
    };

    const regenerateVariants = (sizes, colors) => {
        const newVariants = [];
        sizes.forEach(size => {
            colors.forEach(color => {
                const existing = merchVariants.find(v => v.size === size && v.color === color);
                newVariants.push({
                    size,
                    color,
                    stock: existing ? existing.stock : 0,
                });
            });
        });
        setMerchVariants(newVariants);
    };

    const updateVariantStock = (size, color, stock) => {
        setMerchVariants(merchVariants.map(v => 
            v.size === size && v.color === color 
                ? { ...v, stock: parseInt(stock) || 0 }
                : v
        ));
    };

    const addCustomField = () => {
        if (!newField.label.trim()) {
            setError("Field label is required");
            return;
        }

        if ((newField.type === "dropdown" || newField.type === "checkbox") && newField.options.length === 0) {
            setError(`Please add at least one option for ${newField.type} field`);
            return;
        }

        const fieldToAdd = {
            ...newField,
            order: customFields.length,
        };

        setCustomFields([...customFields, fieldToAdd]);
        setNewField({ label: "", type: "text", required: false, options: [] });
        setError("");
    };

    const removeCustomField = (index) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const moveFieldUp = (index) => {
        if (index === 0) return;
        const newFields = [...customFields];
        [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
        newFields.forEach((field, idx) => field.order = idx);
        setCustomFields(newFields);
    };

    const moveFieldDown = (index) => {
        if (index === customFields.length - 1) return;
        const newFields = [...customFields];
        [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
        newFields.forEach((field, idx) => field.order = idx);
        setCustomFields(newFields);
    };

    const addOptionToNewField = () => {
        if (newOption.trim() && !newField.options.includes(newOption.trim())) {
            setNewField({ 
                ...newField, 
                options: [...newField.options, newOption.trim()] 
            });
            setNewOption("");
        }
    };

    const removeOptionFromNewField = (option) => {
        setNewField({
            ...newField,
            options: newField.options.filter(opt => opt !== option)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const eventData = {
                ...form,
                registrationLimit: Number(form.registrationLimit),
            };

            if (form.type === "MERCH") {
                if (merchVariants.length === 0) {
                    setError("Please add at least one merchandise variant");
                    return;
                }

                eventData.merchVariants = merchVariants;
                eventData.availableSizes = merchSizes;
                eventData.availableColors = merchColors;
                eventData.purchaseLimit = purchaseLimit;
            }

            if (form.type === "NORMAL" && customFields.length > 0) {
                eventData.customFields = customFields;
            }

            await api.post("/events", eventData);
            navigate("/organizer", { replace: true });
            window.location.reload();

        } catch (err) {
            setError(err.response?.data?.message || "Failed to create event");
        }
    };

    return (
        <div className="container">
            <h2>Create Event</h2>

            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    className="input"
                    name="name"
                    placeholder="Event Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />

                <textarea
                    className="input"
                    name="description"
                    placeholder="Description"
                    value={form.description}
                    onChange={handleChange}
                    required
                />

                <select
                    className="input"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                >
                    <option value="NORMAL">Normal Event</option>
                    <option value="MERCH">Merchandise Event</option>
                </select>

                <input
                    className="input"
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    required
                />

                <input
                    className="input"
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    required
                />

                <input
                    className="input"
                    type="number"
                    name="registrationLimit"
                    placeholder="Registration Limit"
                    value={form.registrationLimit}
                    onChange={handleChange}
                />

                {}
                {form.type === "NORMAL" && (
                    <div style={{ 
                        marginTop: "20px", 
                        padding: "20px", 
                        backgroundColor: "#f0f9ff", 
                        borderRadius: "8px",
                        border: "1px solid #bae6fd"
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#0284c7" }}>
                            Custom Registration Form Builder
                        </h3>
                        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "15px" }}>
                            Add custom fields to collect additional information from participants
                        </p>

                        <div style={{
                            padding: "12px",
                            backgroundColor: "#fef3c7",
                            border: "1px solid #fbbf24",
                            borderRadius: "6px",
                            marginBottom: "15px",
                            fontSize: "14px",
                            color: "#92400e"
                        }}>
                             <b>Note:</b> Once the first participant registers, the form structure will be locked and cannot be modified.
                        </div>

                        {}
                        <div style={{ 
                            padding: "15px", 
                            backgroundColor: "white", 
                            borderRadius: "6px",
                            marginBottom: "15px"
                        }}>
                            <h4 style={{ marginTop: 0, marginBottom: "10px", fontSize: "16px" }}>
                                Add New Field
                            </h4>
                            
                            <input
                                className="input"
                                type="text"
                                placeholder="Field Label (e.g., T-shirt Size, Dietary Preference)"
                                value={newField.label}
                                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                                style={{ marginBottom: "10px" }}
                            />

                            <select
                                className="input"
                                value={newField.type}
                                onChange={(e) => setNewField({ 
                                    ...newField, 
                                    type: e.target.value,
                                    options: e.target.value === "text" || e.target.value === "file" ? [] : newField.options
                                })}
                                style={{ marginBottom: "10px" }}
                            >
                                <option value="text">Text Input</option>
                                <option value="dropdown">Dropdown (Select One)</option>
                                <option value="checkbox">Checkbox (Select Multiple)</option>
                                <option value="file">File Upload</option>
                            </select>

                            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                                <input
                                    type="checkbox"
                                    checked={newField.required}
                                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                                />
                                <span>Required Field</span>
                            </label>

                            {}
                            {(newField.type === "dropdown" || newField.type === "checkbox") && (
                                <div style={{ marginTop: "10px" }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
                                        Options:
                                    </label>
                                    <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                                        <input
                                            className="input"
                                            type="text"
                                            value={newOption}
                                            onChange={(e) => setNewOption(e.target.value)}
                                            placeholder="Add an option"
                                            style={{ flex: 1 }}
                                        />
                                        <button 
                                            type="button" 
                                            className="btn" 
                                            onClick={addOptionToNewField}
                                            style={{ backgroundColor: "#0284c7" }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {newField.options.map(option => (
                                            <span key={option} style={{
                                                padding: "6px 12px",
                                                backgroundColor: "#e0f2fe",
                                                borderRadius: "12px",
                                                fontSize: "14px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}>
                                                {option}
                                                <button 
                                                    type="button"
                                                    onClick={() => removeOptionFromNewField(option)}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#dc2626",
                                                        cursor: "pointer",
                                                        padding: "0",
                                                        fontSize: "16px"
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button 
                                type="button" 
                                className="btn" 
                                onClick={addCustomField}
                                style={{ backgroundColor: "#0284c7", marginTop: "10px" }}
                            >
                                ➕ Add Field
                            </button>
                        </div>

                        {}
                        {customFields.length > 0 && (
                            <div>
                                <h4 style={{ marginBottom: "10px", fontSize: "16px" }}>
                                    Custom Fields ({customFields.length})
                                </h4>
                                {customFields.map((field, index) => (
                                    <div key={index} style={{
                                        padding: "15px",
                                        backgroundColor: "white",
                                        borderRadius: "6px",
                                        marginBottom: "10px",
                                        border: "1px solid #e0f2fe"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                                                    {field.label}
                                                    {field.required && <span style={{ color: "#dc2626" }}> *</span>}
                                                </div>
                                                <div style={{ fontSize: "14px", color: "#64748b" }}>
                                                    Type: {field.type}
                                                </div>
                                                {field.options && field.options.length > 0 && (
                                                    <div style={{ fontSize: "14px", color: "#64748b", marginTop: "5px" }}>
                                                        Options: {field.options.join(", ")}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: "flex", gap: "5px" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => moveFieldUp(index)}
                                                    disabled={index === 0}
                                                    style={{
                                                        padding: "5px 10px",
                                                        backgroundColor: index === 0 ? "#e5e7eb" : "#0284c7",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: index === 0 ? "not-allowed" : "pointer"
                                                    }}
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveFieldDown(index)}
                                                    disabled={index === customFields.length - 1}
                                                    style={{
                                                        padding: "5px 10px",
                                                        backgroundColor: index === customFields.length - 1 ? "#e5e7eb" : "#0284c7",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: index === customFields.length - 1 ? "not-allowed" : "pointer"
                                                    }}
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeCustomField(index)}
                                                    style={{
                                                        padding: "5px 10px",
                                                        backgroundColor: "#dc2626",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {}
                {form.type === "MERCH" && (
                    <div style={{ 
                        marginTop: "20px", 
                        padding: "20px", 
                        backgroundColor: "#f9fafb", 
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb"
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#10b981" }}>
                            Merchandise Details
                        </h3>

                        {}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                                Purchase Limit per Customer:
                            </label>
                            <input
                                className="input"
                                type="number"
                                min="1"
                                value={purchaseLimit}
                                onChange={(e) => setPurchaseLimit(parseInt(e.target.value) || 1)}
                                placeholder="Max items per purchase"
                            />
                        </div>

                        {/* Sizes */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                                Available Sizes:
                            </label>
                            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                                <input
                                    className="input"
                                    type="text"
                                    value={newSize}
                                    onChange={(e) => setNewSize(e.target.value)}
                                    placeholder="e.g., S, M, L, XL"
                                    style={{ flex: 1 }}
                                />
                                <button 
                                    type="button" 
                                    className="btn" 
                                    onClick={addSize}
                                    style={{ backgroundColor: "#10b981" }}
                                >
                                    Add Size
                                </button>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {merchSizes.map(size => (
                                    <span key={size} style={{
                                        padding: "6px 12px",
                                        backgroundColor: "#e5e7eb",
                                        borderRadius: "12px",
                                        fontSize: "14px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px"
                                    }}>
                                        {size}
                                        <button 
                                            type="button"
                                            onClick={() => removeSize(size)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#dc2626",
                                                cursor: "pointer",
                                                padding: "0",
                                                fontSize: "16px"
                                            }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                                Available Colors:
                            </label>
                            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                                <input
                                    className="input"
                                    type="text"
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    placeholder="e.g., Black, White, Blue"
                                    style={{ flex: 1 }}
                                />
                                <button 
                                    type="button" 
                                    className="btn" 
                                    onClick={addColor}
                                    style={{ backgroundColor: "#10b981" }}
                                >
                                    Add Color
                                </button>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {merchColors.map(color => (
                                    <span key={color} style={{
                                        padding: "6px 12px",
                                        backgroundColor: "#e5e7eb",
                                        borderRadius: "12px",
                                        fontSize: "14px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px"
                                    }}>
                                        {color}
                                        <button 
                                            type="button"
                                            onClick={() => removeColor(color)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#dc2626",
                                                cursor: "pointer",
                                                padding: "0",
                                                fontSize: "16px"
                                            }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {}
                        {merchVariants.length > 0 && (
                            <div>
                                <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
                                    Stock for Each Variant:
                                </label>
                                <div style={{ 
                                    overflowX: "auto",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "6px"
                                }}>
                                    <table style={{ 
                                        width: "100%", 
                                        borderCollapse: "collapse",
                                        backgroundColor: "white"
                                    }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#f3f4f6" }}>
                                                <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                                                    Size
                                                </th>
                                                <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                                                    Color
                                                </th>
                                                <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                                                    Stock
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {merchVariants.map((variant, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>
                                                        {variant.size}
                                                    </td>
                                                    <td style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>
                                                        {variant.color}
                                                    </td>
                                                    <td style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={variant.stock}
                                                            onChange={(e) => updateVariantStock(
                                                                variant.size, 
                                                                variant.color, 
                                                                e.target.value
                                                            )}
                                                            style={{
                                                                width: "100px",
                                                                padding: "6px",
                                                                border: "1px solid #e5e7eb",
                                                                borderRadius: "4px"
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button className="btn" type="submit">
                    Create Event
                </button>
            </form>
        </div>
    );
}
