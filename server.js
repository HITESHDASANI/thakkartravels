
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const helmet = require('helmet');

const app = express();

app.use(helmet());

const phonepeRoutes = require('./routes/phonepeRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const flightRoutes = require('./routes/flightRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const searchRoutes = require('./routes/searchRoutes');
const eflyRoutes = require('./routes/eflyRoutes');

// ================= SERVICES =================
const {
    loginEfly,
    searchFlights
} = require('./services/eflyService');

// ================= MODELS =================
const User = require('./models/User');
const Booking = require('./models/Booking');
const Flight = require('./models/Flight');

// ================= MAILER =================
const sendMail = require('./utils/mailer');

// ================= START EFLY =================
loginEfly();


// ================= SEND TICKET EMAIL =================

app.get('/api/send-ticket/:pnr', async(req,res)=>{

    try{

        const booking =
        await Booking.findOne({

            pnr:req.params.pnr

        });

        if(!booking){

            return res.json({

                success:false,
                message:"Booking Not Found"

            });

        }

        await sendMail(

            booking.contactEmail,

            `Flight Ticket - ${booking.pnr}`,

            `

            <h2>

                Booking Confirmed

            </h2>

            <p>

                PNR:
                ${booking.pnr}

            </p>

            <a href="http://localhost:3000/ticket.html?pnr=${booking.pnr}">

                View Ticket

            </a>

            `

        );

        res.json({

            success:true,
            message:"Ticket Email Sent ✅"

        });

    }

    catch(err){

        console.log(err);

        res.json({

            success:false,
            message:"Email Failed"

        });

    }

});

// ================== MIDDLEWARE ==================
app.use((req, res, next) => {

    res.setHeader(

        "Content-Security-Policy",

        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: http:; connect-src *; img-src * data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';"

    );

    next();

});
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use('/api', searchRoutes);
app.use('/phonepe', phonepeRoutes);

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use('/api/efly', eflyRoutes);
const isProduction =

process.env.NODE_ENV === 'production';

app.use(session({

    secret:process.env.SESSION_SECRET || 'secretkey',

    resave:false,

    saveUninitialized:false,

    cookie:{

        secure:isProduction,

        httpOnly:true,

        sameSite:'lax'

    }

}));
app.use('/booking', bookingRoutes);


// ================== GET TICKET BY PNR ==================

app.get('/api/ticket/:pnr', async (req, res) => {

    try {

        const booking = await Booking.findOne({

            pnr: req.params.pnr

        });

        if (!booking) {

            return res.status(404).json({

                success: false,
                message: 'Ticket Not Found'

            });

        }

        res.json({

            success: true,
            booking

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,
            error: err.message

        });

    }

});
// ================== TEST USER ==================  
/*app.get("'/auth/me'", (req, res) => {
  res.json({
    email: "test@gmail.com",
    balance: 15000
  });
});*/
// ================== CURRENT USER ==================
app.get('/auth/me', async (req, res) => {
    try {
        if (!req.session?.user) {
            return res.status(401).json({ error: "Login required ❌" });
        }

        const user = await User.findById(req.session.user.id);

        if (!user) {
            return res.status(401).json({ error: "User not found ❌" });
        }

        res.json({
            name: user.email,
            balance: Number(user.balance || 0),
            role: user.role
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error ❌" });
    }
});

// ================== CREATE ADMIN ==================
app.get('/create-admin', async (req, res) => {
    try {
        const existing = await User.findOne({ email: "admin@thakkartravels.com" });

        if (existing) return res.send("Admin already exists ⚠️");

        const hash = await bcrypt.hash("123456", 10);

        await User.create({
            email: "ops@thakkartravels.com",
            password: hash,
            role: "admin",
            balance: 25000
        });

        res.send("Admin created ✅");


    } catch (err) {
        console.log(err);
        res.status(500).send("Error creating admin ❌");
    }
    
});



app.get('/search-all', async (req, res) => {

    try {

        const {

            origin,
            destination,
            departuredate

        } = req.query;
console.log(departuredate);
        // ================= GOOGLE SHEET =================

        const sheetRes = await fetch(

`https://script.google.com/macros/s/AKfycbw-0nNFmUVi9OBmqHmKvN2-3oRtMkuAk9K6wDe35djhSRQ-wHesRpCJzR3h057oVgyjMQ/exec?origin=${origin}&destination=${destination}`

        );

        const sheetRaw = await sheetRes.json();

        const sheetFlights = sheetRaw

        .filter(f => {

            const sheetDate =

                (f.doj || '')

                .split('/')

                .reverse()

                .join('-');

            const sector =

                `${origin}-${destination}`

                .toUpperCase();

            const sheetName =

                (f.sheetName || '')

                .toUpperCase();

            return (

                sheetDate === departuredate &&

                sheetName.includes(sector)

            );

        })

        .map(f => ({

            ...f,

            origin: origin.toUpperCase(),

            destination: destination.toUpperCase(),

            source: 'sheet'

        }));

        // ================= MONGODB =================

        const mongoFlights = await Flight.find({

    origin:
        origin.toUpperCase(),

    destination:
        destination.toUpperCase(),

    date: {

    $regex:

    departuredate

}

});

        const formattedMongo = mongoFlights.map(f => ({

            _id: f._id,

            flight: f.flightNo,

            origin: f.origin,

            destination: f.destination,

            doj: f.date,

            depTime: f.departure,

            arrival: f.arrival,

            pax: f.seats,

            fare: f.baseFare,

            source: 'mongodb'

        }));

        // ================= EFLY =================

        const eflyData = await searchFlights(

            origin.toUpperCase(),

            destination.toUpperCase(),

            departuredate

        );

        const formattedEfly = eflyData.map(f => ({

            flight:

                f.segments?.[0]?.flight_no || '--',

            origin:

                f.segments?.[0]?.origin || origin,

            destination:

                f.segments?.[0]?.destination || destination,

            doj:

                f.segments?.[0]?.departure_date || '--',

            depTime:

                `${f.segments?.[0]?.departure_time || '--'} - ${f.segments?.[0]?.arrival_time || '--'}`,

            pax:

                f.seat || '--',

            fare:

                f.total_fare || '--',

            arrival:

                f.segments?.[0]?.arrival_time || '--',

            source:

                'efly'

        }));

        // ================= MARKUP =================

        const Setting = require('./models/Setting');

const setting = await Setting.findOne();

let markup = 0;

const role =
req.session?.user?.role || 'user';

if(role === 'user'){

    markup =
    Number(setting?.userMarkup ?? 0);

}

else if(role === 'agent'){

    markup =
    Number(setting?.agentMarkup ?? 0);

}

else if(role === 'admin'){

    markup =
    Number(setting?.adminMarkup ?? 0);

}

console.log(
    'ROLE =', role,
    'MARKUP =', markup
);

        // ================= FINAL =================

        const allFlights = [

            ...sheetFlights,
            ...formattedMongo,
            ...formattedEfly

        ].map(f => ({

            ...f,

            fare:

                Number(f.fare || 0)

                + Number(markup)

        }));

        console.log("FINAL DATA:", allFlights);

        res.json(allFlights);

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error: err.message

        });

    }

});
// ================== STATIC ==================


// ================== ROUTES ==================
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/flights', flightRoutes);
app.use('/uploads',express.static('uploads'));


// ================== DB ==================
mongoose.connect("mongodb://127.0.0.1:27017/thakkartravels")
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

// ================== START ==================
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

