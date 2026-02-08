const QRCode = require("qrcode");

/**

 * @param {string} data 
 * @param {object} options 
 * @returns {Promise<string>} 
 */
const generateQRCode = async (data, options = {}) => {
  try {
    const defaultOptions = {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 300,
      ...options,
    };

    const qrCodeDataUrl = await QRCode.toDataURL(data, defaultOptions);
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};

/**
 * @param {string} data 
 * @param {object} options
 * @returns {Promise<Buffer>} 
 */
const generateQRCodeBuffer = async (data, options = {}) => {
  try {
    const defaultOptions = {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: 300,
      ...options,
    };

    const buffer = await QRCode.toBuffer(data, defaultOptions);
    
    return buffer;
  } catch (error) {
    console.error("Error generating QR code buffer:", error);
    throw new Error("Failed to generate QR code buffer");
  }
};

/**
 * @param {object} registration 
 * @param {object} event
 * @returns {string}
 */
const createTicketData = (registration, event) => {
  const ticketData = {
    ticketId: registration.ticketId,
    eventId: event._id.toString(),
    eventName: event.name,
    participantId: registration.participant.toString(),
    registrationDate: registration.createdAt,
    eventType: event.type,
  };

  if (event.type === "MERCH" && registration.merchDetails) {
    ticketData.merchDetails = {
      size: registration.merchDetails.size,
      color: registration.merchDetails.color,
      quantity: registration.merchDetails.quantity,
    };
  }

  return JSON.stringify(ticketData);
};

/**
 * @param {string} qrData 
 * @returns {object} 
 */
const verifyTicketData = (qrData) => {
  try {
    const ticketData = JSON.parse(qrData);
    
    if (!ticketData.ticketId || !ticketData.eventId || !ticketData.participantId) {
      throw new Error("Invalid ticket data");
    }
    
    return ticketData;
  } catch (error) {
    console.error("Error verifying ticket data:", error);
    throw new Error("Invalid or corrupted ticket data");
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeBuffer,
  createTicketData,
  verifyTicketData,
};
