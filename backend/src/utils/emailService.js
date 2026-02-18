const nodemailer = require("nodemailer");

const createTransporter = () => {
  console.log('📧 Creating email transporter...');
  console.log('Email config:', {
    service: process.env.EMAIL_SERVICE,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM
  });
  
  if (process.env.EMAIL_SERVICE === "gmail") {
    console.log('Using Gmail service');
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  console.log('Using custom SMTP (Ethereal)');
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.ethereal.email",
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendRegistrationEmail = async (to, emailData) => {
  try {
    const transporter = createTransporter();

    const { 
      participantName, 
      eventName, 
      eventDate, 
      eventTime,
      eventLocation, 
      ticketId, 
      qrCodeDataUrl,
      eventType,
      merchDetails 
    } = emailData;

    const isMerch = eventType === "MERCH";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
          }
          .ticket-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .info-label {
            font-weight: bold;
            color: #667eea;
          }
          .qr-code {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: white;
            border-radius: 8px;
          }
          .qr-code img {
            max-width: 250px;
            height: auto;
          }
          .ticket-id {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: white;
            border-radius: 8px;
            letter-spacing: 2px;
          }
          .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            font-size: 12px;
          }
          .note {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .merch-details {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1> ${isMerch ? "Purchase" : "Registration"} Confirmation</h1>
          <p>${isMerch ? "Your order has been confirmed!" : "You're all set!"}</p>
        </div>
        
        <div class="content">
          <p>Hi ${participantName},</p>
          
          <p>${isMerch 
            ? `Thank you for your purchase of <strong>${eventName}</strong>! Your order has been confirmed.` 
            : `You have successfully registered for <strong>${eventName}</strong>!`}
          </p>
          
          <div class="ticket-id">
            ${isMerch ? "Order" : "Ticket"} ID: ${ticketId}
          </div>

          ${isMerch && merchDetails ? `
            <div class="merch-details">
              <h3> Order Details</h3>
              <div class="info-row">
                <span class="info-label">Size:</span>
                <span>${merchDetails.size}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Color:</span>
                <span>${merchDetails.color}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Quantity:</span>
                <span>${merchDetails.quantity}</span>
              </div>
            </div>
          ` : ''}
          
          <div class="ticket-info">
            <h3>${isMerch ? " Item Details" : " Event Details"}</h3>
            ${!isMerch ? `
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span>${eventDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Time:</span>
                <span>${eventTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Location:</span>
                <span>${eventLocation}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="qr-code">
            <h3>${isMerch ? "Pickup QR Code" : "Entry QR Code"}</h3>
            <img src="${qrCodeDataUrl}" alt="QR Code" />
            <p style="color: #666; margin-top: 10px;">
              ${isMerch 
                ? "Show this QR code to collect your merchandise" 
                : "Show this QR code at the event entrance"}
            </p>
          </div>
          
          <div class="note">
            <strong>📱 Important:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Save this email or take a screenshot of the QR code</li>
              <li>Present the QR code on your phone or a printed copy</li>
              <li>Your ${isMerch ? "order" : "ticket"} ID is: <strong>${ticketId}</strong></li>
              ${!isMerch ? `<li>Please arrive 15 minutes before the event starts</li>` : ''}
            </ul>
          </div>
          
          <p>We look forward to ${isMerch ? "serving" : "seeing"} you!</p>
          
          <p>Best regards,<br>The Event Management Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>If you have any questions, please contact the event organizers.</p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Event Management System" <noreply@events.com>',
      to,
      subject: isMerch 
        ? `Purchase Confirmation: ${eventName} - Order #${ticketId}`
        : `Registration Confirmation: ${eventName} - Ticket #${ticketId}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent:", info.messageId);
    
    if (process.env.NODE_ENV === "development" && info.messageId) {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendCancellationEmail = async (to, emailData) => {
  try {
    const transporter = createTransporter();

    const { participantName, eventName, ticketId, reason } = emailData;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
          }
          .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔔 Registration Cancelled</h1>
        </div>
        
        <div class="content">
          <p>Hi ${participantName},</p>
          
          <p>Your registration for <strong>${eventName}</strong> (Ticket ID: ${ticketId}) has been cancelled.</p>
          
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          
          <p>If you have any questions, please contact the event organizers.</p>
          
          <p>Best regards,<br>The Event Management Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Event Management System" <noreply@events.com>',
      to,
      subject: `Registration Cancelled: ${eventName}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Cancellation email sent:", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    throw error;
  }
};

module.exports = {
  sendRegistrationEmail,
  sendCancellationEmail,
};
