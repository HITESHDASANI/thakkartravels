const PDFDocument = require('pdfkit');

function generateTicket(res, booking) {
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(18).text("Flight Ticket ✈️");

    doc.text(`PNR: ${booking.pnr}`);
    doc.text(`${booking.origin} → ${booking.destination}`);
    doc.text(`Amount: ₹${booking.amount}`);

    doc.end();
}

module.exports = generateTicket;