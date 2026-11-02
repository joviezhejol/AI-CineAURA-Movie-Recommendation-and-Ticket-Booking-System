const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

function formatWhatsAppMessage({
  bookingRef,
  customerName,
  movieTitle,
  language,
  experience,
  theatreName,
  screenName,
  showDate,
  startTime,
  seatNames,
  seatType,
  totalAmount,
  qrToken
}) {
  return `*🎬 AI CINEAURA - TICKET CONFIRMATION*
━━━━━━━━━━━━━━━━━━━━
Hi *${customerName}*, your tickets are confirmed! 🎟️

*Movie:* ${movieTitle} (${language} - ${experience})
*Theatre:* ${theatreName}
*Screen:* ${screenName}
*Date & Time:* ${showDate} | ${startTime}
*Seats:* ${seatNames} (${seatType})
*Total Paid:* ₹${totalAmount.toFixed(2)}
*Booking ID:* ${bookingRef}

📲 *Access your Digital QR Ticket:*
http://localhost:5173/ticket/${qrToken}

⚠️ *Important Cinema Guidelines:*
• Please arrive 15 minutes before showtime.
• Outside food & beverages are strictly prohibited.
• Present the QR code on your mobile device at the gate for lightning check-in.

*AI CineAura* — _Stories That Made for You._`;
}

function sendWhatsAppNotification({ bookingId, phone, messageData }) {
  const content = formatWhatsAppMessage(messageData);
  const logId = uuidv4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO whatsapp_logs (id, booking_id, phone_number, message_content, status, sent_at)
    VALUES (?, ?, ?, ?, 'DELIVERED', ?)
  `);

  stmt.run(logId, bookingId, phone, content, now);

  return {
    id: logId,
    phone,
    content,
    status: 'DELIVERED',
    timestamp: now
  };
}

module.exports = {
  formatWhatsAppMessage,
  sendWhatsAppNotification
};
