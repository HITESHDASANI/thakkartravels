const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middleware/auth');

const User = require('../models/User');
const Flight = require('../models/Flight');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const sendMail =require('../utils/mailer');
const Setting = require('../models/Setting');
// ================= BOOK FLIGHT =================

const airlinePnr =
"AL" + Math.floor(100000 + Math.random() * 900000);

router.post(

'/book-flight',

requireLogin,

async (req, res) => {

try {

    console.log("BOOKING START");

    const {

        flightId,

        passengers,

        flightData

    } = req.body;

    let flight = null;
    let setting = await Setting.findOne();

if (!setting) {
    setting = await Setting.create({
        officeMode: false
    });
}

    // ================= MONGODB FLIGHT =================

    if (flightId) {

        flight =
        await Flight.findById(flightId);

    }

    // ================= GOOGLE SHEET FLIGHT =================

    if (!flight && flightData) {

        flight = {

            airline: "IndiGo",

            flightNo:
            flightData.flight,

            origin:
            flightData.origin || "--",

            destination:
            flightData.destination || "--",

            departure:
            flightData.depTime || "--",

            arrival:
            flightData.arrival || "--",

            date:
            flightData.doj || "--",

            fare:
            Number(flightData.fare),

            seats:
            Number(flightData.pax)

        };

    }

    if (!flight) {

        return res.json({

            error:
            "Flight not found ❌"

        });

    }

    // ================= USER =================

    const user =
    await User.findById(
        req.session.user.id
    );

   const totalAmount =

    passengers.length *

    Number(

        flight.fare ||

        flight.baseFare ||

        0

    );

    // ================= BALANCE =================

    if (

        Number(user.balance)

        < totalAmount

    ) {

        return res.json({

            error:
            "Insufficient balance ❌"

        });

    }

    // ================= DEDUCT BALANCE =================
    const pnr = "TT" + Date.now();
    const before = Number(user.balance);

user.balance = before - totalAmount;

await user.save();

await Transaction.create({

    userId: user._id,

    type: 'DEBIT',

    amount: totalAmount,
    pnr: pnr,
    airlinePnr: airlinePnr,
    balanceBefore: before,

    balanceAfter: user.balance,

    remark: `Flight Booking ${pnr}`

});

    // ================= PNR =================

   

    // ================= SAVE BOOKING =================

    const booking =
await Booking.create({

    userId: user._id,

  flightId: flight._id ? flight._id.toString() : "",

    pnr: pnr,
    airlinePnr: airlinePnr,
    airline:
    flight.airline ||

    flight.flight ||

    "IndiGo",

    flightNo:
    flight.flightNo ||

    flight.flight ||

    "--",

   origin:

flight.origin ||
flightData?.origin ||
req.body.origin ||
"CCU",

destination:

flight.destination ||
flightData?.destination ||
req.body.destination ||
"DEL",

    departure:

flight.depTime ||
flight.departure ||
flightData?.depTime ||
"--",

arrival:

flight.arrTime ||
flight.arrival ||
flightData?.arrival ||
"--",

    date:
    flight.doj ||

    flight.date ||

    "--",

    amount: totalAmount,

    status: setting.officeMode
    ? "PENDING"
    : "CONFIRMED",

    passengers,

    

    contactName:
    req.body.contactName ||

    "",

    contactMobile:
    req.body.contactMobile ||

    "",

    contactEmail:
    req.body.contactEmail ||

    ""

});

// ================= REDUCE MONGODB SEATS =================

const mongoFlight = await Flight.findOne({

    flightNo: booking.flightNo,

    origin: booking.origin,

    destination: booking.destination

});

if (mongoFlight) {

    mongoFlight.seats =

        Number(mongoFlight.seats)

        - booking.passengers.length;

    await mongoFlight.save();

    console.log(

        "NEW SEATS =",

        mongoFlight.seats

    );

} else {

    console.log(

        "Flight not found in MongoDB"

    );

}
// Generate QR data for the booking
booking.qrData = JSON.stringify({

    pnr: booking.pnr,

    airlinePnr: booking.airlinePnr,

    airline: booking.airline,

    flightNo: booking.flightNo,

    origin: booking.origin,

    destination: booking.destination,

    departure: booking.departure,

    arrival: booking.arrival,

    date: booking.date,

    amount: booking.amount,

    passengers: booking.passengers.map(p => ({
        title: p.title,
        firstName: p.firstName,
        lastName: p.lastName,
        seat: p.seat || ''
    }))

});

await booking.save();
if (setting.officeMode) {

    await sendMail(
        'thakkartravels.dasani@gmail.com',
        `Manual Approval Required - ${booking.pnr}`,
        `
        <h2>New Booking Waiting For Approval</h2>

        <p><b>PNR:</b> ${booking.pnr}</p>
        <p><b>User:</b> ${user.email}</p>
        <p><b>Amount:</b> ₹${totalAmount}</p>

        <p>
            Login to Admin Panel and issue ticket manually.
        </p>
        `
    );

    return res.json({
        success: true,
        message: "Booking request submitted. Waiting for admin approval.",
        booking
    });
}
    await sendMail(

    'thakkartravels.dasani@gmail.com',

    `New Booking ${pnr}`,

    `

    <h2>New Booking Received</h2>

    <table border="1" cellpadding="8">

        <tr>
            <td>PNR</td>
            <td>${pnr}</td>
        </tr>

        <tr>
            <td>User</td>
            <td>${user.email}</td>
        </tr>

        <tr>
            <td>Amount</td>
            <td>₹${totalAmount}</td>
        </tr>

        <tr>
            <td>Passengers</td>
            <td>${passengers.length}</td>
        </tr>

    </table>

    `
);
    // ================= REDUCE AVAILABLE SEATS =================

// ================= REDUCE AVAILABLE SEATS =================

if (flightId && flight._id) {

    const updatedFlight = await Flight.findByIdAndUpdate(

        flight._id,

        {

            $inc: {

                seats: -passengers.length

            }

        },

        { new: true }

    );
console.log(
    "Seats Before:",
    flight.seats
);

console.log(
    "Seats Reduced By:",
    passengers.length
);
    console.log(

        "UPDATED SEATS:",

        updatedFlight.seats

    );

    }
    
    // If flight data is from Google Sheet, we cannot update seats there. So we just check availability here.
    if (

    Number(flight.seats) < passengers.length

) {

    return res.json({

        error: "Seats not available ❌"

    });

}
// ================= SEND EMAIL =================



await sendMail(

    booking.contactEmail,

    `Flight Ticket - ${booking.pnr}`,

    `

    <div style="font-family:Arial;padding:20px;">

        <h2 style="color:green;">

            Booking Confirmed ✅

        </h2>

        <p>

            Dear ${booking.contactName},

        </p>

        <p>

            Your flight booking has been confirmed.

        </p>

        <table border="1" cellpadding="10" cellspacing="0">

            <tr>

                <td>

                    PNR

                </td>

                <td>

                    ${booking.pnr}

                </td>

            </tr>

            <tr>

                <td>

                    Airline

                </td>

                <td>

                    ${booking.airline}

                </td>

            </tr>

            <tr>

                <td>

                    Flight

                </td>

                <td>

                    ${booking.flightNo}

                </td>

            </tr>

            <tr>

                <td>

                    Route

                </td>

                <td>

                    ${booking.origin}
                    →
                    ${booking.destination}

                </td>

            </tr>

            <tr>

                <td>

                    Departure

                </td>

                <td>

                    ${booking.departure}

                </td>

            </tr>

            <tr>

                <td>

                    Arrival

                </td>

                <td>

                    ${booking.arrival}

                </td>

            </tr>

            <tr>

                <td>

                    Amount

                </td>

                <td>

                    ₹${booking.amount}

                </td>

            </tr>

        </table>

        <br>

        <a

            href="http://localhost:3000/ticket.html?pnr=${booking.pnr}"

            style="
                background:#1f3c88;
                color:white;
                padding:12px 20px;
                text-decoration:none;
                border-radius:5px;
            "

        >

            View Ticket

        </a>

        <br><br>

        <p>

            Thank you for booking with
            THAKKAR TRAVELS

        </p>

    </div>

    `

    );
    console.log(

    "EMAIL:",

    booking.contactEmail

);

const mailStatus = await sendMail(

    booking.contactEmail,

    `Flight Ticket - ${booking.pnr}`,

    

);

console.log(

    "MAIL STATUS:",

    mailStatus

);
    // ================= UPDATE GOOGLE SHEET =================

    try {

        const updateRes =
        await fetch(

'https://script.google.com/macros/s/AKfycbw-0nNFmUVi9OBmqHmKvN2-3oRtMkuAk9K6wDe35djhSRQ-wHesRpCJzR3h057oVgyjMQ/exec',

        {

            method: 'POST',

            headers: {

                'Content-Type':
                'application/json'

            },

            body: JSON.stringify({

    flight:
        flight.flightNo || flight.flight,

    doj:
        flight.date || flight.doj,

    origin:
        flight.origin,

    destination:
        flight.destination,

    bookedSeats:
        passengers.length

})

        });
console.log("SHEET API CALLED");
        const updateData =
        await updateRes.text();

        console.log(
            "GOOGLE UPDATE:",
            updateData
        );

    }

    catch (err) {

        console.log(

            "GOOGLE UPDATE FAILED",

            err.message

        );

    }

    // ================= FINAL RESPONSE =================

    res.json({

        success: true,

        message:
        "Booking success ✅",

        booking

    });

}

catch (err) {

    console.log(err);

    res.status(500).json({

        error:
        "Booking failed ❌"

    });

}

});



