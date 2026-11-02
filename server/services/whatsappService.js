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
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5005';
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const ticketUrl = `${cleanBase}/ticket/${qrToken}`;

  return `*🎬 AI CINEAURA - TICKET CONFIRMATION*
━━━━━━━━━━━━━━━━━━━━
Hi *${customerName}*, your tickets are confirmed! 🎟️

*Movie:* ${movieTitle} (${language} - ${experience})
*Theatre:* ${theatreName}
*Screen:* ${screenName}
*Date & Time:* ${showDate} | ${startTime}
*Seats:* ${seatNames} (${seatType})
*Total Paid:* ₹${Number(totalAmount).toFixed(2)}
*Booking ID:* ${bookingRef}

📲 *Access your Digital QR Ticket:*
${ticketUrl}

⚠️ *Important Cinema Guidelines:*
• Please arrive 15 minutes before showtime.
• Outside food & beverages are strictly prohibited.
• Present the QR code on your mobile device at the gate for lightning check-in.

*AI CineAura* — _Stories That Made for You._`;
}

async function sendWhatsAppNotification({ bookingId, phone, messageData }) {
  const content = formatWhatsAppMessage(messageData);
  const logId = uuidv4();
  const now = Date.now();

  await db.execute(`
    INSERT INTO whatsapp_logs (id, booking_id, phone_number, message_content, status, sent_at)
    VALUES ($1, $2, $3, $4, 'DELIVERED', $5)
  `, [logId, bookingId, phone, content, now]);

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
