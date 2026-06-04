const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({

    airline: String,

    flightNo: String,

    origin: String,

    destination: String,

    departure: String,

    arrival: String,

    baseFare: Number,

    seats: Number,

    date: String,
    SOURCE: String

});

module.exports = mongoose.model(
    'Flight',
    flightSchema
);