// ================= MY BOOKINGS =================
router.get('/my', requireLogin, async (req, res) => {
    try {
        const bookings = await Booking.find({
            userId: req.session.user.id
        }).populate('flightId');

        res.json(bookings);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to load bookings ❌" });
    }
});
router.get('/wallet', requireLogin, async (req, res) => {
    const tx = await Transaction.find({
        userId: req.session.user.id
    }).sort({ date: -1 });

    res.json(tx);
});
// ================= GET TICKET =================

router.get('/ticket/:pnr', async (req, res) => {

    try {

        const booking =
        await Booking.findOne({

            pnr: req.params.pnr

        });

        if (!booking) {

            return res.json({

                success: false,

                error:
                "Ticket not found ❌"

            });

        }

        res.json({

            success: true,

            booking

        });

    }

    catch(err){

    console.log(err);

    try{

        await sendMail(

            'thakkartravels.dasani@gmail.com',

            'Booking Failed Alert',

            `

            <h2>Booking Failure</h2>

            <p>

                Error:

                ${err.message}

            </p>

            <pre>

                ${JSON.stringify(req.body,null,2)}

            </pre>

            `

        );

    }

    catch(mailErr){

        console.log(mailErr);

    }

    res.status(500).json({

        error:'Booking failed ❌'

    });

}

});

module.exports = router;