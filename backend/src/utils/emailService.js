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

    let qrAttachment = null;
    let qrImgTag = `<p style="color:#888; font-style:italic;">QR code could not be generated. Please visit "My Events" to view your ticket.</p>`;
    if (qrCodeDataUrl) {
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
      qrAttachment = {
        filename: "qrcode.png",
        content: Buffer.from(base64Data, "base64"),
        cid: "qrcode@ticket",
        contentType: "image/png",
      };
      qrImgTag = `<img src="cid:qrcode@ticket" alt="QR Code" style="max-width:250px;height:auto;display:block;margin:0 auto;" />`;
    }

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
            ${qrImgTag}
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
      attachments: qrAttachment ? [qrAttachment] : [],
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

const sendOrderPlacedEmail = async (to, emailData) => {
  try {
    const transporter = createTransporter();
    const { participantName, eventName, ticketId, merchDetails, registrationFee } = emailData;
    const totalAmount = registrationFee * (merchDetails?.quantity || 1);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .order-id { font-size: 22px; font-weight: bold; color: #f6a02d; text-align: center; margin: 20px 0; padding: 15px; background: white; border-radius: 8px; letter-spacing: 2px; }
          .merch-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fda085; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-label { font-weight: bold; color: #f6a02d; }
          .steps { background: #fff8e1; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .steps ol { margin: 10px 0; padding-left: 20px; }
          .steps li { margin-bottom: 8px; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🛍️ Order Placed!</h1>
          <p>Your merchandise order has been received</p>
        </div>
        <div class="content">
          <p>Hi ${participantName},</p>
          <p>Thank you for your order of <strong>${eventName}</strong> merchandise! Your order is now <strong>pending payment verification</strong>.</p>
          <div class="order-id">Order ID: ${ticketId}</div>
          ${merchDetails ? `
          <div class="merch-box">
            <h3>🧾 Order Details</h3>
            <div class="info-row"><span class="info-label">Size:</span><span>${merchDetails.size}</span></div>
            <div class="info-row"><span class="info-label">Color:</span><span>${merchDetails.color}</span></div>
            <div class="info-row"><span class="info-label">Quantity:</span><span>${merchDetails.quantity}</span></div>
            <div class="info-row"><span class="info-label">Total Amount:</span><span>₹${totalAmount}</span></div>
          </div>` : ''}
          <div class="steps">
            <strong>📋 Next Steps:</strong>
            <ol>
              <li>Complete the payment of <strong>₹${totalAmount}</strong></li>
              <li>Take a screenshot or photo of your payment receipt</li>
              <li>Go to <strong>My Events</strong> and upload your payment proof</li>
              <li>Wait for the organizer to approve your payment</li>
              <li>Once approved, you will receive a confirmation email with your QR code</li>
            </ol>
          </div>
          <p>⚠️ <strong>Important:</strong> Your order is <em>not confirmed</em> until the payment is verified and approved by the organizer. No QR code is issued until then.</p>
          <p>Best regards,<br>The Event Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Event Management System" <noreply@events.com>',
      to,
      subject: `Order Placed (Pending Payment): ${eventName} - Order #${ticketId}`,
      html: htmlContent,
    });

    console.log("Order-placed email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending order-placed email:", error);
    throw error;
  }
};

const sendPaymentApprovalEmail = async (to, emailData) => {
  try {
    const transporter = createTransporter();
    const { participantName, eventName, ticketId, qrCodeDataUrl, merchDetails, registrationFee } = emailData;
    const totalAmount = registrationFee * (merchDetails?.quantity || 1);

    let qrAttachment = null;
    let qrSection = '';
    if (qrCodeDataUrl) {
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
      qrAttachment = {
        filename: "qrcode.png",
        content: Buffer.from(base64Data, "base64"),
        cid: "qrcode@ticket",
        contentType: "image/png",
      };
      qrSection = `
        <div class="qr-code">
          <h3>📱 Your Pickup QR Code</h3>
          <img src="cid:qrcode@ticket" alt="Pickup QR Code" style="max-width:250px;height:auto;display:block;margin:0 auto;" />
          <p style="color: #666; margin-top: 10px;">Show this QR code to collect your merchandise</p>
        </div>`;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .order-id { font-size: 22px; font-weight: bold; color: #11998e; text-align: center; margin: 20px 0; padding: 15px; background: white; border-radius: 8px; letter-spacing: 2px; }
          .merch-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #38ef7d; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-label { font-weight: bold; color: #11998e; }
          .qr-code { text-align: center; margin: 30px 0; padding: 20px; background: white; border-radius: 8px; border: 2px solid #e5e7eb; }
          .qr-code img { max-width: 250px; height: auto; }
          .note { background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Payment Approved!</h1>
          <p>Your order is now confirmed</p>
        </div>
        <div class="content">
          <p>Hi ${participantName},</p>
          <p>Great news! Your payment for <strong>${eventName}</strong> merchandise has been <strong>approved</strong>. Your order is now confirmed.</p>
          <div class="order-id">Order ID: ${ticketId}</div>
          ${merchDetails ? `
          <div class="merch-box">
            <h3>🧾 Order Details</h3>
            <div class="info-row"><span class="info-label">Size:</span><span>${merchDetails.size}</span></div>
            <div class="info-row"><span class="info-label">Color:</span><span>${merchDetails.color}</span></div>
            <div class="info-row"><span class="info-label">Quantity:</span><span>${merchDetails.quantity}</span></div>
            <div class="info-row"><span class="info-label">Total Paid:</span><span>₹${totalAmount}</span></div>
          </div>` : ''}
          ${qrSection}
          <div class="note">
            <strong>📱 Important:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Save this email or screenshot the QR code</li>
              <li>Present the QR code when collecting your merchandise</li>
              <li>Your order ID is: <strong>${ticketId}</strong></li>
            </ul>
          </div>
          <p>Best regards,<br>The Event Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Event Management System" <noreply@events.com>',
      to,
      subject: `✅ Order Confirmed: ${eventName} - Order #${ticketId}`,
      html: htmlContent,
      attachments: qrAttachment ? [qrAttachment] : [],
    });

    console.log("Payment approval email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending payment approval email:", error);
    throw error;
  }
};

const sendPaymentRejectionEmail = async (to, emailData) => {
  try {
    const transporter = createTransporter();
    const { participantName, eventName, ticketId, reason, merchDetails } = emailData;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .order-id { font-size: 22px; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; padding: 15px; background: white; border-radius: 8px; letter-spacing: 2px; }
          .reason-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0; color: #721c24; }
          .steps { background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .steps ol { margin: 10px 0; padding-left: 20px; }
          .steps li { margin-bottom: 8px; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>❌ Payment Rejected</h1>
          <p>Action required for your merchandise order</p>
        </div>
        <div class="content">
          <p>Hi ${participantName},</p>
          <p>Unfortunately, your payment proof for the <strong>${eventName}</strong> merchandise order could not be verified.</p>
          <div class="order-id">Order ID: ${ticketId}</div>
          <div class="reason-box">
            <strong>Reason for Rejection:</strong><br/>
            ${reason}
          </div>
          <div class="steps">
            <strong>📋 What to do next:</strong>
            <ol>
              <li>Review the rejection reason above</li>
              <li>Ensure you have a valid payment receipt/screenshot</li>
              <li>Contact the organizer if you believe this is an error</li>
              <li>Upload a new payment proof from the <strong>My Events</strong> page</li>
            </ol>
          </div>
          <p>If you have any questions, please contact the event organizer directly.</p>
          <p>Best regards,<br>The Event Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Event Management System" <noreply@events.com>',
      to,
      subject: `❌ Payment Rejected: ${eventName} - Order #${ticketId}`,
      html: htmlContent,
    });

    console.log("Payment rejection email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending payment rejection email:", error);
    throw error;
  }
};

module.exports = {
  sendRegistrationEmail,
  sendCancellationEmail,
  sendOrderPlacedEmail,
  sendPaymentApprovalEmail,
  sendPaymentRejectionEmail,
};
