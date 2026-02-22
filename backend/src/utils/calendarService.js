const crypto = require("crypto");

const generateICSFile = (event, registration = null, reminderMinutes = 30) => {
  const now = new Date();
  const dtStamp = formatICSDate(now);
  
  const uid = crypto.randomBytes(16).toString("hex");
  
  const dtStart = formatICSDate(new Date(event.startDate));
  const dtEnd = event.endDate 
    ? formatICSDate(new Date(event.endDate))
    : formatICSDate(new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000));
  
  let description = event.description || "";
  if (registration) {
    description += `\\n\\nTicket ID: ${registration.ticketId}`;
    if (event.type === "MERCH" && registration.merchDetails) {
      description += `\\nSize: ${registration.merchDetails.size}`;
      description += `\\nColor: ${registration.merchDetails.color}`;
      description += `\\nQuantity: ${registration.merchDetails.quantity}`;
    }
  }
  if (event.registrationFee > 0) {
    description += `\\n\\nRegistration Fee: ₹${event.registrationFee}`;
  }
  
  description = description.replace(/\n/g, "\\n").replace(/,/g, "\\,");
  
  const location = event.venue || "Online Event";
  
  const alarmTrigger = `-PT${reminderMinutes}M`;
  
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Event Management System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Event Registration",
    "X-WR-TIMEZONE:Asia/Kolkata",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Kolkata",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0530",
    "TZOFFSETTO:+0530",
    "TZNAME:IST",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${uid}@eventmanagementsystem.com`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Asia/Kolkata:${dtStart}`,
    `DTEND;TZID=Asia/Kolkata:${dtEnd}`,
    `SUMMARY:${event.name}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `STATUS:CONFIRMED`,
    `SEQUENCE:0`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${event.name}`,
    `TRIGGER:${alarmTrigger}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  
  return icsContent;
};

const generateBatchICSFile = (eventsWithRegistrations, reminderMinutes = 30) => {
  const now = new Date();
  const dtStamp = formatICSDate(now);
  
  const icsHeader = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Event Management System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:My Registered Events",
    "X-WR-TIMEZONE:Asia/Kolkata",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Kolkata",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0530",
    "TZOFFSETTO:+0530",
    "TZNAME:IST",
    "END:STANDARD",
    "END:VTIMEZONE"
  ];
  
  const events = eventsWithRegistrations.map((item) => {
    const event = item.event;
    const registration = item.registration;
    
    const uid = crypto.randomBytes(16).toString("hex");
    const dtStart = formatICSDate(new Date(event.startDate));
    const dtEnd = event.endDate 
      ? formatICSDate(new Date(event.endDate))
      : formatICSDate(new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000));
    
    let description = event.description || "";
    if (registration) {
      description += `\\n\\nTicket ID: ${registration.ticketId}`;
      if (event.type === "MERCH" && registration.merchDetails) {
        description += `\\nSize: ${registration.merchDetails.size}`;
        description += `\\nColor: ${registration.merchDetails.color}`;
        description += `\\nQuantity: ${registration.merchDetails.quantity}`;
      }
    }
    if (event.registrationFee > 0) {
      description += `\\n\\nRegistration Fee: ₹${event.registrationFee}`;
    }
    
    description = description.replace(/\n/g, "\\n").replace(/,/g, "\\,");
    const location = event.venue || "Online Event";
    const alarmTrigger = `-PT${reminderMinutes}M`;
    
    return [
      "BEGIN:VEVENT",
      `UID:${uid}@eventmanagementsystem.com`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;TZID=Asia/Kolkata:${dtStart}`,
      `DTEND;TZID=Asia/Kolkata:${dtEnd}`,
      `SUMMARY:${event.name}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `STATUS:CONFIRMED`,
      `SEQUENCE:0`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:Reminder: ${event.name}`,
      `TRIGGER:${alarmTrigger}`,
      "END:VALARM",
      "END:VEVENT"
    ].join("\r\n");
  });
  
  const icsFooter = ["END:VCALENDAR"];
  
  return [...icsHeader, ...events, ...icsFooter].join("\r\n");
};

const formatICSDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

const generateGoogleCalendarURL = (event, registration = null) => {
  const startDate = new Date(event.startDate);
  const endDate = event.endDate 
    ? new Date(event.endDate)
    : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  
  const formatGoogleDate = (date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };
  
  let details = event.description || "";
  if (registration) {
    details += `\n\nTicket ID: ${registration.ticketId}`;
    if (event.type === "MERCH" && registration.merchDetails) {
      details += `\nSize: ${registration.merchDetails.size}`;
      details += `\nColor: ${registration.merchDetails.color}`;
      details += `\nQuantity: ${registration.merchDetails.quantity}`;
    }
  }
  if (event.registrationFee > 0) {
    details += `\n\nRegistration Fee: ₹${event.registrationFee}`;
  }
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: details,
    location: event.venue || "Online Event",
    ctz: "Asia/Kolkata"
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const generateOutlookCalendarURL = (event, registration = null) => {
  const startDate = new Date(event.startDate);
  const endDate = event.endDate 
    ? new Date(event.endDate)
    : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  
  let body = event.description || "";
  if (registration) {
    body += `\n\nTicket ID: ${registration.ticketId}`;
    if (event.type === "MERCH" && registration.merchDetails) {
      body += `\nSize: ${registration.merchDetails.size}`;
      body += `\nColor: ${registration.merchDetails.color}`;
      body += `\nQuantity: ${registration.merchDetails.quantity}`;
    }
  }
  if (event.registrationFee > 0) {
    body += `\n\nRegistration Fee: ₹${event.registrationFee}`;
  }
  
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.name,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: body,
    location: event.venue || "Online Event"
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

module.exports = {
  generateICSFile,
  generateBatchICSFile,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL,
  formatICSDate
};
