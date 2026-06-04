const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({

    title: String,

    firstName: String,

    lastName: String,

    name: String,

    gender: String,

    type: String,

    dob: String,

    seat: String
    

}, { _id: false });

const bookingSchema = new mongoose.Schema({

    userId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'User'

    },

    flightId: String,

    pnr: String,

    airlinePnr: String,

    airline: String,

    flightNo: String,

    origin: String,

    destination: String,

    departure: String,

    arrival: String,

    date: String,

    amount: Number,
     // ADD THIS
    qrData: {
        type: String,
        default: ''
    },

    status: {

        type: String,

        default: 'CONFIRMED'

    },

    contactName: String,

    contactMobile: String,

    contactEmail: String,

    passengers: [passengerSchema]

}, {

    timestamps: true

});

module.exports = mongoose.models.Booking ||

mongoose.model('Booking', bookingSchema);